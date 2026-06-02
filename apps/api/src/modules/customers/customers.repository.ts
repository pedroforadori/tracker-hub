import { Injectable } from '@nestjs/common';
import { EXPORT_ROW_LIMIT } from '../../common/utils/spreadsheet.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.customer.findMany({ where: { tenantId }, include: { vehicles: true } });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.customer.findFirst({ where: { id, tenantId }, include: { vehicles: true } });
  }

  create(dto: CreateCustomerDto, tenantId: string) {
    return this.prisma.customer.create({ data: { ...dto, tenantId } });
  }

  update(id: string, tenantId: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({ where: { id, tenantId }, data: dto });
  }

  remove(id: string, tenantId: string) {
    return this.prisma.customer.delete({ where: { id, tenantId } });
  }

  findByDateRange(tenantId: string, from: Date, to: Date) {
    return this.prisma.customer.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'asc' },
      take: EXPORT_ROW_LIMIT + 1,
    });
  }

  createMany(dtos: CreateCustomerDto[], tenantId: string) {
    return this.prisma.customer.createMany({ data: dtos.map((d) => ({ ...d, tenantId })) });
  }
}
