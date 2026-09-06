// src/guards/RequirePermission.tsx
import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { hasPermission, type Permission } from "../utils/permissions"
import type { ReactNode } from "react"
import type { UserRole } from "../types/auth.types"

interface Props {
  permission: Permission
  children: ReactNode
}

const RequirePermission = ({ permission, children }: Props) => {
  const { status, user } = useAuth()

  if (status === "idle" || status === "loading") {
    return null
  }

  if (status === "unauthenticated") {
    return <Navigate to="/" replace />
  }

  const userRoles = (user?.roles && user.roles.length > 0
    ? user.roles
    : (user?.role ? [user.role] : [])) as UserRole[]

  if (!hasPermission(userRoles, permission)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequirePermission
