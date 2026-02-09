export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'MICROSOFT'

export interface LoginRequest {
  email: string
  password: string
}

export interface GoogleLoginRequest {
  idToken: string
}

export interface MicrosoftLoginRequest {
  accessToken: string
}

export interface AuthResponse {
  accessToken: string
}

export interface MeResponse {
  id: string
  email: string
  role: string
  companyId?: string
}
