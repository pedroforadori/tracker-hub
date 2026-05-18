import type { Tracker } from '@/shared/types/api'

export const tracker1: Tracker = {
  id: 'trk-1',
  imei: '356938035643809',
  model: 'GT06N',
  brand: 'Coban',
  vehicleId: 'veh-1',
  tenantId: 'tenant-1',
  vehicle: { id: 'veh-1', plate: 'ABC1D23' },
  createdAt: '2025-01-01T00:00:00Z',
}

export const tracker2: Tracker = {
  id: 'trk-2',
  imei: '490154203237518',
  model: 'TK303',
  brand: 'Xexun',
  vehicleId: 'veh-2',
  tenantId: 'tenant-1',
  vehicle: { id: 'veh-2', plate: 'XYZ5E67' },
  createdAt: '2025-01-02T00:00:00Z',
}

export const trackersList: Tracker[] = [tracker1, tracker2]
