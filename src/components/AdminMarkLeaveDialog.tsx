// src/components/AdminMarkLeaveDialog.tsx
import { formatLeaveDays } from '../utils/format.utils'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import toast from 'react-hot-toast'
import { leaveApi } from '../api/leave.api'
import type { LeaveType, LeaveBalance } from '../types/leave.types'

interface Props {
  open: boolean
  onClose: () => void
  employee: {
    id: string
    displayName: string
    employeeCode: number
  } | null
  leaveTypes: LeaveType[]
  leaveBalances: LeaveBalance[]
  onSuccess: () => void
}

export const AdminMarkLeaveDialog = ({
  open,
  onClose,
  employee,
  leaveTypes,
  leaveBalances,
  onSuccess,
}: Props) => {
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [durationType, setDurationType] = useState('FULL_DAY')
  const [fromDate, setFromDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [slot, setSlot] = useState('FIRST_HALF')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('13:00')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && leaveTypes.length > 0 && !leaveTypeId) {
      setLeaveTypeId(leaveTypes[0].id)
    }
  }, [open, leaveTypes, leaveTypeId])

  if (!employee) return null

  const selectedBalance = leaveBalances.find((b) => b.leaveTypeId === leaveTypeId || b.leaveType?.id === leaveTypeId || (leaveTypes.find(t => t.id === leaveTypeId)?.name === b.leaveType?.name))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveTypeId) {
      toast.error('Please select a leave type')
      return
    }

    setSubmitting(true)
    try {
      await leaveApi.markLeaveAdmin({
        employeeId: employee.id,
        leaveTypeId,
        fromDate,
        toDate: durationType === 'FULL_DAY' ? toDate : fromDate,
        durationType,
        slot: durationType === 'HALF_DAY' || durationType === 'QUARTER_DAY' ? slot : undefined,
        startTime: durationType === 'HOURLY' ? startTime : undefined,
        endTime: durationType === 'HOURLY' ? endTime : undefined,
        reason: reason.trim() || undefined,
      })

      toast.success('Leave marked and approved on behalf of employee')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to mark leave')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2.5 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <FlightTakeoffIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Mark Leave on Behalf of Employee
          </Typography>
          <Typography variant="body2" color="text.secondary">
            #{employee.employeeCode} • {employee.displayName}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3, pt: '24px !important', pb: 2.5 }}>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              This will directly create an <strong>APPROVED</strong> leave entry, deduct the appropriate quota balance, and record an HR audit trail.
            </Alert>

            {/* Leave Type */}
            <TextField
              select
              label="Leave Type"
              fullWidth
              required
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              disabled={submitting}
              helperText={
                (() => {
                  const selType = leaveTypes.find((t) => t.id === leaveTypeId)
                  if (selType && (selType.isPaid === false || selType.code === 'LWP')) {
                    return 'Unpaid leave (Unlimited / No quota deduction)'
                  }
                  return selectedBalance
                    ? `Available: ${formatLeaveDays(selectedBalance.remaining)} days · Used: ${formatLeaveDays(selectedBalance.used)} days`
                    : 'Select leave type'
                })()
              }
            >
              {leaveTypes.map((type) => {
                const isUnpaid = type.isPaid === false || type.code === 'LWP'
                const bal = leaveBalances.find((b) => b.leaveTypeId === type.id || b.leaveType?.id === type.id || b.leaveType?.name === type.name)
                return (
                  <MenuItem key={type.id} value={type.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span>{type.name}</span>
                      {isUnpaid ? (
                        <Chip
                          label="Unpaid (LWP)"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600 }}
                        />
                      ) : bal ? (
                        <Chip
                          label={`${formatLeaveDays(bal.remaining)} Available`}
                          size="small"
                          color={bal.remaining > 0 ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      ) : null}
                    </Box>
                  </MenuItem>
                )
              })}
            </TextField>

            {/* Duration Type */}
            <TextField
              select
              label="Duration Type"
              fullWidth
              value={durationType}
              onChange={(e) => setDurationType(e.target.value)}
              disabled={submitting}
            >
              <MenuItem value="FULL_DAY">Full Day(s)</MenuItem>
              <MenuItem value="HALF_DAY">Half Day (0.5 day)</MenuItem>
              <MenuItem value="QUARTER_DAY">Quarter Day (0.25 day)</MenuItem>
              <MenuItem value="HOURLY">Hourly</MenuItem>
            </TextField>

            {/* Dates */}
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="From Date"
                value={fromDate ? dayjs(fromDate) : null}
                onChange={(newValue) => setFromDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                disabled={submitting}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    size: 'small',
                  },
                }}
              />
              {durationType === 'FULL_DAY' && (
                <DatePicker
                  label="To Date"
                  value={toDate ? dayjs(toDate) : null}
                  minDate={fromDate ? dayjs(fromDate) : undefined}
                  onChange={(newValue) => setToDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                  disabled={submitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      size: 'small',
                    },
                  }}
                />
              )}
            </Stack>

            {/* Half / Quarter Slot */}
            {durationType === 'HALF_DAY' && (
              <TextField
                select
                label="Half Day Slot"
                fullWidth
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                disabled={submitting}
              >
                <MenuItem value="FIRST_HALF">First Half (Morning Session)</MenuItem>
                <MenuItem value="SECOND_HALF">Second Half (Afternoon Session)</MenuItem>
              </TextField>
            )}

            {durationType === 'QUARTER_DAY' && (
              <TextField
                select
                label="Quarter Day Slot"
                fullWidth
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                disabled={submitting}
              >
                <MenuItem value="Q1">Q1 (09:00 - 11:00)</MenuItem>
                <MenuItem value="Q2">Q2 (11:00 - 13:00)</MenuItem>
                <MenuItem value="Q3">Q3 (14:00 - 16:00)</MenuItem>
                <MenuItem value="Q4">Q4 (16:00 - 18:00)</MenuItem>
              </TextField>
            )}

            {/* Hourly start / end times */}
            {durationType === 'HOURLY' && (
              <Stack direction="row" spacing={2}>
                <TimePicker
                  label="Start Time"
                  value={startTime ? dayjs(`2000-01-01T${startTime}`) : null}
                  onChange={(newValue) => setStartTime(newValue && newValue.isValid() ? newValue.format('HH:mm') : '')}
                  disabled={submitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      size: 'small',
                    },
                  }}
                />
                <TimePicker
                  label="End Time"
                  value={endTime ? dayjs(`2000-01-01T${endTime}`) : null}
                  onChange={(newValue) => setEndTime(newValue && newValue.isValid() ? newValue.format('HH:mm') : '')}
                  disabled={submitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      size: 'small',
                    },
                  }}
                />
              </Stack>
            )}

            {/* Reason / Notes */}
            <TextField
              label="Reason / Notes (Optional)"
              placeholder="e.g. Verbal request / Emergency medical / HR manual override"
              fullWidth
              multiline
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <FlightTakeoffIcon />}
            sx={{ fontWeight: 600 }}
          >
            {submitting ? 'Marking Leave...' : 'Confirm & Mark Leave'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
