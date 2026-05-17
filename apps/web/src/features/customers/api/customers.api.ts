import { createCrudApi } from '@/shared/api/crud.factory'
import type { Customer } from '@/shared/types/api'

export const customersApi = createCrudApi<Customer>('/customers')
