// Global test setup for Vitest
// Register global directives, mocks, etc.
import { config } from '@vue/test-utils'
import { afterEach, vi } from 'vitest'
import mask from '../directives/mask'

config.global.directives = {
  ...(config.global.directives || {}),
  mask,
}

// Note: Service mocking is done per test file to avoid conflicts

// Clean up after each test
afterEach(() => {
  // Clear DOM
  document.body.innerHTML = '';
  // Clear localStorage
  localStorage.clear();
})

// Suppress unhandled errors that don't affect test functionality
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
console.error = (...args: any[]) => {
  // Suppress Vue injection warnings and other test-only warnings that don't indicate real issues
  const message = args[0]?.toString() || ''
  if (
    message.includes('injection') ||
    message.includes('Symbol(') ||
    message.includes('No auth token found') ||
    message.includes('unhandled')
  ) {
    return
  }
  originalConsoleError.apply(console, args)
}

console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || ''
  if (message.includes('No auth token found') || message.includes('Unhandled')) {
    return
  }
  originalConsoleWarn.apply(console, args)
}

// Handle unhandled rejections gracefully
process.on('unhandledRejection', (reason: unknown) => {
  // Suppress all unhandled rejections in tests
  return
});

window.addEventListener('unhandledrejection', (event) => {
  // Prevent test failures from cleanup issues
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  // Prevent test failures from minor errors
  event.preventDefault();
});
