import { createCrudApi } from '@/shared/api/crud.factory'
import type { Vehicle } from '@/shared/types/api'

export const vehiclesApi = createCrudApi<Vehicle>('/vehicles')
