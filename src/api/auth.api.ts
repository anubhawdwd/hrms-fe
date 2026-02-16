// src/api/auth.api.ts
import { apiClient, setCompanyId, setToken } from './client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RefreshResponse,
} from '../types/auth.types'

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>(
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
    const { data } = await apiClient.get<MeResponse>('/api/auth/me')
     if (data.companyId) {
      setCompanyId(data.companyId)
    }
    return data
  },

  refresh: async (): Promise<RefreshResponse> => {
    const { data } = await apiClient.post<RefreshResponse>(
      '/api/auth/refresh',
      {},
      { withCredentials: true }
    )
    setToken(data.accessToken)
    return data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout')
    setToken(null)
    setCompanyId(null)
  },
}