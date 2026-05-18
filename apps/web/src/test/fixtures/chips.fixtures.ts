import type { Chip } from '@/shared/types/api'

export const chip1: Chip = {
  id: 'chip-1',
  iccid: '894102119876543210',
  phoneNumber: '11987650001',
  provider: 'Vivo',
  trackerId: 'trk-1',
  tenantId: 'tenant-1',
  tracker: { id: 'trk-1', imei: '356938035643809' },
  createdAt: '2025-01-01T00:00:00Z',
}

export const chip2: Chip = {
  id: 'chip-2',
  iccid: '894102119876543211',
  phoneNumber: '11987650002',
  provider: 'Claro',
  trackerId: 'trk-2',
  tenantId: 'tenant-1',
  tracker: { id: 'trk-2', imei: '490154203237518' },
  createdAt: '2025-01-02T00:00:00Z',
}

export const chipsList: Chip[] = [chip1, chip2]
