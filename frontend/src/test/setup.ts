// Global test setup for Vitest
// Register global directives, mocks, etc.
import { config } from '@vue/test-utils'
import mask from '../directives/mask'

config.global.directives = {
  ...(config.global.directives || {}),
  mask,
}
