import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { ReactNode } from 'react'
import type { RootState } from '../store/rootReducer'
import { hasPermission, type Permission } from '../utils/permissions'

interface RequirePermissionProps {
  permission: Permission
  children: ReactNode
}

const RequirePermission = ({
  permission,
  children,
}: RequirePermissionProps) => {
  const { status, user } = useSelector(
    (state: RootState) => state.auth
  )

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
