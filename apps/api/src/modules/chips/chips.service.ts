import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '../../common/types/current-user.type';
import { CreateChipDto } from './dto/create-chip.dto';
import { UpdateChipDto } from './dto/update-chip.dto';
import { ChipsRepository } from './chips.repository';

@Injectable()
export class ChipsService {
  constructor(private readonly repo: ChipsRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const chip = await this.repo.findOne(id, user.tenantId);
    if (!chip) throw new NotFoundException(`Chip #${id} não encontrado`);
    return chip;
  }

  async create(dto: CreateChipDto, user: CurrentUser) {
    const existing = await this.repo.findByTrackerId(dto.trackerId, user.tenantId);
    if (existing) throw new ConflictException('Este rastreador já possui um chip vinculado');
    return this.repo.create(dto, user.tenantId);
  }

  async update(id: string, dto: UpdateChipDto, user: CurrentUser) {
    await this.findOne(id, user);
    if (dto.trackerId) {
      const conflict = await this.repo.findByTrackerId(dto.trackerId, user.tenantId);
      if (conflict && conflict.id !== id)
        throw new ConflictException('Este rastreador já possui um chip vinculado');
    }
    return this.repo.update(id, user.tenantId, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id, user.tenantId);
  }
}
