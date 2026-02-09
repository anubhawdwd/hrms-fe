import { apiClient } from '../../lib/api/apiClient'
import type {
  LoginRequest,
  GoogleLoginRequest,
  MicrosoftLoginRequest,
  AuthResponse,
  MeResponse,
} from './types'

export const authApi = {
  login: async (payload: LoginRequest) => {
    const { data } = await apiClient.post<AuthResponse>(
      '/api/auth/login',
      payload
    )
    return data
  },

  googleLogin: async (payload: GoogleLoginRequest) => {
    const { data } = await apiClient.post<AuthResponse>(
      '/api/auth/google',
      payload
    )
    return data
  },

  microsoftLogin: async (payload: MicrosoftLoginRequest) => {
    const { data } = await apiClient.post<AuthResponse>(
      '/api/auth/microsoft',
      payload
    )
    return data
  },

  refresh: async () => {
    const { data } = await apiClient.post<AuthResponse>(
      '/api/auth/refresh',
      {},
      { withCredentials: true }
    )
    return data
  },

  me: async () => {
    const { data } = await apiClient.get<MeResponse>('/api/auth/me')
    return data
  },
}
