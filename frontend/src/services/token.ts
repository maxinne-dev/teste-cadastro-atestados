// Centralized token utilities to avoid duplication and circular deps

const CONFIGURED_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token'

export function getConfiguredTokenKey(): string {
  return CONFIGURED_KEY
}

export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(CONFIGURED_KEY)
}

export function setToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (token) localStorage.setItem(CONFIGURED_KEY, token)
  else localStorage.removeItem(CONFIGURED_KEY)
}

export function clearAllTokens(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(CONFIGURED_KEY)
}
