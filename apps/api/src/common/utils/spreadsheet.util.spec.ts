import * as XLSX from 'xlsx';
import { generateSpreadsheet, parseSpreadsheet } from './spreadsheet.util';

describe('spreadsheet.util', () => {
  const headers = ['Nome', 'CNPJ', 'Email'];
  const rows = [
    { Nome: 'Empresa A', CNPJ: '12345678000199', Email: 'a@test.com' },
    { Nome: 'Empresa B', CNPJ: '98765432000100', Email: 'b@test.com' },
  ];

  describe('generateSpreadsheet()', () => {
    it('xlsx: retorna buffer não vazio com filename terminando em .xlsx', () => {
      const result = generateSpreadsheet(headers, rows, 'clientes', 'xlsx');
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe('clientes.xlsx');
      expect(result.mimeType).toContain('spreadsheetml');
    });

    it('csv: retorna buffer com mimeType text/csv e filename terminando em .csv', () => {
      const result = generateSpreadsheet(headers, rows, 'clientes', 'csv');
      expect(result.filename).toBe('clientes.csv');
      expect(result.mimeType).toContain('text/csv');
    });

    it('csv: buffer contém os cabeçalhos na primeira linha', () => {
      const result = generateSpreadsheet(headers, rows, 'clientes', 'csv');
      const content = result.buffer.toString('utf8');
      expect(content).toContain('Nome');
      expect(content).toContain('CNPJ');
      expect(content).toContain('Email');
    });

    it('template (rows vazio): xlsx gerado contém apenas a linha de cabeçalho', () => {
      const result = generateSpreadsheet(headers, [], 'modelo', 'xlsx');
      const wb = XLSX.read(result.buffer, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 }) as unknown[][];
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual(headers);
    });

    it('template (rows vazio): csv gerado contém apenas a linha de cabeçalho', () => {
      const result = generateSpreadsheet(headers, [], 'modelo', 'csv');
      const content = result.buffer.toString('utf8').replace(/^﻿/, ''); // strip BOM
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);
    });

    it('round-trip xlsx: dados parseados são iguais aos gerados', () => {
      const { buffer, filename } = generateSpreadsheet(headers, rows, 'test', 'xlsx');
      const parsed = parseSpreadsheet(buffer, filename);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toMatchObject({ Nome: 'Empresa A', CNPJ: '12345678000199' });
    });

    it('round-trip csv: dados parseados são iguais aos gerados', () => {
      const { buffer, filename } = generateSpreadsheet(headers, rows, 'test', 'csv');
      const parsed = parseSpreadsheet(buffer, filename);
      expect(parsed).toHaveLength(2);
      expect(String(parsed[0]['Nome'])).toBe('Empresa A');
    });
  });

  describe('parseSpreadsheet()', () => {
    it('parseia buffer CSV com separador vírgula', () => {
      const csv = 'Nome,CNPJ\nEmpresa A,12345678000199\n';
      const result = parseSpreadsheet(Buffer.from(csv, 'utf8'), 'test.csv');
      expect(result).toHaveLength(1);
      expect(result[0]['Nome']).toBe('Empresa A');
    });

    it('parseia buffer XLSX gerado pelo SheetJS', () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([{ Nome: 'Teste', Valor: 42 }]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer);
      const result = parseSpreadsheet(buf, 'test.xlsx');
      expect(result[0]['Nome']).toBe('Teste');
      expect(result[0]['Valor']).toBe(42);
    });

    it('células ausentes resultam em string vazia (defval)', () => {
      const csv = 'Nome,CNPJ\nEmpresa A,\n';
      const result = parseSpreadsheet(Buffer.from(csv, 'utf8'), 'test.csv');
      expect(result[0]['CNPJ']).toBe('');
    });
  });
});
