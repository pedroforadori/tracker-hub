import { createCrudApi } from '@/shared/api/crud.factory'
import type { Tracker } from '@/shared/types/api'

export const trackersApi = createCrudApi<Tracker>('/trackers')
