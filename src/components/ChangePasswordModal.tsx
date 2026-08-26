// src/components/ChangePasswordModal.tsx
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import LogoutIcon from '@mui/icons-material/Logout'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { authApi } from '../api/auth.api'
import { useUser } from '../hooks/useAuth'
import { setUser, clearAuth } from '../store/auth.slice'

const ChangePasswordModal = () => {
  const user = useUser()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpen = Boolean(user?.mustChangePassword)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    dispatch(clearAuth())
    navigate('/', { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      toast.success('Password changed successfully!')
      
      // Update store with mustChangePassword = false
      if (user) {
        dispatch(setUser({ ...user, mustChangePassword: false }))
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to change password'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog
      open={isOpen}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          p: 2,
          borderRadius: 2,
          boxShadow: 24,
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, pb: 1 }}>
          <LockResetIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Set New Password
            </Typography>
            <Typography variant="caption" color="text.secondary">
              First-time login security requirement
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 1, py: 2 }}>
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            You are using a temporary password. Please set a new password to continue using HRMS.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Current (Temporary) Password"
            type="password"
            fullWidth
            required
            autoFocus
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            label="New Password (min 6 characters)"
            type="password"
            fullWidth
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </DialogContent>

        <DialogActions sx={{ px: 1, pt: 2, justifyContent: 'space-between' }}>
          <Button
            type="button"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            disabled={loading}
            size="small"
          >
            Log Out
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {loading ? 'Saving...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default ChangePasswordModal
