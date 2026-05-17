import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
    });
  }

  findOneByTenant(id: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
    });
  }

  countByRole(tenantId: string, role: UserRole) {
    return this.prisma.user.count({ where: { tenantId, role } });
  }

  async create(dto: CreateUserDto, tenantId: string) {
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed, role: UserRole.USER, tenantId },
      select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto) {
    const data: Record<string, unknown> = { name: dto.name, email: dto.email };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
