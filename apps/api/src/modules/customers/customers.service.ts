import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerStatus } from '@prisma/client';
import { CurrentUser } from '../../common/types/current-user.type';
import {
  GenerateResult,
  SpreadsheetFormat,
  generateSpreadsheet,
  parseSpreadsheet,
} from '../../common/utils/spreadsheet.util';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersRepository } from './customers.repository';

const IMPORT_HEADERS = ['Nome', 'CNPJ', 'Email', 'Telefone', 'Mensalidade', 'Status'];
const EXPORT_HEADERS = [...IMPORT_HEADERS, 'Criado em'];

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  findAll(user: CurrentUser) { return this.repo.findAll(user.tenantId); }

  async findOne(id: string, user: CurrentUser) {
    const c = await this.repo.findOne(id, user.tenantId);
    if (!c) throw new NotFoundException(`Cliente #${id} não encontrado`);
    return c;
  }

  create(dto: CreateCustomerDto, user: CurrentUser) { return this.repo.create(dto, user.tenantId); }

  async update(id: string, dto: UpdateCustomerDto, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.update(id, user.tenantId, dto);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findOne(id, user);
    return this.repo.remove(id, user.tenantId);
  }

  getImportTemplate(format: SpreadsheetFormat): GenerateResult {
    return generateSpreadsheet(IMPORT_HEADERS, [], 'clientes', format);
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
      Nome: c.name,
      CNPJ: c.cnpj,
      Email: c.email,
      Telefone: c.phone,
      Mensalidade: Number(c.monthlyFee),
      Status: c.status,
      'Criado em': c.createdAt.toISOString(),
    }));
    return generateSpreadsheet(EXPORT_HEADERS, rows, 'clientes', format);
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
        const name = String(row['Nome'] ?? '').trim();
        const cnpj = String(row['CNPJ'] ?? '').replace(/\D/g, '');
        const email = String(row['Email'] ?? '').trim();
        const phone = String(row['Telefone'] ?? '').replace(/\D/g, '');
        const monthlyFeeRaw = String(row['Mensalidade'] ?? '0').replace(',', '.');
        const monthlyFee = parseFloat(monthlyFeeRaw) || 0;
        const statusRaw = String(row['Status'] ?? 'ATIVO').trim().toUpperCase();
        const status = statusRaw as CustomerStatus;

        if (!name) { errors.push({ row: rowNum, message: 'Nome é obrigatório' }); continue; }
        if (cnpj.length !== 14) { errors.push({ row: rowNum, message: 'CNPJ inválido (deve ter 14 dígitos)' }); continue; }
        if (!email.includes('@')) { errors.push({ row: rowNum, message: 'E-mail inválido' }); continue; }
        if (!['ATIVO', 'INATIVO'].includes(statusRaw)) { errors.push({ row: rowNum, message: 'Status inválido (use ATIVO ou INATIVO)' }); continue; }

        await this.repo.create({ name, cnpj, email, phone, monthlyFee, status }, user.tenantId);
        imported++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        errors.push({ row: rowNum, message: msg });
      }
    }

    return { imported, errors };
  }
}