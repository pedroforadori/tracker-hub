import { Injectable } from '@nestjs/common';
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

  update(id: string, dto: UpdateChipDto) {
    return this.prisma.chip.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.chip.delete({ where: { id } });
  }
}
