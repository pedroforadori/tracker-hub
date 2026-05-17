import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import type { CurrentUser } from '../../common/types/current-user.type';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Veículos')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar veículos do tenant' })
  findAll(@CurrentUserDecorator() user: CurrentUser) { return this.service.findAll(user); }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  findOne(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar veículo' })
  create(@Body() dto: CreateVehicleDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover veículo' })
  remove(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.remove(id, user);
  }
}
