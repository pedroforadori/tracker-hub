import { api } from '@/shared/api/client'
import { createCrudApi } from '@/shared/api/crud.factory'
import type { ImportResult, Tracker } from '@/shared/types/api'

export const trackersApi = {
  ...createCrudApi<Tracker>('/trackers'),

  importFile: (file: File): Promise<ImportResult> => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportResult>('/trackers/import', form, { headers: { 'Content-Type': undefined } }).then((r) => r.data)
  },

  downloadTemplate: (format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> =>
    api.get('/trackers/import/template', { params: { format }, responseType: 'blob' }).then((r) => r.data as Blob),

  exportData: (from: string, to: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> =>
    api.get('/trackers/export', { params: { from, to, format }, responseType: 'blob' }).then((r) => r.data as Blob),
}
