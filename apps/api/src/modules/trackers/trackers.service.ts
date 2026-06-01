import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '../../common/types/current-user.type';
import {
  GenerateResult,
  SpreadsheetFormat,
  generateSpreadsheet,
  parseSpreadsheet,
} from '../../common/utils/spreadsheet.util';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { TrackersRepository } from './trackers.repository';

const IMPORT_HEADERS = ['IMEI', 'Marca', 'Modelo', 'Placa do Veículo'];
const EXPORT_HEADERS = [...IMPORT_HEADERS, 'ICCID do Chip', 'Criado em'];

@Injectable()
export class TrackersService {
  constructor(private readonly repo: TrackersRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const t = await this.repo.findOne(id, user.tenantId);
    if (!t) throw new NotFoundException(`Rastreador #${id} não encontrado`);
    return t;
  }

  create(dto: CreateTrackerDto, user: CurrentUser) { return this.repo.create(dto, user.tenantId); }

  async update(id: string, dto: UpdateTrackerDto, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.update(id, user.tenantId, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id, user.tenantId);
  }

  getImportTemplate(format: SpreadsheetFormat): GenerateResult {
    return generateSpreadsheet(IMPORT_HEADERS, [], 'rastreadores', format);
  }

  async exportByDateRange(
    from: string,
    to: string,
    format: SpreadsheetFormat,
    user: CurrentUser,
  ): Promise<GenerateResult> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    const records = await this.repo.findByDateRange(user.tenantId, fromDate, toDate);
    const rows = records.map((t) => ({
      IMEI: t.imei,
      Marca: t.brand,
      Modelo: t.model,
      'Placa do Veículo': t.vehicle?.plate ?? '',
      'ICCID do Chip': t.chip?.iccid ?? '',
      'Criado em': t.createdAt.toISOString(),
    }));
    return generateSpreadsheet(EXPORT_HEADERS, rows, 'rastreadores', format);
  }

  async importFromFile(
    file: { buffer: Buffer; originalname: string },
    user: CurrentUser,
  ): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    const rows = parseSpreadsheet(file.buffer, file.originalname);
    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      try {
        const imei = String(row['IMEI'] ?? '').replace(/\D/g, '');
        const brand = String(row['Marca'] ?? '').trim();
        const model = String(row['Modelo'] ?? '').trim();
        const plate = String(row['Placa do Veículo'] ?? '').trim().toUpperCase();

        if (imei.length !== 15) { errors.push({ row: rowNum, message: 'IMEI inválido (deve ter 15 dígitos)' }); continue; }
        if (!brand) { errors.push({ row: rowNum, message: 'Marca é obrigatória' }); continue; }
        if (!model) { errors.push({ row: rowNum, message: 'Modelo é obrigatório' }); continue; }
        if (!plate) { errors.push({ row: rowNum, message: 'Placa do Veículo é obrigatória' }); continue; }

        const vehicle = await this.repo.findVehicleByPlate(plate, user.tenantId);
        if (!vehicle) { errors.push({ row: rowNum, message: `Veículo com placa ${plate} não encontrado` }); continue; }

        await this.repo.create({ imei, brand, model, vehicleId: vehicle.id }, user.tenantId);
        imported++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        errors.push({ row: rowNum, message: msg });
      }
    }

    return { imported, errors };
  }
}
