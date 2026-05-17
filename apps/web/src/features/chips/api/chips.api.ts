import { createCrudApi } from '@/shared/api/crud.factory'
import type { Chip } from '@/shared/types/api'

export const chipsApi = createCrudApi<Chip>('/chips')
