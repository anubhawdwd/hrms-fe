// src/components/ApplyLeaveModal.tsx
import { useState, useMemo } from 'react'
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
  ToggleButtonGroup,
  ToggleButton,
  alpha,
  useTheme,
  Divider,
  Chip,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import TodayIcon from '@mui/icons-material/Today'
import MoreTimeIcon from '@mui/icons-material/MoreTime'
import { useLeaveTypes } from '../hooks/useLeave'
import { leaveApi } from '../api/leave.api'
import type { LeaveDurationType, ApplyLeaveRequest } from '../types/leave.types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const TIME_OPTIONS = (() => {
  const options: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      )
    }
  }
  return options
})()

const formatTimeLabel = (time: string) => {
  const parts = time.split(':')
  const h = parseInt(parts[0] ?? '0', 10)
  const m = parts[1] ?? '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${ampm}`
}

type HalfDaySlot = 'FIRST_HALF' | 'SECOND_HALF'
type QuarterDaySlot = 'Q1' | 'Q2' | 'Q3' | 'Q4'

const HALF_DAY_OPTIONS: { value: HalfDaySlot; label: string; time: string }[] = [
  { value: 'FIRST_HALF', label: '1st Half', time: '09:00 – 01:00 PM' },
  { value: 'SECOND_HALF', label: '2nd Half', time: '02:00 – 06:00 PM' },
]

const QUARTER_DAY_OPTIONS: { value: QuarterDaySlot; label: string; time: string }[] = [
  { value: 'Q1', label: '1st Quarter', time: '09:00 – 11:00 AM' },
  { value: 'Q2', label: '2nd Quarter', time: '11:00 AM – 01:00 PM' },
  { value: 'Q3', label: '3rd Quarter', time: '02:00 – 04:00 PM' },
  { value: 'Q4', label: '4th Quarter', time: '04:00 – 06:00 PM' },
]

const ApplyLeaveModal = ({ open, onClose, onSuccess }: Props) => {
  const theme = useTheme()
  const { types, loading: typesLoading } = useLeaveTypes()

  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [durationType, setDurationType] = useState<LeaveDurationType>('FULL_DAY')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [halfSlot, setHalfSlot] = useState<HalfDaySlot | ''>('')
  const [quarterSlot, setQuarterSlot] = useState<QuarterDaySlot | ''>('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Computed duration summary
  const durationSummary = useMemo(() => {
    switch (durationType) {
      case 'FULL_DAY': {
        if (!fromDate || !toDate) return null
        const from = new Date(fromDate)
        const to = new Date(toDate)
        if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) return null
        const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return `${diff} day${diff > 1 ? 's' : ''}`
      }
      case 'HALF_DAY': {
        if (!halfSlot) return null
        const opt = HALF_DAY_OPTIONS.find((o) => o.value === halfSlot)
        return opt ? `Half Day — ${opt.label}` : null
      }
      case 'QUARTER_DAY': {
        if (!quarterSlot) return null
        const opt = QUARTER_DAY_OPTIONS.find((o) => o.value === quarterSlot)
        return opt ? `Quarter Day — ${opt.label}` : null
      }
      case 'HOURLY': {
        if (!startTime || !endTime) return null
        const sp = startTime.split(':').map(Number)
        const ep = endTime.split(':').map(Number)
        const startMins = (sp[0] ?? 0) * 60 + (sp[1] ?? 0)
        const endMins = (ep[0] ?? 0) * 60 + (ep[1] ?? 0)
        if (endMins <= startMins) return null
        const diffMins = endMins - startMins
        const hours = Math.floor(diffMins / 60)
        const mins = diffMins % 60
        const parts: string[] = []
        if (hours > 0) parts.push(`${hours}h`)
        if (mins > 0) parts.push(`${mins}m`)
        return parts.join(' ')
      }
      default:
        return null
    }
  }, [durationType, fromDate, toDate, halfSlot, quarterSlot, startTime, endTime])

  const handleDurationTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: LeaveDurationType | null
  ) => {
    if (newType) {
      setDurationType(newType)
      setError(null)
      // Reset sub-selections
      setHalfSlot('')
      setQuarterSlot('')
      setStartTime('')
      setEndTime('')
      if (newType !== 'FULL_DAY') {
        setToDate('')
      }
    }
  }

  const resetForm = () => {
    setLeaveTypeId('')
    setFromDate('')
    setToDate('')
    setDurationType('FULL_DAY')
    setHalfSlot('')
    setQuarterSlot('')
    setStartTime('')
    setEndTime('')
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
      setError('Please select a date')
      return
    }

    // Validate per type
    switch (durationType) {
      case 'FULL_DAY':
        if (!toDate) {
          setError('Please select an end date')
          return
        }
        if (new Date(fromDate) > new Date(toDate)) {
          setError('End date must be on or after start date')
          return
        }
        break
      case 'HALF_DAY':
        if (!halfSlot) {
          setError('Please select 1st half or 2nd half')
          return
        }
        break
      case 'QUARTER_DAY':
        if (!quarterSlot) {
          setError('Please select a quarter')
          return
        }
        break
      case 'HOURLY':
        if (!startTime || !endTime) {
          setError('Please select start and end time')
          return
        }
        if (startTime >= endTime) {
          setError('End time must be after start time')
          return
        }
        break
    }

    setSubmitting(true)

    try {
      const payload: ApplyLeaveRequest = {
        leaveTypeId,
        fromDate,
        toDate: durationType === 'FULL_DAY' ? toDate : fromDate,
        durationType,
      }

      if (durationType === 'HALF_DAY') {
        payload.slot = halfSlot
      } else if (durationType === 'QUARTER_DAY') {
        payload.slot = quarterSlot
      } else if (durationType === 'HOURLY') {
        payload.startTime = startTime
        payload.endTime = endTime
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

  // Filter end times
  const availableEndTimes = useMemo(() => {
    if (!startTime) return TIME_OPTIONS
    return TIME_OPTIONS.filter((t) => t > startTime)
  }, [startTime])

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
            Select type and duration for your leave request
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* ─── Duration Type Toggle ─── */}
          <Box>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 1,
                display: 'block',
              }}
            >
              Leave Mode
            </Typography>
            <ToggleButtonGroup
              value={durationType}
              exclusive
              onChange={handleDurationTypeChange}
              fullWidth
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1,
                '& .MuiToggleButtonGroup-grouped': {
                  border: '1.5px solid !important',
                  borderColor: `${theme.palette.divider} !important`,
                  borderRadius: '10px !important',
                  m: '0 !important',
                },
                '& .MuiToggleButton-root': {
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  gap: 0.5,
                  flexDirection: 'column',
                  lineHeight: 1.3,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: `${theme.palette.primary.main} !important`,
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                  },
                },
              }}
            >
              <ToggleButton value="FULL_DAY">
                <CalendarMonthIcon sx={{ fontSize: 18 }} />
                Daily
              </ToggleButton>
              <ToggleButton value="HALF_DAY">
                <TodayIcon sx={{ fontSize: 18 }} />
                Half Day
              </ToggleButton>
              <ToggleButton value="QUARTER_DAY">
                <MoreTimeIcon sx={{ fontSize: 18 }} />
                Quarter
              </ToggleButton>
              <ToggleButton value="HOURLY">
                <AccessTimeIcon sx={{ fontSize: 18 }} />
                Hourly
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* ─── Leave Type ─── */}
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
            {types
              .filter((t) => t.isActive)
              .map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {t.name}
                    <Chip
                      label={t.code}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
          </TextField>

          <Divider sx={{ my: 0.5 }} />

          {/* ═══ FULL_DAY: Date Range ═══ */}
          {durationType === 'FULL_DAY' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setError(null)
                  if (!toDate || e.target.value > toDate) {
                    setToDate(e.target.value)
                  }
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
          )}

          {/* ═══ HALF_DAY: Date + Slot ═══ */}
          {durationType === 'HALF_DAY' && (
            <>
              <TextField
                label="Date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setError(null)
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                }}
              />
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Select Half
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {HALF_DAY_OPTIONS.map((opt) => (
                    <Box
                      key={opt.value}
                      onClick={() => {
                        setHalfSlot(opt.value)
                        setError(null)
                      }}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: '1.5px solid',
                        borderColor:
                          halfSlot === opt.value
                            ? theme.palette.primary.main
                            : theme.palette.divider,
                        bgcolor:
                          halfSlot === opt.value
                            ? alpha(theme.palette.primary.main, 0.06)
                            : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: theme.palette.primary.light,
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={
                          halfSlot === opt.value
                            ? 'primary.main'
                            : 'text.primary'
                        }
                      >
                        {opt.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {opt.time}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          )}

          {/* ═══ QUARTER_DAY: Date + Slot ═══ */}
          {durationType === 'QUARTER_DAY' && (
            <>
              <TextField
                label="Date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setError(null)
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                }}
              />
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Select Quarter
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 1.5,
                  }}
                >
                  {QUARTER_DAY_OPTIONS.map((opt) => (
                    <Box
                      key={opt.value}
                      onClick={() => {
                        setQuarterSlot(opt.value)
                        setError(null)
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        border: '1.5px solid',
                        borderColor:
                          quarterSlot === opt.value
                            ? theme.palette.primary.main
                            : theme.palette.divider,
                        bgcolor:
                          quarterSlot === opt.value
                            ? alpha(theme.palette.primary.main, 0.06)
                            : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: theme.palette.primary.light,
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={
                          quarterSlot === opt.value
                            ? 'primary.main'
                            : 'text.primary'
                        }
                      >
                        {opt.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        {opt.time}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          )}

          {/* ═══ HOURLY: Date + Time Range ═══ */}
          {durationType === 'HOURLY' && (
            <>
              <TextField
                label="Date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setError(null)
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Start Time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    setError(null)
                    if (endTime && e.target.value >= endTime) {
                      setEndTime('')
                    }
                  }}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                  }}
                >
                  {TIME_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {formatTimeLabel(t)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="End Time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value)
                    setError(null)
                  }}
                  fullWidth
                  size="small"
                  disabled={!startTime}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                  }}
                >
                  {availableEndTimes.map((t) => (
                    <MenuItem key={t} value={t}>
                      {formatTimeLabel(t)}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </>
          )}

          {/* ─── Duration Summary ─── */}
          {durationSummary && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1.5,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.success.main, 0.06),
                border: '1px solid',
                borderColor: alpha(theme.palette.success.main, 0.15),
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                color="success.dark"
              >
                {durationSummary}
                {durationType === 'HOURLY' && startTime && endTime && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    fontWeight={400}
                    sx={{ ml: 1 }}
                  >
                    ({formatTimeLabel(startTime)} – {formatTimeLabel(endTime)})
                  </Typography>
                )}
              </Typography>
            </Box>
          )}

          {/* ─── Reason ─── */}
          <TextField
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={2}
            fullWidth
            size="small"
            placeholder="Briefly describe the reason for your leave..."
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '10px' },
            }}
          />

          {/* ─── Error ─── */}
          {error && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.error.main, 0.06),
                border: '1px solid',
                borderColor: alpha(theme.palette.error.main, 0.15),
              }}
            >
              <Typography
                variant="body2"
                color="error.dark"
                fontWeight={500}
              >
                {error}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          variant="outlined"
          sx={{ borderRadius: '10px', px: 3 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : null}
          sx={{
            borderRadius: '10px',
            px: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ApplyLeaveModal