import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import type { CurrentUser } from '../../common/types/current-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Equipe')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar membros da equipe (somente ADMIN)' })
  findAll(@CurrentUserDecorator() user: CurrentUser) {
    return this.service.findAll(user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Adicionar membro à equipe (máx. 3 usuários)' })
  create(@Body() dto: CreateUserDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar membro da equipe' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover membro da equipe' })
  remove(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.remove(id, user);
  }
}
