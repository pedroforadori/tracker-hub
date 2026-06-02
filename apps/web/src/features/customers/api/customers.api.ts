import { api } from '@/shared/api/client'
import { createCrudApi } from '@/shared/api/crud.factory'
import type { Customer, ImportResult } from '@/shared/types/api'

export const customersApi = {
  ...createCrudApi<Customer>('/customers'),

  importFile: (file: File): Promise<ImportResult> => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportResult>('/customers/import', form, { headers: { 'Content-Type': undefined } }).then((r) => r.data)
  },

  downloadTemplate: (format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> =>
    api.get('/customers/import/template', { params: { format }, responseType: 'blob' }).then((r) => r.data as Blob),

  exportData: (from: string, to: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> =>
    api.get('/customers/export', { params: { from, to, format }, responseType: 'blob' }).then((r) => r.data as Blob),
}
