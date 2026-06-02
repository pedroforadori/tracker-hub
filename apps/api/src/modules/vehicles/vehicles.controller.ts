import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import type { CurrentUser } from '../../common/types/current-user.type';
import { VALID_FORMATS, type SpreadsheetFormat } from '../../common/utils/spreadsheet.util';
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

  @Get('export')
  @ApiOperation({ summary: 'Exportar veículos por período (CSV ou XLSX)' })
  async export(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('format') format: SpreadsheetFormat = 'xlsx',
    @CurrentUserDecorator() user: CurrentUser,
    @Res() res: Response,
  ) {
    if (!from || !to) throw new BadRequestException('Parâmetros from e to são obrigatórios');
    if (!VALID_FORMATS.includes(format)) throw new BadRequestException('Formato inválido. Use xlsx ou csv');
    const result = await this.service.exportByDateRange(from, to, format, user);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Baixar modelo de importação de veículos' })
  getImportTemplate(
    @Query('format') format: SpreadsheetFormat = 'xlsx',
    @Res() res: Response,
  ) {
    if (!VALID_FORMATS.includes(format)) throw new BadRequestException('Formato inválido. Use xlsx ou csv');
    const result = this.service.getImportTemplate(format);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar veículos via CSV ou XLSX' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  importFromFile(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.service.importFromFile(file, user);
  }

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
