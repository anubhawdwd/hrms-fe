// src/modules/auth/types.ts
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'MICROSOFT'
export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'HR' | 'EMPLOYEE'

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
  role: UserRole
  companyId?: string
}

