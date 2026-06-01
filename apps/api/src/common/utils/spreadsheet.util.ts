import * as XLSX from 'xlsx';

export type SpreadsheetFormat = 'xlsx' | 'csv';

export interface GenerateResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export function parseSpreadsheet(
  buffer: Buffer,
  originalFilename: string,
): Record<string, unknown>[] {
  const ext = originalFilename.split('.').pop()?.toLowerCase();
  if (ext === 'csv') {
    const csvString = buffer.toString('utf8').replace(/^﻿/, '');
    const workbook = XLSX.read(csvString, { type: 'string' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
  }
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

export function generateSpreadsheet(
  headers: string[],
  rows: Record<string, unknown>[],
  sheetName: string,
  format: SpreadsheetFormat,
): GenerateResult {
  let ws: XLSX.WorkSheet;

  if (rows.length === 0) {
    ws = XLSX.utils.aoa_to_sheet([headers]);
  } else {
    ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  }

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws);
    return {
      buffer: Buffer.from('﻿' + csv, 'utf8'),
      mimeType: 'text/csv; charset=utf-8',
      filename: `${sheetName}.csv`,
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return {
    buffer: Buffer.from(xlsxBuffer),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `${sheetName}.xlsx`,
  };
}