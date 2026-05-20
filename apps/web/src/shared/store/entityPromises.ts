import { customersApi } from '@/features/customers/api/customers.api'
import { vehiclesApi } from '@/features/vehicles/api/vehicles.api'
import type { Customer, CustomerStatus, Vehicle } from '@/shared/types/api'

// React 19 reads `.status` / `.value` on thenables to avoid suspending when already settled.
type ReactThenable<T> = Promise<T> & { status: 'pending' | 'fulfilled' | 'rejected'; value?: T; reason?: unknown }

function trackPromise<T>(promise: Promise<T>): ReactThenable<T> {
  const t = promise as ReactThenable<T>
  t.status = 'pending'
  promise.then(
    (v) => { t.status = 'fulfilled'; t.value = v },
    (r) => { t.status = 'rejected'; t.reason = r },
  )
  return t
}

function resolvedThenable<T>(value: T): ReactThenable<T> {
  const t = Promise.resolve(value) as ReactThenable<T>
  t.status = 'fulfilled'
  t.value = value
  return t
}

let _customers: ReactThenable<Customer[]> | null = null
let _vehicles: ReactThenable<Vehicle[]> | null = null

export function getCustomersPromise() {
  return (_customers ??= trackPromise(customersApi.getAll()))
}

export function getVehiclesPromise() {
  return (_vehicles ??= trackPromise(vehiclesApi.getAll()))
}

export function invalidateCustomers() {
  _customers = trackPromise(customersApi.getAll())
}

export function invalidateVehicles() {
  _vehicles = trackPromise(vehiclesApi.getAll())
}

export function patchCustomerStatus(id: string, status: CustomerStatus) {
  if (_customers?.status !== 'fulfilled' || !_customers.value) return
  _customers = resolvedThenable(_customers.value.map((c) => (c.id === id ? { ...c, status } : c)))
}
