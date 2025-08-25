import { httpPost } from './http'
import { clearAllTokens, setToken } from './token'

export type LoginInput = { email: string; password: string }
export type LoginResponse = { accessToken: string }

export { setToken, clearAllTokens }

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await httpPost<LoginResponse>('/auth/login', input)
  // Don't set token here - let the auth store handle token persistence
  return res
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const res = await httpPost<{ success: boolean }>('/auth/logout')
    clearAllTokens()
    return res
  } catch (e) {
    // Clear token even if API call fails (session may already be invalid)
    clearAllTokens()
    return { success: true }
  }
}
