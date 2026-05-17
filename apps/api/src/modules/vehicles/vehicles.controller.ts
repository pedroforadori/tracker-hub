import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  findAll(@Request() req: { user: { tenantId: string } }) { return this.service.findAll(req.user); }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  findOne(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar veículo' })
  create(@Body() dto: CreateVehicleDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover veículo' })
  remove(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.remove(id, req.user);
  }
}
