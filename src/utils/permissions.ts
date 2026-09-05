// src/utils/permissions.ts

import type { UserRole } from "../types/auth.types"

/**
 * Namespaced permission model
 * Dot-notation for scalability
 */
export type Permission =
  | "admin.access"
  | "employee.view"
  | "employee.edit"
  | "employee.role.change"
  | "leave.view"
  | "leave.approve"
  | "attendance.view"
  | "attendance.override"
  | "org.manage"
  | "holiday.manage"
  | "company.manage"

/**
 * Role → permission adapter
 * Isolates SuperAdmin platform duties from tenant company admin operations
 */
const ROLE_PERMISSION_MAP: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "company.manage",
  ],

  COMPANY_ADMIN: [
    "admin.access",
    "employee.view",
    "employee.edit",
    "employee.role.change",
    "leave.view",
    "leave.approve",
    "attendance.view",
    "attendance.override",
    "org.manage",
    "holiday.manage",
  ],

  HR: [
    "admin.access",
    "employee.view",
    "employee.edit",
    "leave.view",
    "leave.approve",
    "attendance.view",
    "attendance.override",
    "org.manage",
    "holiday.manage",
  ],

  EMPLOYEE: [
    "employee.view",
    "leave.view",
    "attendance.view",
  ],
}

/**
 * Returns permissions derived from user role.
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
  return permissions.includes(permission)
}
