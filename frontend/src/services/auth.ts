import { httpPost } from './http'

const TOKEN_KEYS = [
  (import.meta.env.VITE_AUTH_TOKEN_KEY as string) || 'auth_token',
  'token', // keep compatibility with existing router/store checks
]

export type LoginInput = { email: string; password: string }
export type LoginResponse = { accessToken: string }

export function setToken(token: string | null) {
  for (const key of TOKEN_KEYS) {
    if (token) localStorage.setItem(key, token)
    else localStorage.removeItem(key)
  }
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await httpPost<LoginResponse>('/auth/login', input)
  setToken(res.accessToken)
  return res
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const res = await httpPost<{ success: boolean }>('/auth/logout')
    setToken(null)
    return res
  } catch (e) {
    // Clear token even if API call fails (session may already be invalid)
    setToken(null)
    return { success: true }
  }
}

