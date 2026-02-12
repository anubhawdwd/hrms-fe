// src/app/AppProviders.tsx
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'

import { store } from '../store/store'
import { theme } from '../styles/theme'
import { authApi } from '../modules/auth/api'
import {
  startLoading,
  setAccessToken,
  setUser,
  setUnauthenticated,
} from '../modules/auth/slice'

interface AppProvidersProps {
  children: ReactNode
}

const Bootstrapper = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    const bootstrap = async () => {
      dispatch(startLoading())

      try {
        const refreshRes = await authApi.refresh()
        dispatch(setAccessToken(refreshRes.accessToken))

        const meRes = await authApi.me()
        dispatch(setUser(meRes))
      } catch {
        dispatch(setUnauthenticated())
      }
    }

    bootstrap()
  }, [dispatch])

  return <>{children}</>
}

const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Bootstrapper>{children}</Bootstrapper>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  )
}

export default AppProviders
