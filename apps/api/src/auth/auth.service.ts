import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { hashPassword } from '../common/utils/password.util';
import { BillingService } from '../modules/billing/billing.service';
import { MailService } from '../modules/mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/types/current-user.type';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private billing: BillingService,
    private mail: MailService,
    private config: ConfigService,
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) return { ok: true }; // resposta idêntica — sem leak de enumeração (OWASP A07)

    const rawToken = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: hash, passwordResetExpiry: expiry },
    });

    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:5173');
    const resetUrl = `${webUrl}/redefinir-senha?token=${rawToken}`;

    // Fire-and-forget — erros são logados internamente pelo MailService
    void this.mail.sendPasswordReset(user.email, resetUrl);

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hash = createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: hash },
    });

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const hashedPassword = await hashPassword(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return { ok: true };
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
