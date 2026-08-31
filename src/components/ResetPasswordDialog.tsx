// src/components/ResetPasswordDialog.tsx
import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  TextField,
  InputAdornment,
  Box,
} from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import toast from 'react-hot-toast'

import { userApi } from '../api/user.api'

interface ResetPasswordDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  employeeName: string
  email: string
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  onClose,
  userId,
  employeeName,
  email,
}) => {
  const [step, setStep] = useState<'CONFIRM' | 'RESULT'>('CONFIRM')
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO')
  const [manualPassword, setManualPassword] = useState('')
  const [showManualPassword, setShowManualPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Ref to the result password input for in-dialog selection and copying
  const passwordInputRef = useRef<HTMLInputElement | null>(null)

  const handleReset = async () => {
    if (mode === 'MANUAL') {
      const trimmed = manualPassword.trim()
      if (!trimmed) {
        setError('Please enter a temporary password')
        return
      }
      if (trimmed.length < 6) {
        setError('Password must be at least 6 characters long')
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const res = await userApi.resetPassword(
        userId,
        mode === 'MANUAL' ? manualPassword.trim() : undefined
      )
      setTemporaryPassword(res.temporaryPassword)
      setStep('RESULT')
      toast.success('Password reset successfully')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reset password'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Robust multi-strategy clipboard copier supporting HTTP LAN and secure contexts
  const handleCopy = async () => {
    if (!temporaryPassword) return
    let success = false

    // Method 1: Modern asynchronous Clipboard API (Supported in Secure Contexts: HTTPS, localhost)
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(temporaryPassword)
        success = true
      } catch {
        success = false
      }
    }

    // Method 2: In-Dialog Element Selection + execCommand (Works on HTTP LAN & avoids Dialog FocusTrap issues)
    if (!success && passwordInputRef.current) {
      try {
        passwordInputRef.current.focus()
        passwordInputRef.current.select()
        passwordInputRef.current.setSelectionRange(0, temporaryPassword.length)
        success = document.execCommand('copy')
      } catch {
        success = false
      }
    }

    // Method 3: Fallback off-screen textarea
    if (!success) {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = temporaryPassword
        textArea.setAttribute('readonly', '')
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        textArea.style.left = '0'
        textArea.style.top = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        textArea.setSelectionRange(0, temporaryPassword.length)
        success = document.execCommand('copy')
        document.body.removeChild(textArea)
      } catch {
        success = false
      }
    }

    if (success) {
      setCopied(true)
      toast.success('Password copied to clipboard!')
      setTimeout(() => setCopied(false), 3000)
    } else {
      setCopied(false)
      passwordInputRef.current?.select()
      toast.error('Unable to copy automatically. Please copy the password manually.')
    }
  }

  const handleClose = () => {
    if (loading) return
    // Reset internal state completely when closing dialog
    setStep('CONFIRM')
    setMode('AUTO')
    setManualPassword('')
    setShowManualPassword(false)
    setTemporaryPassword(null)
    setError(null)
    setCopied(false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      {step === 'CONFIRM' ? (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
            <LockResetIcon color="warning" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              Reset Password
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ py: 1.5 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Reset password for <strong>{employeeName}</strong> ({email})?
            </Typography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              This will invalidate the employee's existing sessions and generate a temporary password. The employee will be required to create a new password after login.
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <FormControl component="fieldset" sx={{ width: '100%', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 0.5 }}>
                PASSWORD GENERATION METHOD
              </Typography>
              <RadioGroup
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as 'AUTO' | 'MANUAL')
                  setError(null)
                }}
              >
                <FormControlLabel
                  value="AUTO"
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="body2" fontWeight={500}>
                      Auto-generate random temporary password
                    </Typography>
                  }
                  disabled={loading}
                />
                <FormControlLabel
                  value="MANUAL"
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="body2" fontWeight={500}>
                      Set temporary password manually
                    </Typography>
                  }
                  disabled={loading}
                />
              </RadioGroup>
            </FormControl>

            {mode === 'MANUAL' && (
              <Box sx={{ mt: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Temporary Password *"
                  type={showManualPassword ? 'text' : 'password'}
                  value={manualPassword}
                  onChange={(e) => {
                    setManualPassword(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                  placeholder="Min 6 characters"
                  helperText="Employee must change this upon first login"
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowManualPassword(!showManualPassword)}
                          edge="end"
                          tabIndex={-1}
                        >
                          {showManualPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleClose} disabled={loading} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleReset}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockResetIcon />}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              Password Reset Successfully
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ py: 1.5 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              This temporary password is shown only once. Share it securely with the employee.
            </Alert>

            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.75 }}>
              TEMPORARY PASSWORD
            </Typography>

            <Box sx={{ mb: 1 }}>
              <TextField
                inputRef={passwordInputRef}
                fullWidth
                size="small"
                value={temporaryPassword || ''}
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'primary.main',
                    bgcolor: 'grey.50',
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copied ? 'Copied!' : 'Copy to Clipboard'}>
                        <IconButton
                          onClick={handleCopy}
                          color={copied ? 'success' : 'primary'}
                          edge="end"
                          size="small"
                        >
                          {copied ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                onClick={() => {
                  passwordInputRef.current?.select()
                }}
                helperText={copied ? '✔ Password copied to clipboard!' : 'Click input to select all text for manual copy'}
                FormHelperTextProps={{
                  sx: {
                    color: copied ? 'success.main' : 'text.secondary',
                    fontWeight: copied ? 600 : 400,
                  },
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="contained" onClick={handleClose} fullWidth>
              Done
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}

export default ResetPasswordDialog
