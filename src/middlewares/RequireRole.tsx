import type { ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import type { RootState } from '../store/rootReducer'
import type { UserRole } from '../modules/auth/types'

interface RequireRoleProps {
  roles:UserRole[]
  children: ReactNode
}

const RequireRole = ({ roles, children }: RequireRoleProps) => {
  const userRole = useSelector(
    (state: RootState) => state.auth.user?.role
  )

  if (!userRole) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(userRole)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequireRole
