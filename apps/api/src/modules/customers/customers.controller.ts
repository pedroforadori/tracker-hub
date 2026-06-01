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
import type { SpreadsheetFormat } from '../../common/utils/spreadsheet.util';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes do tenant' })
  findAll(@CurrentUserDecorator() user: CurrentUser) {
    return this.service.findAll(user);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar clientes por período (CSV ou XLSX)' })
  async export(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('format') format: SpreadsheetFormat = 'xlsx',
    @CurrentUserDecorator() user: CurrentUser,
    @Res() res: Response,
  ) {
    if (!from || !to) throw new BadRequestException('Parâmetros from e to são obrigatórios');
    const result = await this.service.exportByDateRange(from, to, format, user);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Baixar modelo de importação de clientes' })
  getImportTemplate(
    @Query('format') format: SpreadsheetFormat = 'xlsx',
    @Res() res: Response,
  ) {
    const result = this.service.getImportTemplate(format);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar clientes via CSV ou XLSX' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importFromFile(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.service.importFromFile(file, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  findOne(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo cliente' })
  create(@Body() dto: CreateCustomerDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  remove(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.service.remove(id, user);
  }
}
