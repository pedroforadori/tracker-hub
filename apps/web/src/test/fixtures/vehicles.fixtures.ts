import type { Vehicle } from '@/shared/types/api'

export const vehicle1: Vehicle = {
  id: 'veh-1',
  plate: 'ABC1D23',
  brand: 'Volvo',
  model: 'FH 460',
  year: 2022,
  customerId: 'cust-1',
  tenantId: 'tenant-1',
  customer: { id: 'cust-1', name: 'Transportes Silva Ltda' },
  createdAt: '2025-01-01T00:00:00Z',
}

export const vehicle2: Vehicle = {
  id: 'veh-2',
  plate: 'XYZ5E67',
  brand: 'Mercedes-Benz',
  model: 'Actros',
  year: 2021,
  customerId: 'cust-2',
  tenantId: 'tenant-1',
  customer: { id: 'cust-2', name: 'Logistica ABC S.A.' },
  createdAt: '2025-01-02T00:00:00Z',
}

export const vehiclesList: Vehicle[] = [vehicle1, vehicle2]
