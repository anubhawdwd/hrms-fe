// src/guards/RequireAuth.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { ReactNode } from 'react'

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth()

  if (status === 'idle' || status === 'loading') {
    return null // or a spinner
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequireAuth