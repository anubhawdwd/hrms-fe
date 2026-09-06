// src/components/AdminEditLeaveAllocationDialog.tsx
import { formatLeaveDays } from '../utils/format.utils'
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Stack,
  CircularProgress,
  useTheme,
  alpha,
  Paper,
  Divider,
} from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import toast from 'react-hot-toast'
import { useLeaveTypes } from '../hooks/useLeave'
import { leaveApi } from '../api/leave.api'
import type { LeaveBalance, LeaveType } from '../types/leave.types'

interface Props {
  open: boolean
  employee: {
    id: string
    displayName: string
    employeeCode: number | string | null
  } | null
  existingBalance?: LeaveBalance | null
  allLeaveTypes?: LeaveType[]
  currentBalances?: LeaveBalance[]
  onClose: () => void
  onSuccess: () => void
}

export const AdminEditLeaveAllocationDialog: React.FC<Props> = ({
  open,
  employee,
  existingBalance,
  allLeaveTypes,
  currentBalances = [],
  onClose,
  onSuccess,
}) => {
  const theme = useTheme()
  const currentYear = new Date().getFullYear()
  const { types: fetchedTypes } = useLeaveTypes()

  const availableTypes = allLeaveTypes && allLeaveTypes.length > 0 ? allLeaveTypes : fetchedTypes
  const activeLeaveTypes = availableTypes.filter((t) => t.isActive !== false)

  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [newBalance, setNewBalance] = useState<string | number>('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Sync state when dialog opens or initial balance changes
  useEffect(() => {
    if (open) {
      if (existingBalance) {
        const tid = existingBalance.leaveTypeId || existingBalance.leaveType?.id || ''
        setLeaveTypeId(tid)
        setNewBalance(existingBalance.remaining)
      } else if (activeLeaveTypes.length > 0) {
        const firstType = activeLeaveTypes[0]
        setLeaveTypeId(firstType.id)
        const match = currentBalances.find(
          (b) =>
            b.leaveTypeId === firstType.id ||
            b.leaveType?.name === firstType.name ||
            b.leaveType?.code === firstType.code
        )
        setNewBalance(match ? match.remaining : 0)
      } else {
        setLeaveTypeId('')
        setNewBalance(0)
      }
      setReason('')
    }
  }, [open, existingBalance, activeLeaveTypes, currentBalances])

  // When user switches leave type from dropdown, update target balance defaults
  const handleTypeChange = (newTypeId: string) => {
    setLeaveTypeId(newTypeId)
    const selectedType = activeLeaveTypes.find((t) => t.id === newTypeId)
    const match = currentBalances.find(
      (b) =>
        b.leaveTypeId === newTypeId ||
        b.leaveType?.name === selectedType?.name ||
        b.leaveType?.code === selectedType?.code
    )
    if (match) {
      setNewBalance(match.remaining)
    } else {
      setNewBalance(0)
    }
  }

  if (!employee) return null

  // Find currently selected leave type & matching balance
  const selectedType = activeLeaveTypes.find((t) => t.id === leaveTypeId)
  const matchingBalance = currentBalances.find(
    (b) =>
      b.leaveTypeId === leaveTypeId ||
      b.leaveType?.name === selectedType?.name ||
      b.leaveType?.code === selectedType?.code
  )

  const currentAvailable = matchingBalance ? matchingBalance.remaining : 0
  const currentBooked = matchingBalance ? matchingBalance.used : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numBalance = Number(newBalance)
    if (isNaN(numBalance) || numBalance < 0) {
      toast.error('Please enter a valid positive number for New Balance')
      return
    }

    if (!leaveTypeId) {
      toast.error('Please select a leave type')
      return
    }

    setSubmitting(true)
    try {
      await leaveApi.adjustEmployeeBalance(employee.id, {
        leaveTypeId,
        newBalance: numBalance,
        year: currentYear,
        reason: reason.trim() || undefined,
      })

      const typeName = selectedType?.name || 'Leave'
      toast.success(`Updated ${typeName} available balance to ${numBalance} days`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update balance')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2.5 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AccountBalanceWalletIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            Correct Leave Balance
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            #{employee.employeeCode} · {employee.displayName}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3, pt: '24px !important', pb: 2.5 }}>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
            {/* Leave Type Select */}
            <TextField
              select
              label="Leave Type"
              fullWidth
              size="small"
              required
              value={leaveTypeId}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={submitting || activeLeaveTypes.length === 0}
            >
              {activeLeaveTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </MenuItem>
              ))}
            </TextField>

            {/* Zoho-Style Metrics: Available & Booked */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.default, 0.6),
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" justifyContent="space-between" divider={<Divider orientation="vertical" flexItem />}>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    Available
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {formatLeaveDays(currentAvailable)} {currentAvailable === 1 ? 'day' : 'days'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    Booked
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="text.secondary">
                    {formatLeaveDays(currentBooked)} {currentBooked === 1 ? 'day' : 'days'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Existing Balance (READ ONLY) */}
            <TextField
              label="Existing Balance"
              value={`${formatLeaveDays(currentAvailable)} days`}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.action.hover, 0.05),
                  borderRadius: 1.5,
                },
                '& .MuiInputBase-input': {
                  fontWeight: 600,
                  color: 'text.secondary',
                },
              }}
              helperText="Current available balance before correction"
            />

            {/* New Balance (EDITABLE) */}
            <TextField
              label="New Balance"
              type="number"
              fullWidth
              size="small"
              required
              inputProps={{ min: 0, step: 'any' }}
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              disabled={submitting}
              autoFocus
              helperText="Enter the corrected available balance (decimals allowed for hourly leave)"
            />

            {/* Reason / Notes */}
            <TextField
              label="Reason / Notes (Optional)"
              placeholder="e.g. Leave balance correction / manual adjustment"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} disabled={submitting} color="inherit" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting || !leaveTypeId}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AccountBalanceWalletIcon />}
            sx={{ fontWeight: 700, borderRadius: '8px', px: 2.5 }}
          >
            {submitting ? 'Saving...' : 'Save Balance'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AdminEditLeaveAllocationDialog
