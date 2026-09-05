// src/types/superadmin.types.ts
import type { AuthProvider, UserRole } from './auth.types'

export interface SuperAdminUser {
  id: string
  email: string
  companyId: null
  role: UserRole
  authProvider: AuthProvider
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSuperAdminPayload {
  email: string
  password?: string
}

export interface CreateSuperAdminResponse {
  user: SuperAdminUser
  temporaryPassword?: string
}

export interface ResetPasswordResponse {
  message: string
  temporaryPassword?: string
}
