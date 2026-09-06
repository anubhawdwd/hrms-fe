// src/utils/dashboard.ts
import type { UserRole } from "../types/auth.types"

/**
 * Resolves default landing dashboard route based on user roles.
 * Priority hierarchy:
 * 1. SUPER_ADMIN -> /super-admin
 * 2. COMPANY_ADMIN -> /admin
 * 3. HR -> /admin
 * 4. EMPLOYEE -> /employee
 * 5. Fallback -> /
 */
export const getDashboardRoute = (rolesOrRole?: UserRole[] | UserRole): string => {
  if (!rolesOrRole) return "/"

  const roles: UserRole[] = Array.isArray(rolesOrRole)
    ? rolesOrRole
    : [rolesOrRole]

  if (roles.length === 0) return "/"

  if (roles.includes("SUPER_ADMIN")) {
    return "/super-admin"
  }
  if (roles.includes("COMPANY_ADMIN") || roles.includes("HR")) {
    return "/admin"
  }
  if (roles.includes("EMPLOYEE")) {
    return "/employee"
  }

  return "/"
}
