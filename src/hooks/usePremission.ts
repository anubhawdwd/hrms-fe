// src/hooks/usePremission.ts
import { useUser } from "./useAuth"
import { hasPermission, type Permission } from "../utils/permissions"
import type { UserRole } from "../types/auth.types"

export const useHasPermission = (permission: Permission): boolean => {
  const user = useUser()
  const userRoles = (user?.roles && user.roles.length > 0
    ? user.roles
    : (user?.role ? [user.role] : [])) as UserRole[]
  return hasPermission(userRoles, permission)
}
