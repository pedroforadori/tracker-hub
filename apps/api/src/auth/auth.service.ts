import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { hashPassword } from '../common/utils/password.util';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const tenant = await this.prisma.tenant.create({ data: { name: dto.tenantName } });
    const hashed = await hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        role: UserRole.ADMIN,
        tenantId: tenant.id,
      },
    });
    return this.signToken(user.id, user.email, user.role, user.tenantId);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.signToken(user.id, user.email, user.role, user.tenantId);
  }

  private signToken(id: string, email: string, role: UserRole, tenantId: string) {
    const payload = { sub: id, email, role, tenantId };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id, email, role, tenantId },
    };
  }
}
