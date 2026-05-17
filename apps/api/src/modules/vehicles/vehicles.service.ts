import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesRepository } from './vehicles.repository';

interface CurrentUser { tenantId: string }

@Injectable()
export class VehiclesService {
  constructor(private readonly repo: VehiclesRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const v = await this.repo.findOne(id, user.tenantId);
    if (!v) throw new NotFoundException(`Veículo #${id} não encontrado`);
    return v;
  }

  create(dto: CreateVehicleDto, user: CurrentUser) { return this.repo.create(dto, user.tenantId); }

  async update(id: string, dto: UpdateVehicleDto, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.update(id, user.tenantId, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id, user.tenantId);
  }
}
