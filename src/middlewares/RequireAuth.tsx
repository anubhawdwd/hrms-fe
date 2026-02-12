// src/middlewares/RequireAuth.tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/rootReducer'

interface RequireAuthProps {
  children: ReactNode
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { status } = useSelector(
    (state: RootState) => state.auth
  )

  if (status === 'idle' || status === 'loading') {
    return null
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default RequireAuth
