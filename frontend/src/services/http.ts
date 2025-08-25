import axios, { AxiosError, AxiosInstance } from 'axios'
import { clearAllTokens, getToken } from './token'

// Environment helpers (Vite only exposes variables prefixed with VITE_)
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'
// Force API usage always in runtime
const USE_API = true
const TIMEOUT = Number(import.meta.env.VITE_HTTP_TIMEOUT_MS ?? 10000)
const RETRY_ATTEMPTS = Number(import.meta.env.VITE_HTTP_RETRY_ATTEMPTS ?? 0)
const RETRY_DELAY_MS = Number(import.meta.env.VITE_HTTP_RETRY_DELAY_MS ?? 300)

// Normalized error shape used across the app
export interface HttpError {
  status: number | null
  code?: string // optional machine readable code
  message: string
  details?: unknown // backend provided details
  fields?: Record<string, string> // field level validation messages
  original: unknown // original error object for debugging
}

function normalizeError(error: unknown): HttpError {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError<any>
    const status = axErr.response?.status ?? null
    const data = axErr.response?.data
    let message = axErr.message
    let fields: Record<string, string> | undefined
    let code: string | undefined
    let details: unknown

    if (data) {
      // Try a few common shapes (RFC7807-like or custom validation structures)
      if (typeof data === 'object') {
        if (data.message && typeof data.message === 'string')
          message = data.message
        if (data.code && typeof data.code === 'string') code = data.code
        if (data.errors && typeof data.errors === 'object') {
          // { errors: { field: msg } }
          fields = data.errors as Record<string, string>
        }
        if (data.fields && typeof data.fields === 'object') {
          // { fields: [{ field, message }] } or { fields: { field: msg } }
          if (Array.isArray(data.fields)) {
            fields = Object.fromEntries(
              data.fields
                .filter((f: any) => f && f.field && f.message)
                .map((f: any) => [f.field, f.message]),
            )
          } else {
            fields = data.fields as Record<string, string>
          }
        }
        details = data.details ?? data.detail ?? data
      }
    }

    return { status, code, message, fields, details, original: error }
  }

  // Non-Axios error
  return { status: null, message: 'Unexpected error', original: error }
}

// Simple exponential backoff delay helper
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryable<T>(
  fn: () => Promise<T>,
  attempts: number,
  baseDelay: number,
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i === attempts) break
      const wait = baseDelay * Math.pow(2, i)
      await delay(wait)
    }
  }
  throw lastError
}

function createHttpClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT,
  })

  // Request interceptor: attach auth token if present
  instance.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    } else {
      console.warn('No auth token found in localStorage')
    }
    return config
  })

  // Response interceptor: unwrap / normalize errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const normalized = normalizeError(error)
      // Automatic handling for 401 -> session invalid
      if (normalized.status === 401) {
        // Clear all auth tokens using the centralized function
        clearAllTokens()
        
        // Clear auth store and redirect to login
        handleSessionExpiry()
      }
      return Promise.reject(normalized)
    },
  )

  return instance
}

export const http = createHttpClient()

// Convenience wrappers with optional retry for idempotent GET requests
export async function httpGet<T = unknown>(
  url: string,
  config?: Record<string, any>,
): Promise<T> {
  const exec = () => http.get<T>(url, config).then((r) => r.data)
  if (
    RETRY_ATTEMPTS > 0 &&
    /^(GET)$/i.test((config?.method as string) || 'GET')
  ) {
    return retryable(exec, RETRY_ATTEMPTS, RETRY_DELAY_MS)
  }
  return exec()
}

export async function httpPost<T = unknown>(
  url: string,
  data?: any,
  config?: Record<string, any>,
): Promise<T> {
  return http.post<T>(url, data, config).then((r) => r.data)
}
export async function httpPut<T = unknown>(
  url: string,
  data?: any,
  config?: Record<string, any>,
): Promise<T> {
  return http.put<T>(url, data, config).then((r) => r.data)
}
export async function httpPatch<T = unknown>(
  url: string,
  data?: any,
  config?: Record<string, any>,
): Promise<T> {
  return http.patch<T>(url, data, config).then((r) => r.data)
}
export async function httpDelete<T = unknown>(
  url: string,
  config?: Record<string, any>,
): Promise<T> {
  return http.delete<T>(url, config).then((r) => r.data)
}

export function isApiEnabled(): boolean {
  return true
}

// Type augmentation for import.meta.env so TS knows about our keys
// (Alternatively, could create an env.d.ts file.)
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_USE_API?: string // 'true' | 'false'
    readonly VITE_AUTH_TOKEN_KEY?: string
    readonly VITE_HTTP_TIMEOUT_MS?: string
    readonly VITE_HTTP_RETRY_ATTEMPTS?: string
    readonly VITE_HTTP_RETRY_DELAY_MS?: string
  }
}

// Global session expiry handler
// Uses dynamic imports to avoid circular dependencies
async function handleSessionExpiry() {
  try {
    console.log('Session expired (401), clearing auth state and redirecting to login')
    
    // Show user-friendly notification about session expiry
    try {
      const { useNotify } = await import('../composables/useNotify')
      const { notifyInfo } = useNotify()
      notifyInfo('Sessão expirada', 'Por favor, faça login novamente')
    } catch {
      // Notification failed, but continue with cleanup
    }
    
    // Dynamic import to avoid circular dependency issues
    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()
    
    // Clear auth store state
    authStore.token = null
    authStore.user = null
    
    // Get current router instance and redirect
    // We use window.location instead of router to avoid dependency issues
    if (typeof window !== 'undefined') {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        // Add a small delay to allow the toast notification to show
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    }
  } catch (error) {
    console.error('Error handling session expiry:', error)
    // Fallback: force page reload to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

// Usage example (to be removed once integrated):
// if (isApiEnabled()) {
//   httpGet('/health').catch(e => console.warn('API not reachable yet', e));
// }
