// src/components/ApplyLeaveModal.tsx
import { useState } from 'react'
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
} from '@mui/material'
import { useLeaveTypes } from '../hooks/useLeave'
import { leaveApi } from '../api/leave.api'
import type { LeaveDurationType } from '../types/leave.types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const DURATION_TYPES: { value: LeaveDurationType; label: string }[] = [
  { value: 'FULL_DAY', label: 'Full Day' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'QUARTER_DAY', label: 'Quarter Day' },
  { value: 'HOURLY', label: 'Hourly' },
]

const ApplyLeaveModal = ({ open, onClose, onSuccess }: Props) => {
  const { types, loading: typesLoading } = useLeaveTypes()

  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [durationType, setDurationType] =
    useState<LeaveDurationType>('FULL_DAY')
  const [durationValue, setDurationValue] = useState(1)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!leaveTypeId || !fromDate || !toDate) {
      setError('Please fill all required fields')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await leaveApi.apply({
        leaveTypeId,
        fromDate,
        toDate,
        durationType,
        durationValue,
        reason: reason || undefined,
      })
      // Reset form
      setLeaveTypeId('')
      setFromDate('')
      setToDate('')
      setDurationType('FULL_DAY')
      setDurationValue(1)
      setReason('')
      onSuccess()
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to apply leave'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Apply Leave</DialogTitle>
      <DialogContent>
        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <TextField
            select
            label="Leave Type"
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            disabled={typesLoading}
            fullWidth
          >
            {types
              .filter((t) => t.isActive)
              .map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Duration Type"
            value={durationType}
            onChange={(e) =>
              setDurationType(e.target.value as LeaveDurationType)
            }
            fullWidth
          >
            {DURATION_TYPES.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Duration Value"
            type="number"
            value={durationValue}
            onChange={(e) => setDurationValue(Number(e.target.value))}
            inputProps={{ min: 0.25, step: 0.25 }}
            fullWidth
            helperText="Number of days (or hours for hourly leave)"
          />

          <TextField
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {error && (
            <Box sx={{ color: 'error.main', fontSize: 14 }}>
              {error}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={
            submitting ? <CircularProgress size={18} /> : null
          }
        >
          {submitting ? 'Submitting...' : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ApplyLeaveModal