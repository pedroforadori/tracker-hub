import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { hashPassword } from '../common/utils/password.util';
import { BillingService } from '../modules/billing/billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/types/current-user.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private billing: BillingService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const hashed = await hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: dto.tenantName } });
      return tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashed,
          role: UserRole.ADMIN,
          tenantId: tenant.id,
        },
      });
    });

    // Create Stripe Customer + trial subscription asynchronously — failure does not block registration.
    // Retries once after 10 s to handle transient Stripe errors.
    this.createStripeSubscriptionWithRetry(user.tenantId, user.email, user.name);

    return this.signToken(user.id, user.email, user.role, user.tenantId, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.signToken(user.id, user.email, user.role, user.tenantId, user.name);
  }

  async getProfile(currentUser: CurrentUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, name: true, email: true, role: true, tenantId: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateProfile(currentUser: CurrentUser, dto: UpdateProfileDto) {
    const data: { name?: string; password?: string } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.password) data.password = await hashPassword(dto.password);

    // Nada para atualizar — retorna o perfil atual sem query de escrita
    if (Object.keys(data).length === 0) {
      return this.getProfile(currentUser);
    }

    return this.prisma.user.update({
      where: { id: currentUser.id },
      data,
      select: { id: true, name: true, email: true, role: true, tenantId: true },
    });
  }

  private createStripeSubscriptionWithRetry(tenantId: string, email: string, name: string): void {
    const attempt = (retriesLeft: number) => {
      this.billing
        .createCustomerAndSubscription(tenantId, email, name)
        .catch((err) => {
          this.logger.error('Failed to create Stripe subscription on register', err);
          if (retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), 10_000);
          }
        });
    };
    attempt(1);
  }

  private signToken(id: string, email: string, role: UserRole, tenantId: string, name: string) {
    const payload = { sub: id, email, role, tenantId };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id, email, name, role, tenantId },
    };
  }
}
