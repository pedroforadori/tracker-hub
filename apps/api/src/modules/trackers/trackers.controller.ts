import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  findAll(@Request() req: { user: { tenantId: string } }) { return this.service.findAll(req.user); }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar rastreador por ID' })
  findOne(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar rastreador' })
  create(@Body() dto: CreateTrackerDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar rastreador' })
  update(@Param('id') id: string, @Body() dto: UpdateTrackerDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover rastreador' })
  remove(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.remove(id, req.user);
  }
}
