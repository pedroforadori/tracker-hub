import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

const MAX_SECONDARY_USERS = 3;

interface CurrentUser {
  id: string;
  tenantId: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  findAll(currentUser: CurrentUser) {
    return this.repo.findAllByTenant(currentUser.tenantId);
  }

  async findOne(id: string, currentUser: CurrentUser) {
    const user = await this.repo.findOneByTenant(id, currentUser.tenantId);
    if (!user) throw new NotFoundException(`Usuário #${id} não encontrado`);
    return user;
  }

  async create(dto: CreateUserDto, currentUser: CurrentUser) {
    const count = await this.repo.countByRole(currentUser.tenantId, UserRole.USER);
    if (count >= MAX_SECONDARY_USERS) {
      throw new ForbiddenException(
        `Limite de ${MAX_SECONDARY_USERS} usuários adicionais atingido`,
      );
    }
    return this.repo.create(dto, currentUser.tenantId);
  }

  async update(id: string, dto: UpdateUserDto, currentUser: CurrentUser) {
    await this.findOne(id, currentUser);
    return this.repo.update(id, currentUser.tenantId, dto);
  }

  async remove(id: string, currentUser: CurrentUser) {
    await this.findOne(id, currentUser);
    return this.repo.remove(id, currentUser.tenantId);
  }
}
