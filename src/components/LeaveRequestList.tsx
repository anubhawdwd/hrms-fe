// src/components/LeaveRequestList.tsx
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import dayjs from 'dayjs'
import type { LeaveRequest } from '../types/leave.types'

interface Props {
  requests: LeaveRequest[]
  loading: boolean
  onCancel?: (requestId: string) => void
  showActions?: boolean
}

const statusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'REJECTED':
      return 'error'
    case 'CANCELLED':
      return 'default'
    default:
      return 'default'
  }
}

const LeaveRequestList = ({
  requests,
  loading,
  onCancel,
  showActions = true,
}: Props) => {
  if (loading) {
    return (
      <Typography color="text.secondary">Loading requests...</Typography>
    )
  }

  if (requests.length === 0) {
    return (
      <Typography color="text.secondary">
        No leave requests found
      </Typography>
    )
  }

  return (
    <Box>
      {requests.map((req) => (
        <Box
          key={req.id}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {req.leaveType.name} ({req.leaveType.code})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayjs(req.fromDate).format('DD MMM')} –{' '}
              {dayjs(req.toDate).format('DD MMM YYYY')} ·{' '}
              {req.durationValue} {req.durationType.toLowerCase().replace('_', ' ')}
            </Typography>
            {req.reason && (
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                Reason: {req.reason}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={req.status}
              color={statusColor(req.status) as any}
              size="small"
            />
            {showActions &&
              req.status === 'PENDING' &&
              onCancel && (
                <Tooltip title="Cancel request">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onCancel(req.id)}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default LeaveRequestList