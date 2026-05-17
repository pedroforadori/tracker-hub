import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword } from '../../common/utils/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    tenantId: true,
    createdAt: true,
  } as const;

  findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: this.USER_SELECT,
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: { id, tenantId },
      select: this.USER_SELECT,
    });
  }

  countByRole(tenantId: string, role: UserRole) {
    return this.prisma.user.count({ where: { tenantId, role } });
  }

  async create(dto: CreateUserDto, tenantId: string) {
    const hashed = await hashPassword(dto.password);
    return this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed, role: UserRole.USER, tenantId },
      select: this.USER_SELECT,
    });
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto) {
    const data: Record<string, unknown> = { name: dto.name, email: dto.email };
    if (dto.password) data.password = await hashPassword(dto.password);
    return this.prisma.user.update({
      where: { id, tenantId },
      data,
      select: this.USER_SELECT,
    });
  }

  remove(id: string, tenantId: string) {
    return this.prisma.user.delete({ where: { id, tenantId } });
  }
}
