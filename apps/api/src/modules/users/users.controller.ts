import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
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
  findAll(@Request() req: { user: { tenantId: string; role: UserRole; id: string } }) {
    return this.service.findAll(req.user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Adicionar membro à equipe (máx. 3 usuários)' })
  create(
    @Body() dto: CreateUserDto,
    @Request() req: { user: { tenantId: string; role: UserRole; id: string } },
  ) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar membro da equipe' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: { tenantId: string; role: UserRole; id: string } },
  ) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover membro da equipe' })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { tenantId: string; role: UserRole; id: string } },
  ) {
    return this.service.remove(id, req.user);
  }
}
