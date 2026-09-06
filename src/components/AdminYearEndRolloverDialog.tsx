// src/components/AdminYearEndRolloverDialog.tsx
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import toast from 'react-hot-toast'
import { leaveApi } from '../api/leave.api'
import type { RolloverResult } from '../types/leave.types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const AdminYearEndRolloverDialog = ({ open, onClose, onSuccess }: Props) => {
  const currentYear = new Date().getFullYear()
  const [fromYear, setFromYear] = useState<number>(currentYear)
  const [toYear, setToYear] = useState<number>(currentYear + 1)
  const [running, setRunning] = useState<boolean>(false)
  const [result, setResult] = useState<RolloverResult | null>(null)

  const handleRunRollover = async () => {
    if (toYear <= fromYear) {
      toast.error('To Year must be greater than From Year')
      return
    }

    setRunning(true)
    setResult(null)
    try {
      const res = await leaveApi.runRollover({ fromYear, toYear })
      setResult(res)
      toast.success(`Year-End Rollover completed! Processed ${res.successCount} balances.`)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Rollover failed')
    } finally {
      setRunning(false)
    }
  }

  const handleClose = () => {
    if (running) return
    setResult(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2.5 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <AutorenewIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Year-End Leave Rollover
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Transfer unused leave balances across years according to policy rules
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: '24px !important', pb: 2.5 }}>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: 1.5 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Important Process Information:
            </Typography>
            <Typography variant="caption" display="block">
              • Each employee's remaining balance for <strong>{fromYear}</strong> will be inspected.
            </Typography>
            <Typography variant="caption" display="block">
              • If the leave policy allows carry-forward, remaining days (up to Max Carry Forward) will be written to <strong>{toYear}</strong>'s carried-forward balance.
            </Typography>
            <Typography variant="caption" display="block">
              • Running this operation is idempotent: existing carried-forward balances for {toYear} will be safely recalculated and updated.
            </Typography>
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="From Year (Closing)"
              type="number"
              size="small"
              value={fromYear}
              onChange={(e) => setFromYear(Number(e.target.value))}
              disabled={running}
            />
            <TextField
              label="To Year (Target)"
              type="number"
              size="small"
              value={toYear}
              onChange={(e) => setToYear(Number(e.target.value))}
              disabled={running}
            />
          </Box>

          {result && (
            <Box sx={{ mt: 1 }}>
              <Divider sx={{ mb: 2 }} />
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Rollover Completed Successfully!
                </Typography>
                <Typography variant="body2">
                  • <strong>{result.successCount}</strong> leave balances carried forward.
                </Typography>
                <Typography variant="body2">
                  • <strong>{result.totalEmployees}</strong> active employees processed.
                </Typography>
                {result.errors.length > 0 && (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                    • Encountered {result.errors.length} non-blocking item errors.
                  </Typography>
                )}
              </Alert>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={running} color="inherit">
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleRunRollover}
            disabled={running || toYear <= fromYear}
            startIcon={running ? <CircularProgress size={18} color="inherit" /> : <AutorenewIcon />}
            sx={{ fontWeight: 600 }}
          >
            {running ? 'Running Rollover...' : `Run Rollover (${fromYear} → ${toYear})`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
