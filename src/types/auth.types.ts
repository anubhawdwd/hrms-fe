// src/types/auth.types.ts
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'MICROSOFT'

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'HR'
  | 'EMPLOYEE'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    role?: UserRole
    companyId: string
    geoFencingEnabled?: boolean
    mustChangePassword?: boolean
  }
}

export interface MeResponse {
  id: string
  email: string
  role: UserRole
  companyId: string
  geoFencingEnabled?: boolean
  mustChangePassword?: boolean
}

export interface RefreshResponse {
  accessToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
