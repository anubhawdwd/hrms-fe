// src/components/ApplyLeaveModal.tsx
import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  CircularProgress,
  Typography,
  alpha,
  useTheme,
  Divider,
  Chip,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useLeaveTypes, useLeaveBalances } from '../hooks/useLeave'
import { leaveApi } from '../api/leave.api'
import type { ApplyLeaveRequest } from '../types/leave.types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const ApplyLeaveModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const theme = useTheme()
  const currentYear = new Date().getFullYear()
  const { types, loading: typesLoading } = useLeaveTypes()
  const { balances } = useLeaveBalances(currentYear)

  // Filter available leave types:
  // 1. Unpaid Leave / LWP is ALWAYS available (requires no allocation, balance > 0 not required)
  // 2. Paid leaves must have available entitlement (remaining > 0)
  const availableLeaveTypes = useMemo(() => {
    return types.filter((t) => {
      if (t.isActive === false) return false
      if (t.isPaid === false || t.code === 'LWP') return true

      const b = balances.find(
        (bal) =>
          bal.leaveTypeId === t.id ||
          bal.leaveType?.name === t.name ||
          bal.leaveType?.code === t.code
      )
      return b && b.remaining > 0
    })
  }, [types, balances])

  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Computed duration summary (Full Day)
  const durationSummary = useMemo(() => {
    if (!fromDate || !toDate) return null
    const from = new Date(fromDate)
    const to = new Date(toDate)
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) return null
    const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return `${diff} full day${diff > 1 ? 's' : ''}`
  }, [fromDate, toDate])

  const resetForm = () => {
    setLeaveTypeId('')
    setFromDate('')
    setToDate('')
    setReason('')
    setError(null)
  }

  const handleSubmit = async () => {
    setError(null)

    if (!leaveTypeId) {
      setError('Please select a leave type')
      return
    }
    if (!fromDate) {
      setError('Please select a start date')
      return
    }
    if (!toDate) {
      setError('Please select an end date')
      return
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError('End date must be on or after start date')
      return
    }

    setSubmitting(true)

    try {
      const payload: ApplyLeaveRequest = {
        leaveTypeId,
        fromDate,
        toDate,
        durationType: 'FULL_DAY',
      }

      if (reason.trim()) {
        payload.reason = reason.trim()
      }

      await leaveApi.apply(payload)
      resetForm()
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to apply leave')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', overflow: 'hidden' },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          pb: 1,
          pt: 3,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main',
          }}
        >
          <CalendarMonthIcon />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Apply Leave
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select leave type and full-day dates for your request
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Leave Type Selector */}
          <TextField
            select
            label="Leave Type"
            value={leaveTypeId}
            onChange={(e) => {
              setLeaveTypeId(e.target.value)
              setError(null)
            }}
            disabled={typesLoading}
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '10px' },
            }}
          >
            {availableLeaveTypes.map((t) => {
              const isUnpaid = t.isPaid === false || t.code === 'LWP'
              const b = balances.find(
                (bal) =>
                  bal.leaveTypeId === t.id ||
                  bal.leaveType?.name === t.name ||
                  bal.leaveType?.code === t.code
              )

              return (
                <MenuItem key={t.id} value={t.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{t.name}</span>
                    {isUnpaid ? (
                      <Chip
                        label="Unpaid (LWP)"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600 }}
                      />
                    ) : b ? (
                      <Chip
                        label={`${b.remaining} days available`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600 }}
                      />
                    ) : null}
                  </Box>
                </MenuItem>
              )
            })}
          </TextField>

          {/* Full Day: From Date -> To Date */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                if (!toDate || new Date(e.target.value) > new Date(toDate)) {
                  setToDate(e.target.value)
                }
                setError(null)
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '10px' },
              }}
            />
            <TextField
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setError(null)
              }}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: fromDate || undefined },
              }}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '10px' },
              }}
            />
          </Box>

          {/* Duration Summary Badge */}
          {durationSummary && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.info.main, 0.08),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" fontWeight={600} color="info.main">
                Requested Duration:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="info.dark">
                {durationSummary}
              </Typography>
            </Box>
          )}

          {/* Reason */}
          <TextField
            label="Reason (Optional)"
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a brief reason for your leave request..."
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '10px' },
            }}
          />

          {/* Error message */}
          {error && (
            <Typography
              variant="caption"
              color="error"
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.08),
                p: 1.5,
                borderRadius: '8px',
                border: '1px solid',
                borderColor: alpha(theme.palette.error.main, 0.2),
              }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          color="inherit"
          disabled={submitting}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            minWidth: 120,
          }}
        >
          {submitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Submit Request'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ApplyLeaveModal
