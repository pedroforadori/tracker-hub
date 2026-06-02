import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '../../common/types/current-user.type';
import {
  EXPORT_ROW_LIMIT,
  GenerateResult,
  SpreadsheetFormat,
  generateSpreadsheet,
  parseDateRangeUTC,
  parseSpreadsheet,
} from '../../common/utils/spreadsheet.util';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesRepository } from './vehicles.repository';

const IMPORT_HEADERS = ['Placa', 'Marca', 'Modelo', 'Ano', 'CNPJ do Cliente'];
const EXPORT_HEADERS = [...IMPORT_HEADERS, 'Nome do Cliente', 'Criado em'];

@Injectable()
export class VehiclesService {
  constructor(private readonly repo: VehiclesRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const v = await this.repo.findOne(id, user.tenantId);
    if (!v) throw new NotFoundException(`Veículo #${id} não encontrado`);
    return v;
  }

  create(dto: CreateVehicleDto, user: CurrentUser) { return this.repo.create(dto, user.tenantId); }

  async update(id: string, dto: UpdateVehicleDto, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.update(id, user.tenantId, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id, user.tenantId);
  }

  getImportTemplate(format: SpreadsheetFormat): GenerateResult {
    return generateSpreadsheet(IMPORT_HEADERS, [], 'veiculos', format);
  }

  async exportByDateRange(
    from: string,
    to: string,
    format: SpreadsheetFormat,
    user: CurrentUser,
  ): Promise<GenerateResult> {
    const { fromDate, toDate } = parseDateRangeUTC(from, to);
    const records = await this.repo.findByDateRange(user.tenantId, fromDate, toDate);
    if (records.length > EXPORT_ROW_LIMIT) {
      throw new BadRequestException(
        `Período selecionado excede ${EXPORT_ROW_LIMIT.toLocaleString()} registros. Reduza o intervalo de datas.`,
      );
    }
    const rows = records.map((v) => ({
      Placa: v.plate,
      Marca: v.brand,
      Modelo: v.model,
      Ano: v.year,
      'CNPJ do Cliente': v.customer?.cnpj ?? '',
      'Nome do Cliente': v.customer?.name ?? '',
      'Criado em': v.createdAt.toISOString(),
    }));
    return generateSpreadsheet(EXPORT_HEADERS, rows, 'veiculos', format);
  }

  async importFromFile(
    file: { buffer: Buffer; originalname: string },
    user: CurrentUser,
  ): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    const rows = parseSpreadsheet(file.buffer, file.originalname);
    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    type Payload = { plate: string; brand: string; model: string; year: number; customerId: string };
    const validPayloads: { data: Payload; rowNum: number }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const plate = String(row['Placa'] ?? '').trim().toUpperCase();
      const brand = String(row['Marca'] ?? '').trim();
      const model = String(row['Modelo'] ?? '').trim();
      const year = parseInt(String(row['Ano'] ?? '0'), 10);
      const cnpj = String(row['CNPJ do Cliente'] ?? '').replace(/\D/g, '');

      if (!plate) { errors.push({ row: rowNum, message: 'Placa é obrigatória' }); continue; }
      if (!brand) { errors.push({ row: rowNum, message: 'Marca é obrigatória' }); continue; }
      if (!model) { errors.push({ row: rowNum, message: 'Modelo é obrigatório' }); continue; }
      if (!year || year < 1990) { errors.push({ row: rowNum, message: 'Ano inválido (mínimo 1990)' }); continue; }
      if (cnpj.length !== 14) { errors.push({ row: rowNum, message: 'CNPJ do Cliente inválido (deve ter 14 dígitos)' }); continue; }

      const customer = await this.repo.findCustomerByCnpj(cnpj, user.tenantId);
      if (!customer) { errors.push({ row: rowNum, message: `Cliente com CNPJ ${cnpj} não encontrado` }); continue; }

      validPayloads.push({ data: { plate, brand, model, year, customerId: customer.id }, rowNum });
    }

    if (validPayloads.length > 0) {
      try {
        await this.repo.createMany(validPayloads.map((p) => p.data), user.tenantId);
        imported = validPayloads.length;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao inserir no banco';
        for (const { rowNum } of validPayloads) {
          errors.push({ row: rowNum, message: msg });
        }
      }
    }

    return { imported, errors };
  }
}
