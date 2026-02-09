import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/rootReducer'

interface RequireAuthProps {
  children: ReactNode
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { isAuthenticated, status } = useSelector(
    (state: RootState) => state.auth
  )

  if (status === 'idle') {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default RequireAuth
