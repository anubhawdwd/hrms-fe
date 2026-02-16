// src/utils/dashboard.ts
import type { UserRole } from '../types/auth.types'

export const getDashboardRoute = (role?: UserRole): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin'
    case 'COMPANY_ADMIN':
    case 'HR':
      return '/admin'
    case 'EMPLOYEE':
      return '/employee'
    default:
      return '/'
  }
}