// src/app/AuthBootstrap.tsx
import { useEffect, useRef, type ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { authApi } from '../api/auth.api'
import { startLoading, setUser, clearAuth } from '../store/auth.slice'

const AuthBootstrap = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const bootstrap = async () => {
      dispatch(startLoading())

      try {
        await authApi.refresh()
        const me = await authApi.me()
        dispatch(setUser(me))
      } catch {
        dispatch(clearAuth())
      }
    }

    bootstrap()
  }, [dispatch])

  return <>{children}</>
}

export default AuthBootstrap