import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChipDto } from './dto/create-chip.dto';
import { UpdateChipDto } from './dto/update-chip.dto';
import { ChipsRepository } from './chips.repository';

interface CurrentUser { tenantId: string }

@Injectable()
export class ChipsService {
  constructor(private readonly repo: ChipsRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const chip = await this.repo.findOne(id, user.tenantId);
    if (!chip) throw new NotFoundException(`Chip #${id} não encontrado`);
    return chip;
  }

  create(dto: CreateChipDto, user: CurrentUser) { return this.repo.create(dto, user.tenantId); }

  async update(id: string, dto: UpdateChipDto, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.update(id, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id);
  }
}
