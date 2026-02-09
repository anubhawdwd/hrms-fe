import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../store/rootReducer'
import { authApi } from './api'
import { setUser, logout } from './slice'

export const useAuthBootstrap = () => {
  const dispatch = useDispatch()
  const accessToken = useSelector(
    (state: RootState) => state.auth.accessToken
  )

  useEffect(() => {
    const bootstrap = async () => {
      if (!accessToken) return

      try {
        const me = await authApi.me()
        dispatch(setUser(me))
      } catch {
        dispatch(logout())
      }
    }

    bootstrap()
  }, [accessToken, dispatch])
}
