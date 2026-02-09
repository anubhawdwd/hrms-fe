import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/rootReducer'

interface RequireRoleProps {
  allowedRoles: string[]
  children: ReactNode
}

const RequireRole = ({ allowedRoles, children }: RequireRoleProps) => {
  const role = useSelector((state: RootState) => state.auth.role)

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequireRole
