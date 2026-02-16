// src/guards/RequirePermission.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { hasPermission, type Permission } from '../utils/permissions'
import type { ReactNode } from 'react'

interface Props {
  permission: Permission
  children: ReactNode
}

const RequirePermission = ({ permission, children }: Props) => {
  const { status, user } = useAuth()

  if (status === 'idle' || status === 'loading') {
    return null
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" replace />
  }

  if (!hasPermission(user?.role, permission)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequirePermission