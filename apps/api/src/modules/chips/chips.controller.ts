import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateChipDto } from './dto/create-chip.dto';
import { UpdateChipDto } from './dto/update-chip.dto';
import { ChipsService } from './chips.service';

@ApiTags('Chips')
@ApiBearerAuth()
@Controller('chips')
export class ChipsController {
  constructor(private readonly service: ChipsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar chips do tenant' })
  findAll(@Request() req: { user: { tenantId: string } }) { return this.service.findAll(req.user); }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar chip por ID' })
  findOne(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar chip' })
  create(@Body() dto: CreateChipDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar chip' })
  update(@Param('id') id: string, @Body() dto: UpdateChipDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover chip' })
  remove(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.remove(id, req.user);
  }
}
