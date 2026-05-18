import { authHandlers } from './handlers/auth.handlers'
import { billingHandlers } from './handlers/billing.handlers'
import { chipsHandlers } from './handlers/chips.handlers'
import { customersHandlers } from './handlers/customers.handlers'
import { teamHandlers } from './handlers/team.handlers'
import { trackersHandlers } from './handlers/trackers.handlers'
import { vehiclesHandlers } from './handlers/vehicles.handlers'

export const handlers = [
  ...authHandlers,
  ...billingHandlers,
  ...customersHandlers,
  ...vehiclesHandlers,
  ...trackersHandlers,
  ...chipsHandlers,
  ...teamHandlers,
]
