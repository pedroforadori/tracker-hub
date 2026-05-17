import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import type { CurrentUser } from '../../common/types/current-user.type';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { TrackersService } from './trackers.service';

@ApiTags('Rastreadores')
@ApiBearerAuth()
@Controller('trackers')
export class TrackersController {
  constructor(private readonly service: TrackersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar rastreadores do tenant' })
  findAll(@CurrentUserDecorator() user: CurrentUser) { return this.service.findAll(user); }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar rastreador por ID' })
  findOne(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar rastreador' })
  create(@Body() dto: CreateTrackerDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar rastreador' })
  update(@Param('id') id: string, @Body() dto: UpdateTrackerDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover rastreador' })
  remove(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.remove(id, user);
  }
}
