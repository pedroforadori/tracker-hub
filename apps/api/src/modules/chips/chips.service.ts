import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '../../common/types/current-user.type';
import {
  GenerateResult,
  SpreadsheetFormat,
  generateSpreadsheet,
  parseSpreadsheet,
} from '../../common/utils/spreadsheet.util';
import { CreateChipDto } from './dto/create-chip.dto';
import { UpdateChipDto } from './dto/update-chip.dto';
import { ChipsRepository } from './chips.repository';

const IMPORT_HEADERS = ['ICCID', 'Número de Telefone', 'Operadora', 'IMEI do Rastreador'];
const EXPORT_HEADERS = [...IMPORT_HEADERS, 'Criado em'];

@Injectable()
export class ChipsService {
  constructor(private readonly repo: ChipsRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const chip = await this.repo.findOne(id, user.tenantId);
    if (!chip) throw new NotFoundException(`Chip #${id} não encontrado`);
    return chip;
  }

  async create(dto: CreateChipDto, user: CurrentUser) {
    const existing = await this.repo.findByTrackerId(dto.trackerId, user.tenantId);
    if (existing) throw new ConflictException('Este rastreador já possui um chip vinculado');
    return this.repo.create(dto, user.tenantId);
  }

  async update(id: string, dto: UpdateChipDto, user: CurrentUser) {
    await this.findOne(id, user);
    if (dto.trackerId) {
      const conflict = await this.repo.findByTrackerId(dto.trackerId, user.tenantId);
      if (conflict && conflict.id !== id)
        throw new ConflictException('Este rastreador já possui um chip vinculado');
    }
    return this.repo.update(id, user.tenantId, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id, user.tenantId);
  }

  getImportTemplate(format: SpreadsheetFormat): GenerateResult {
    return generateSpreadsheet(IMPORT_HEADERS, [], 'chips', format);
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
    const rows = records.map((c) => ({
      ICCID: c.iccid,
      'Número de Telefone': c.phoneNumber,
      Operadora: c.provider,
      'IMEI do Rastreador': c.tracker?.imei ?? '',
      'Criado em': c.createdAt.toISOString(),
    }));
    return generateSpreadsheet(EXPORT_HEADERS, rows, 'chips', format);
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
        const iccid = String(row['ICCID'] ?? '').trim();
        const phoneNumber = String(row['Número de Telefone'] ?? '').replace(/\D/g, '');
        const provider = String(row['Operadora'] ?? '').trim();
        const imei = String(row['IMEI do Rastreador'] ?? '').replace(/\D/g, '');

        if (iccid.length < 18) { errors.push({ row: rowNum, message: 'ICCID inválido (mínimo 18 caracteres)' }); continue; }
        if (phoneNumber.length < 10) { errors.push({ row: rowNum, message: 'Número de Telefone inválido (mínimo 10 dígitos)' }); continue; }
        if (!provider) { errors.push({ row: rowNum, message: 'Operadora é obrigatória' }); continue; }
        if (imei.length !== 15) { errors.push({ row: rowNum, message: 'IMEI do Rastreador inválido (deve ter 15 dígitos)' }); continue; }

        const tracker = await this.repo.findTrackerByImei(imei, user.tenantId);
        if (!tracker) { errors.push({ row: rowNum, message: `Rastreador com IMEI ${imei} não encontrado` }); continue; }

        const conflict = await this.repo.findByTrackerId(tracker.id, user.tenantId);
        if (conflict) { errors.push({ row: rowNum, message: `Rastreador com IMEI ${imei} já possui chip vinculado` }); continue; }

        await this.repo.create({ iccid, phoneNumber, provider, trackerId: tracker.id }, user.tenantId);
        imported++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        errors.push({ row: rowNum, message: msg });
      }
    }

    return { imported, errors };
  }
}
