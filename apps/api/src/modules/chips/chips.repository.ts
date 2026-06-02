import { Injectable } from '@nestjs/common';
import { EXPORT_ROW_LIMIT } from '../../common/utils/spreadsheet.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChipDto } from './dto/create-chip.dto';
import { UpdateChipDto } from './dto/update-chip.dto';

@Injectable()
export class ChipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.chip.findMany({
      where: { tenantId },
      include: { tracker: { select: { id: true, imei: true } } },
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.chip.findFirst({ where: { id, tenantId }, include: { tracker: true } });
  }

  create(dto: CreateChipDto, tenantId: string) {
    return this.prisma.chip.create({ data: { ...dto, tenantId } });
  }

  update(id: string, tenantId: string, dto: UpdateChipDto) {
    return this.prisma.chip.update({ where: { id, tenantId }, data: dto });
  }

  findByTrackerId(trackerId: string, tenantId: string) {
    return this.prisma.chip.findFirst({ where: { trackerId, tenantId } });
  }

  remove(id: string, tenantId: string) {
    return this.prisma.chip.delete({ where: { id, tenantId } });
  }

  findByDateRange(tenantId: string, from: Date, to: Date) {
    return this.prisma.chip.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      include: { tracker: { select: { imei: true } } },
      orderBy: { createdAt: 'asc' },
      take: EXPORT_ROW_LIMIT + 1,
    });
  }

  findTrackerByImei(imei: string, tenantId: string) {
    return this.prisma.tracker.findFirst({ where: { imei, tenantId } });
  }

  createMany(dtos: CreateChipDto[], tenantId: string) {
    return this.prisma.chip.createMany({ data: dtos.map((d) => ({ ...d, tenantId })) });
  }
}
