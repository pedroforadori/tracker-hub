import { Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '../../common/types/current-user.type';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const c = await this.repo.findOne(id, user.tenantId);
    if (!c) throw new NotFoundException(`Cliente #${id} não encontrado`);
    return c;
  }

  create(dto: CreateCustomerDto, user: CurrentUser) { return this.repo.create(dto, user.tenantId); }

  async update(id: string, dto: UpdateCustomerDto, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.update(id, user.tenantId, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id, user.tenantId);
  }
}
