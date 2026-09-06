// src/types/user.types.ts
import type { AuthProvider, UserRole } from './auth.types'

export interface User {
  id: string
  email: string
  companyId?: string
  authProvider: AuthProvider
  role?: UserRole
  roles?: UserRole[]
  isActive: boolean
  mustChangePassword?: boolean
  createdAt?: string
  updatedAt?: string
  employee?: {
    id: string
    employeeCode: number | null
    displayName: string
    firstName: string
    lastName: string
    department?: { name: string } | null
    designation?: { name: string } | null
  } | null
}

export interface CreateUserPayload {
  email: string
  authProvider: AuthProvider
  role?: UserRole
  roles?: UserRole[]
}

export interface UpdateUserPayload {
  email?: string
  authProvider?: AuthProvider
  role?: UserRole
  roles?: UserRole[]
}
