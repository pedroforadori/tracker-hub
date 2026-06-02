import { api } from '@/shared/api/client'
import { createCrudApi } from '@/shared/api/crud.factory'
import type { ImportResult, Vehicle } from '@/shared/types/api'

export const vehiclesApi = {
  ...createCrudApi<Vehicle>('/vehicles'),

  importFile: (file: File): Promise<ImportResult> => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportResult>('/vehicles/import', form, { headers: { 'Content-Type': undefined } }).then((r) => r.data)
  },

  downloadTemplate: (format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> =>
    api.get('/vehicles/import/template', { params: { format }, responseType: 'blob' }).then((r) => r.data as Blob),

  exportData: (from: string, to: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> =>
    api.get('/vehicles/export', { params: { from, to, format }, responseType: 'blob' }).then((r) => r.data as Blob),
}
