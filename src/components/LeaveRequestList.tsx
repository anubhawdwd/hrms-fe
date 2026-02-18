// src/components/LeaveRequestList.tsx
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import dayjs from 'dayjs'
import type { LeaveRequest } from '../types/leave.types'

interface Props {
  requests: LeaveRequest[]
  loading: boolean
  onCancel?: (id: string) => void
}

const statusConfig: Record<
  string,
  { color: 'warning' | 'success' | 'error' | 'default'; label: string }
> = {
  PENDING: { color: 'warning', label: 'Pending' },
  APPROVED: { color: 'success', label: 'Approved' },
  REJECTED: { color: 'error', label: 'Rejected' },
  CANCELLED: { color: 'default', label: 'Cancelled' },
}

const formatTimeLabel = (time: string) => {
  const parts = time.split(':')
  const h = parseInt(parts[0] ?? '0', 10)
  const m = parts[1] ?? '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${ampm}`
}

const formatDuration = (req: LeaveRequest): string => {
  switch (req.durationType) {
    case 'FULL_DAY': {
      const days = req.durationValue
      return `${days} day${days > 1 ? 's' : ''}`
    }
    case 'HALF_DAY':
      return 'Half Day'
    case 'QUARTER_DAY':
      return 'Quarter Day'
    case 'HOURLY': {
      const hours = Math.floor(req.durationValue)
      const mins = Math.round((req.durationValue - hours) * 60)
      const parts: string[] = []
      if (hours > 0) parts.push(`${hours}h`)
      if (mins > 0) parts.push(`${mins}m`)
      return parts.join(' ') || '0m'
    }
    default:
      return `${req.durationValue}`
  }
}

const formatTimeRange = (req: LeaveRequest): string | null => {
  if (req.startTime && req.endTime) {
    return `${formatTimeLabel(req.startTime)} – ${formatTimeLabel(req.endTime)}`
  }
  return null
}

const LeaveRequestList = ({ requests, loading, onCancel }: Props) => {
  const theme = useTheme()

  if (loading) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Loading leave requests…
      </Typography>
    )
  }

  if (requests.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No leave requests found
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {requests.map((req) => {
        const sc = statusConfig[req.status] ?? statusConfig.CANCELLED
        const timeRange = formatTimeRange(req)

        return (
          <Box
            key={req.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: '12px',
              bgcolor:
                req.status === 'PENDING'
                  ? alpha(theme.palette.warning.main, 0.03)
                  : 'transparent',
              border: '1px solid',
              borderColor: theme.palette.divider,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          >
            {/* Leave type badge */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                fontWeight: 800,
                fontSize: '0.75rem',
                flexShrink: 0,
              }}
            >
              {req.leaveType.code}
            </Box>

            {/* Details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.3,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="body2" fontWeight={600} noWrap>
                  {req.leaveType.name}
                </Typography>
                <Chip
                  label={sc.label}
                  color={sc.color}
                  size="small"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {req.durationType === 'FULL_DAY'
                  ? req.fromDate.slice(0, 10) === req.toDate.slice(0, 10)
                    ? dayjs(req.fromDate).format('DD MMM YYYY')
                    : `${dayjs(req.fromDate).format('DD MMM')} – ${dayjs(req.toDate).format('DD MMM YYYY')}`
                  : dayjs(req.fromDate).format('DD MMM YYYY')}
                {' · '}
                {formatDuration(req)}
                {timeRange && ` · ${timeRange}`}
              </Typography>
              {req.reason && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mt: 0.3,
                    fontStyle: 'italic',
                  }}
                >
                  {req.reason}
                </Typography>
              )}
            </Box>

            {/* Cancel button */}
            {req.status === 'PENDING' && onCancel && (
              <Tooltip title="Cancel request">
                <IconButton
                  size="small"
                  onClick={() => onCancel(req.id)}
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                    },
                  }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default LeaveRequestList