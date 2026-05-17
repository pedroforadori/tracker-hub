import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { TrackersRepository } from './trackers.repository';

interface CurrentUser { tenantId: string }

@Injectable()
export class TrackersService {
  constructor(private readonly repo: TrackersRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const t = await this.repo.findOne(id, user.tenantId);
    if (!t) throw new NotFoundException(`Rastreador #${id} não encontrado`);
    return t;
  }

  create(dto: CreateTrackerDto, user: CurrentUser) { return this.repo.create(dto, user.tenantId); }

  async update(id: string, dto: UpdateTrackerDto, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.update(id, user.tenantId, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id, user.tenantId);
  }
}
