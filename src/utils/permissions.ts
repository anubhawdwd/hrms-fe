// src/utils/permissions.ts

import type { UserRole } from '../modules/auth/types'

/**
 * Namespaced permission model
 * Dot-notation for scalability
 */
export type Permission =
  | 'admin.access'
  | 'employee.view'
  | 'employee.edit'
  | 'employee.role.change'
  | 'leave.view'
  | 'leave.approve'
  | 'attendance.view'
  | 'attendance.override'
  | 'org.manage'
  | 'holiday.manage'
  | 'company.manage'

/**
 * Temporary role → permission adapter
 * This will be removed once backend RBAC is implemented.
 */
const ROLE_PERMISSION_MAP: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'admin.access',
    'company.manage',
    'employee.view',
    'employee.edit',
    'employee.role.change',
    'leave.view',
    'leave.approve',
    'attendance.view',
    'attendance.override',
    'org.manage',
    'holiday.manage',
  ],

  COMPANY_ADMIN: [
    'admin.access',
    'employee.view',
    'employee.edit',
    'employee.role.change',
    'leave.view',
    'leave.approve',
    'attendance.view',
    'attendance.override',
    'org.manage',
    'holiday.manage',
  ],

  HR: [
    'admin.access',
    'employee.view',
    'employee.edit',
    'leave.view',
    'leave.approve',
    'attendance.view',
  ],

  EMPLOYEE: [
    'employee.view',
    'leave.view',
    'attendance.view',
  ],
}

/**
 * Returns permissions derived from user role.
 * Later this will simply return user.permissions from backend.
 */
export const getUserPermissions = (
  role?: UserRole
): Permission[] => {
  if (!role) return []
  return ROLE_PERMISSION_MAP[role] ?? []
}

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  role: UserRole | undefined,
  permission: Permission
): boolean => {
  if (!role) return false

  const permissions = getUserPermissions(role)

  // SUPER_ADMIN fallback for safety (optional)
  if (permissions.includes(permission)) return true

  return false
}
