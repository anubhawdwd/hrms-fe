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
 * Returns aggregated permissions derived from user role(s).
 */
export const getUserPermissions = (
  rolesOrRole?: UserRole[] | UserRole
): Permission[] => {
  if (!rolesOrRole) return []
  const roles: UserRole[] = Array.isArray(rolesOrRole) ? rolesOrRole : [rolesOrRole]
  const permissionSet = new Set<Permission>()
  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSION_MAP[role] ?? []
    for (const p of rolePermissions) {
      permissionSet.add(p)
    }
  }
  return Array.from(permissionSet)
}

/**
 * Check if user has a specific permission across all active roles.
 */
export const hasPermission = (
  rolesOrRole: UserRole[] | UserRole | undefined,
  permission: Permission
): boolean => {
  if (!rolesOrRole) return false
  const permissions = getUserPermissions(rolesOrRole)
  return permissions.includes(permission)
}
