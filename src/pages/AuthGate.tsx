// src/pages/AuthGate.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDashboardRoute } from '../utils/dashboard'
import LoginPage from './Login'
import LoadingState from '../components/LoadingState'

const AuthGate = () => {
  const { status, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'authenticated' && user?.role) {
      navigate(getDashboardRoute(user.role), { replace: true })
    }
  }, [status, user, navigate])

  if (status === 'idle' || status === 'loading') {
    return <LoadingState message="Initializing session..." />
  }

  if (status === 'unauthenticated') {
    return <LoginPage />
  }

  // Brief flash while navigating — show loading
  return <LoadingState message="Redirecting..." />
}

export default AuthGate