import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import type { CurrentUser } from '../../common/types/current-user.type';
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
  findAll(@CurrentUserDecorator() user: CurrentUser) { return this.service.findAll(user); }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar chip por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar chip' })
  create(@Body() dto: CreateChipDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar chip' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChipDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover chip' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.remove(id, user);
  }
}
