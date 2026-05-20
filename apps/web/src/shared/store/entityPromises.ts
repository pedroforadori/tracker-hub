import { customersApi } from '@/features/customers/api/customers.api'
import { vehiclesApi } from '@/features/vehicles/api/vehicles.api'

let _customers: ReturnType<typeof customersApi.getAll> | null = null
let _vehicles: ReturnType<typeof vehiclesApi.getAll> | null = null

export function getCustomersPromise() {
  return (_customers ??= customersApi.getAll())
}

export function getVehiclesPromise() {
  return (_vehicles ??= vehiclesApi.getAll())
}

export function invalidateCustomers() {
  _customers = customersApi.getAll()
}

export function invalidateVehicles() {
  _vehicles = vehiclesApi.getAll()
}
