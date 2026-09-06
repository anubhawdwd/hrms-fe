// src/pages/AuthGate.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { getDashboardRoute } from "../utils/dashboard"
import LoginPage from "./Login"
import LoadingState from "../components/LoadingState"

const AuthGate = () => {
  const { status, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (status === "authenticated" && (user?.roles?.length || user?.role)) {
      const activeRoles = user.roles && user.roles.length > 0 ? user.roles : user.role
      navigate(getDashboardRoute(activeRoles), { replace: true })
    }
  }, [status, user, navigate])

  if (status === "idle" || status === "loading") {
    return <LoadingState message="Initializing session..." />
  }

  if (status === "unauthenticated") {
    return <LoginPage />
  }

  // Brief flash while navigating — show loading
  return <LoadingState message="Redirecting..." />
}

export default AuthGate
