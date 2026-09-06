// src/pages/Login.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { authApi } from '../api/auth.api'
import { setUser } from '../store/auth.slice'
import { getDashboardRoute } from '../utils/dashboard'
import { useAuth } from '../hooks/useAuth'

// Declare Google Identity Services on window
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              width?: string | number
              logo_alignment?: 'left' | 'center'
            }
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

// Brand SVG Icons
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
)

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" style={{ marginRight: 8 }}>
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
)

const LoginPage = () => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [msLoading, setMsLoading] = useState(false)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)

  const googleBtnRef = useRef<HTMLDivElement>(null)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  const msClientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''

  const isAnyLoading = loading || googleLoading || msLoading

  // Complete SSO login handler
  const handleAuthSuccess = useCallback(
    async (authAction: () => Promise<any>) => {
      try {
        await authAction()
        const me = await authApi.me()
        dispatch(setUser(me))
        toast.success('Login successful')
        navigate(getDashboardRoute(me.roles && me.roles.length > 0 ? me.roles : me.role), { replace: true })
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Authentication failed'
        if (
          errorMsg.toLowerCase().includes('not found') ||
          errorMsg.toLowerCase().includes('user not found') ||
          errorMsg.toLowerCase().includes('unregistered')
        ) {
          toast.error('This account is not registered with HRMS. Please contact HR/Admin.', {
            duration: 6000,
          })
        } else {
          toast.error(errorMsg)
        }
      }
    },
    [dispatch, navigate]
  )

  // Handle Google Credential Response
  const handleGoogleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      if (!response.credential) {
        toast.error('Failed to obtain Google credential')
        return
      }
      setGoogleLoading(true)
      try {
        await handleAuthSuccess(() =>
          authApi.googleLogin({ idToken: response.credential })
        )
      } finally {
        setGoogleLoading(false)
      }
    },
    [handleAuthSuccess]
  )

  // Initialize Google Identity Services
  useEffect(() => {
    if (!googleClientId) return

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            cancel_on_tap_outside: true,
          })
          googleBtnRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 336,
            logo_alignment: 'left',
          })
        } catch {
          // Google GSI render error guard
        }
      }
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
    } else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogle
      document.body.appendChild(script)
    }
  }, [googleClientId, handleGoogleCredentialResponse])

  // Prevent rendering login if already authenticated
  if (status === 'authenticated') {
    return null
  }

  // Normal Email/Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Email and password required')
      return
    }

    setLoading(true)
    try {
      await handleAuthSuccess(() => authApi.login({ email, password }))
    } finally {
      setLoading(false)
    }
  }

  // Google Fallback Click when Client ID is not configured
  const handleGoogleClick = () => {
    if (!googleClientId) {
      toast.error(
        'Google SSO is not configured yet. (Set VITE_GOOGLE_CLIENT_ID in .env)',
        { duration: 5000 }
      )
      return
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    }
  }

  // Microsoft OAuth Popup Flow
  const handleMicrosoftLogin = async () => {
    if (!msClientId) {
      toast.error(
        'Microsoft SSO is not configured yet. (Set VITE_MICROSOFT_CLIENT_ID in .env)',
        { duration: 5000 }
      )
      return
    }

    setMsLoading(true)

    try {
      const redirectUri = window.location.origin
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(
        msClientId
      )}&response_type=token&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${encodeURIComponent(
        'openid profile email User.Read'
      )}&response_mode=fragment&prompt=select_account`

      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        authUrl,
        'MicrosoftLogin',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no`
      )

      if (!popup) {
        toast.error('Popup blocked by browser. Please allow popups for this site.')
        setMsLoading(false)
        return
      }

      // Poll for popup token redirect
      const pollTimer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer)
            setMsLoading(false)
            return
          }

          if (popup.location.href.includes(redirectUri)) {
            const hash = popup.location.hash
            clearInterval(pollTimer)
            popup.close()

            if (hash) {
              const params = new URLSearchParams(hash.replace(/^#/, ''))
              const accessToken = params.get('access_token')

              if (accessToken) {
                await handleAuthSuccess(() =>
                  authApi.microsoftLogin({ accessToken })
                )
              } else {
                const errorDesc =
                  params.get('error_description') ||
                  params.get('error') ||
                  'Microsoft login failed'
                toast.error(errorDesc)
              }
            }
            setMsLoading(false)
          }
        } catch {
          // Cross-origin access error while user navigates on login.microsoftonline.com (expected)
        }
      }, 500)
    } catch (err: any) {
      toast.error(err?.message || 'Microsoft login failed')
      setMsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.02),
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2.5 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            HRMS Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Sign in with your company credentials or SSO
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAnyLoading}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isAnyLoading}
            sx={{ mb: 1 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setForgotModalOpen(true)}
              disabled={isAnyLoading}
              sx={{ textTransform: 'none', fontWeight: 600, px: 0 }}
            >
              Forgot password?
            </Button>
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isAnyLoading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ height: 42, fontWeight: 600 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>

        {/* Divider */}
        <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
          <Divider sx={{ flexGrow: 1 }} />
          <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 700 }}>
            OR CONTINUE WITH
          </Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>

        {/* SSO Action Buttons */}
        <Stack spacing={1.5}>
          {googleClientId ? (
            <Box
              ref={googleBtnRef}
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                minHeight: 40,
                opacity: isAnyLoading ? 0.6 : 1,
                pointerEvents: isAnyLoading ? 'none' : 'auto',
              }}
            />
          ) : (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleClick}
              disabled={isAnyLoading}
              startIcon={googleLoading ? <CircularProgress size={18} /> : <GoogleIcon />}
              sx={{
                height: 42,
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.primary',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'text.secondary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Button>
          )}

          <Button
            fullWidth
            variant="outlined"
            onClick={handleMicrosoftLogin}
            disabled={isAnyLoading}
            startIcon={msLoading ? <CircularProgress size={18} /> : <MicrosoftIcon />}
            sx={{
              height: 42,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.primary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: 'action.hover',
              },
            }}
          >
            {msLoading ? 'Connecting to Microsoft...' : 'Continue with Microsoft'}
          </Button>
        </Stack>
      </Paper>

      {/* Forgot Password Modal */}
      <Dialog
        open={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <HelpOutlineIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700}>
            Forgot Password?
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 1.5 }}>
          <Typography variant="body1" color="text.secondary">
            Please contact your HR or Admin to request a password reset.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setForgotModalOpen(false)}
            fullWidth
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LoginPage
