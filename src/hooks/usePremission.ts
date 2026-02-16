// src/hooks/usePermission.ts
import { useUser } from './useAuth'
import { hasPermission, type Permission } from '../utils/permissions'

export const useHasPermission = (permission: Permission): boolean => {
  const user = useUser()
  return hasPermission(user?.role, permission)
}