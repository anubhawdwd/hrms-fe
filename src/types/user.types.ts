// src/types/user.types.ts
import type { AuthProvider, UserRole } from './auth.types'

export interface User {
  id: string
  email: string
  companyId: string
  authProvider: AuthProvider
  role: UserRole
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserPayload {
  email: string
  authProvider: AuthProvider
  role?: UserRole
}

export interface UpdateUserPayload {
  email?: string
  authProvider?: AuthProvider
  role?: UserRole
}
