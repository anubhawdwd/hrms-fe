// src/pages/AdminLeaveApprovals.tsx
import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { apiClient } from '../api/client'
import { leaveApi } from '../api/leave.api'
import type { LeaveRequest } from '../types/leave.types'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

/* --- Extended type: pending/approved list includes employee --- */
type LeaveRequestWithEmployee = LeaveRequest & {
  employee: {
    id: string
    displayName: string
    designation: { name: string }
  }
}

/* --- HR-Cancel Dialog --- */
interface HrCancelDialogProps {
  open: boolean
  request: LeaveRequestWithEmployee | null
  onClose: () => void
  onConfirm: (requestId: string, reason: string) => Promise<void>
}

const HrCancelDialog = ({
  open,
  request,
  onClose,
  onConfirm,
}: HrCancelDialogProps) => {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setReason('')
      setError(null)
      setSubmitting(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('A cancellation reason is required')
      return
    }
    if (!request) return
    setSubmitting(true)
    try {
      await onConfirm(request.id, reason.trim())
      onClose()
    } catch (err: any) {
      setError(err?.message || 'HR cancel failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}
    >
      <DialogTitle sx={{ pt: 3, pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          Cancel Approved Leave
        </Typography>
        {request && (
          <Typography variant="caption" color="text.secondary" display="block">
            {request.employee.displayName} &middot; {request.leaveType.name} &middot;{' '}
            {dayjs(request.fromDate).format('DD MMM')}
            {request.fromDate.slice(0, 10) !== request.toDate.slice(0, 10) &&
              ` - ${dayjs(request.toDate).format('DD MMM YYYY')}`}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <TextField
          label="Cancellation Reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setError(null)
          }}
          multiline
          rows={3}
          fullWidth
          size="small"
          placeholder="State the reason for cancelling this approved leave..."
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        {error && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: '10px',
              bgcolor: (t) => alpha(t.palette.error.main, 0.06),
              border: '1px solid',
              borderColor: (t) => alpha(t.palette.error.main, 0.15),
            }}
          >
            <Typography variant="body2" color="error.dark" fontWeight={500}>
              {error}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          variant="outlined"
          sx={{ borderRadius: '10px', px: 3 }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{ borderRadius: '10px', px: 3 }}
        >
          {submitting ? 'Cancelling...' : 'Confirm Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* =================================================
   MAIN PAGE
   ================================================= */
const AdminLeaveApprovals = () => {
  const theme = useTheme()
  const [tab, setTab] = useState<0 | 1>(0) // 0 = Pending, 1 = Approved

  const [pending, setPending] = useState<LeaveRequestWithEmployee[]>([])
  const [approved, setApproved] = useState<LeaveRequestWithEmployee[]>([])
  const [loading, setLoading] = useState(true)

  const [cancelTarget, setCancelTarget] =
    useState<LeaveRequestWithEmployee | null>(null)

  const loadPending = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get<LeaveRequestWithEmployee[]>(
        '/api/leave/requests/pending'
      )
      setPending(data)
    } catch {
      setPending([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadApproved = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leaveApi.getApprovedRequests()
      setApproved(data)
    } catch {
      setApproved([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 0) loadPending()
    else loadApproved()
  }, [tab, loadPending, loadApproved])

  const handleApprove = async (requestId: string) => {
    try {
      await leaveApi.approve(requestId)
      toast.success('Leave approved')
      loadPending()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Approval failed')
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      await leaveApi.reject(requestId)
      toast.success('Leave rejected')
      loadPending()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Rejection failed')
    }
  }

  const handleHrCancel = async (requestId: string, reason: string) => {
    try {
      await leaveApi.hrCancel(requestId, reason)
      toast.success('Approved leave cancelled')
      loadApproved()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'HR cancel failed'
      toast.error(msg)
      throw new Error(msg)
    }
  }

  const formatDuration = (req: LeaveRequest) => {
    switch (req.durationType) {
      case 'FULL_DAY':
        return `${req.durationValue} day${req.durationValue > 1 ? 's' : ''}`
      case 'HALF_DAY':
        return 'Half Day'
      case 'QUARTER_DAY':
        return 'Quarter Day'
      case 'HOURLY': {
        const h = Math.floor(req.durationValue)
        const m = Math.round((req.durationValue - h) * 60)
        const parts: string[] = []
        if (h > 0) parts.push(`${h}h`)
        if (m > 0) parts.push(`${m}m`)
        return parts.join(' ') || '0m'
      }
      default:
        return `${req.durationValue}`
    }
  }

  const requests = tab === 0 ? pending : approved

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 4 }}>
      <PageHeader
        title="Leave Approvals"
        subtitle="Review, approve, or reject employee leave requests and audit history"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Leave Approvals' },
        ]}
      />

      {/* Tabs + Content */}
      <Paper sx={{ borderRadius: '16px', overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            pt: 1,
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Pending
                {pending.length > 0 && (
                  <Chip
                    label={pending.length}
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                  />
                )}
              </Box>
            }
          />
          <Tab label="Approved" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <LoadingState message="Loading leave requests..." />
          ) : requests.length === 0 ? (
            <EmptyState
              title={
                tab === 0
                  ? 'No pending leave requests'
                  : 'No approved leave requests'
              }
              subtitle={tab === 0 ? 'All caught up!' : ''}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {requests.map((req) => (
                <Box
                  key={req.id}
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor:
                      tab === 0
                        ? alpha(theme.palette.warning.main, 0.2)
                        : alpha(theme.palette.success.main, 0.2),
                    bgcolor:
                      tab === 0
                        ? alpha(theme.palette.warning.main, 0.02)
                        : alpha(theme.palette.success.main, 0.02),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor:
                        tab === 0
                          ? alpha(theme.palette.warning.main, 0.04)
                          : alpha(theme.palette.success.main, 0.04),
                    },
                  }}
                >
                  {/* Left: Request Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="text.primary"
                      sx={{ mb: 0.3 }}
                    >
                      {req.employee.displayName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      {req.employee.designation.name}
                    </Typography>

                    <Typography variant="body2" fontWeight={600}>
                      {req.leaveType.name}{' '}
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        fontWeight={400}
                      >
                        ({req.leaveType.code})
                      </Typography>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {req.durationType === 'FULL_DAY'
                        ? req.fromDate.slice(0, 10) === req.toDate.slice(0, 10)
                          ? dayjs(req.fromDate).format('DD MMM YYYY')
                          : `${dayjs(req.fromDate).format('DD MMM')} - ${dayjs(req.toDate).format('DD MMM YYYY')}`
                        : dayjs(req.fromDate).format('DD MMM YYYY')}{' '}
                      &middot; {formatDuration(req)}
                    </Typography>

                    {req.reason && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
                      >
                        "{req.reason}"
                      </Typography>
                    )}
                  </Box>

                  {/* Right: Status + Actions */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 1.5,
                    }}
                  >
                    <Chip
                      label={req.status}
                      size="small"
                      color={
                        req.status === 'PENDING'
                          ? 'warning'
                          : req.status === 'APPROVED'
                            ? 'success'
                            : req.status === 'REJECTED'
                              ? 'error'
                              : 'default'
                      }
                      sx={{ fontWeight: 700 }}
                    />

                    {/* Pending: Approve + Reject */}
                    {req.status === 'PENDING' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                          onClick={() => handleApprove(req.id)}
                          sx={{ borderRadius: '8px' }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DoNotDisturbIcon sx={{ fontSize: 16 }} />}
                          onClick={() => handleReject(req.id)}
                          sx={{ borderRadius: '8px' }}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}

                    {/* Approved: HR Cancel */}
                    {req.status === 'APPROVED' && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setCancelTarget(req)}
                        sx={{ borderRadius: '8px' }}
                      >
                        Cancel Leave
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* HR Cancel Dialog */}
      <HrCancelDialog
        open={!!cancelTarget}
        request={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleHrCancel}
      />
    </Box>
  )
}

export default AdminLeaveApprovals
