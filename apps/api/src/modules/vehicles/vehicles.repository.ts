import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.vehicle.findMany({
      where: { tenantId },
      include: { customer: { select: { id: true, name: true } }, trackers: true },
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: { customer: true, trackers: { include: { chip: true } } },
    });
  }

  create(dto: CreateVehicleDto, tenantId: string) {
    return this.prisma.vehicle.create({ data: { ...dto, tenantId } });
  }

  update(id: string, tenantId: string, dto: UpdateVehicleDto) {
    return this.prisma.vehicle.update({ where: { id, tenantId }, data: dto });
  }

  remove(id: string, tenantId: string) {
    return this.prisma.vehicle.delete({ where: { id, tenantId } });
  }
}
