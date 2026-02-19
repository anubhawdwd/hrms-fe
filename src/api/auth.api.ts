// src/api/auth.api.ts
import { apiClient, authClient, setToken, setCompanyId } from './client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RefreshResponse,
} from '../types/auth.types'

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    // Use authClient — login should never trigger refresh interceptor
    const { data } = await authClient.post<LoginResponse>(
      '/api/auth/login',
      payload
    )
    setToken(data.accessToken)
    if (data.user?.companyId) {
      setCompanyId(data.user.companyId)
    }
    return data
  },

  me: async (): Promise<MeResponse> => {
    // Use apiClient — needs auth header, and 401 retry is valid here
    const { data } = await apiClient.get<MeResponse>('/api/auth/me')
    if (data.companyId) {
      setCompanyId(data.companyId)
    }
    return data
  },

  refresh: async (): Promise<RefreshResponse> => {
    // Use authClient — MUST NOT go through 401 interceptor
    const { data } = await authClient.post<RefreshResponse>(
      '/api/auth/refresh'
    )
    setToken(data.accessToken)
    return data
  },

  logout: async (): Promise<void> => {
    // Use authClient — logout should work even with expired token
    try {
      await authClient.post('/api/auth/logout')
    } catch {
      // Ignore logout errors
    }
    setToken(null)
    setCompanyId(null)
  },
}
