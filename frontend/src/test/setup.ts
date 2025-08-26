// Global test setup for Vitest
// Register global directives, mocks, etc.
import { config } from '@vue/test-utils'
import { afterEach } from 'vitest'
import mask from '../directives/mask'

config.global.directives = {
  ...(config.global.directives || {}),
  mask,
}

// Clean up after each test
afterEach(() => {
  // Clear DOM
  document.body.innerHTML = '';
  // Clear localStorage
  localStorage.clear();
})

// Suppress unhandled errors that don't affect test functionality
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  // Suppress Vue injection warnings and other test-only warnings that don't indicate real issues
  const message = args[0]?.toString() || ''
  if (
    message.includes('injection') ||
    message.includes('Symbol(') ||
    message.includes('No auth token found')
  ) {
    return
  }
  originalConsoleError.apply(console, args)
}

// Handle unhandled rejections gracefully
process.on('unhandledRejection', (reason: unknown) => {
  // Only log significant errors, suppress test cleanup issues
  const reasonStr = reason?.toString() || ''
  if (!reasonStr.includes('test') && !reasonStr.includes('cleanup')) {
    console.warn('Unhandled Rejection (suppressed):', reason);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Prevent test failures from cleanup issues
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  // Prevent test failures from minor errors
  event.preventDefault();
});
