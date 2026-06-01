import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';

@Injectable()
export class TrackersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.tracker.findMany({
      where: { tenantId },
      include: { vehicle: { select: { id: true, plate: true } }, chip: true },
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.tracker.findFirst({
      where: { id, tenantId },
      include: { vehicle: true, chip: true },
    });
  }

  create(dto: CreateTrackerDto, tenantId: string) {
    return this.prisma.tracker.create({ data: { ...dto, tenantId } });
  }

  update(id: string, tenantId: string, dto: UpdateTrackerDto) {
    return this.prisma.tracker.update({ where: { id, tenantId }, data: dto });
  }

  remove(id: string, tenantId: string) {
    return this.prisma.tracker.delete({ where: { id, tenantId } });
  }

  findByDateRange(tenantId: string, from: Date, to: Date) {
    return this.prisma.tracker.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      include: { vehicle: { select: { plate: true } }, chip: { select: { iccid: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  findVehicleByPlate(plate: string, tenantId: string) {
    return this.prisma.vehicle.findFirst({ where: { plate, tenantId } });
  }
}
