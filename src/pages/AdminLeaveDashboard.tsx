// src/pages/AdminLeaveDashboard.tsx
import { formatLeaveDays } from '../utils/format.utils'
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  alpha,
  useTheme,
} from '@mui/material'
import BeachAccessIcon from '@mui/icons-material/BeachAccess'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb'
import CancelIcon from '@mui/icons-material/Cancel'
import RefreshIcon from '@mui/icons-material/Refresh'
import EventNoteIcon from '@mui/icons-material/EventNote'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

import { leaveApi } from '../api/leave.api'
import type {
  LeaveTodayEmployee,
  LeaveRequestWithEmployee,
  LeaveDurationType,
} from '../types/leave.types'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { AdminEmployeeLeaveProfileModal } from '../components/AdminEmployeeLeaveProfileModal'
import { useSocketSync } from '../context/SocketContext'
import { AdminLwpReportDialog } from '../components/AdminLwpReportDialog'
import { AdminLeaveDayBreakdownDialog } from '../components/AdminLeaveDayBreakdownDialog'
import EmployeeAutocomplete from '../components/EmployeeAutocomplete'
import { employeeApi } from '../api/employee.api'
import type { EmployeeListItem } from '../types/employee.types'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'

/* ─── HR-Cancel Dialog Component ─── */
interface HrCancelDialogProps {
  open: boolean
  request: LeaveRequestWithEmployee | null
  onClose: () => void
  onConfirm: (requestId: string, reason: string) => Promise<void>
}

const HrCancelDialog: React.FC<HrCancelDialogProps> = ({
  open,
  request,
  onClose,
  onConfirm,
}) => {
  const theme = useTheme()
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

      <DialogContent sx={{ pt: '24px !important', px: 3, pb: 2 }}>
        <Box sx={{ pt: 0.5 }}>
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
          placeholder="State the operational reason for cancelling this approved leave..."
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        {error && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: '10px',
              bgcolor: alpha(theme.palette.error.main, 0.06),
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.15),
            }}
          >
            <Typography variant="body2" color="error.dark" fontWeight={500}>
              {error}
            </Typography>
          </Box>
        )}
      </Box>
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

/* ─── Duration Formatter Helper ─── */
function formatDurationLabel(durationType: LeaveDurationType, durationValue?: number): string {
  switch (durationType) {
    case 'FULL_DAY':
      return durationValue && durationValue > 1 ? `${formatLeaveDays(durationValue)} Days` : 'Full Day'
    case 'HALF_DAY':
      return 'Half Day'
    case 'QUARTER_DAY':
      return 'Quarter Day'
    case 'HOURLY':
      return durationValue ? `${formatLeaveDays(durationValue)}h Leave` : 'Hourly'
    default:
      return durationType
  }
}

/* ─── MAIN COMPONENT: ADMIN LEAVE DASHBOARD ─── */
const AdminLeaveDashboard: React.FC = () => {
  const theme = useTheme()
  const [nudgingId, setNudgingId] = useState<string | null>(null)

  useSocketSync('leave', () => {
    handleGlobalRefresh()
  })
  useSocketSync('badges', () => {
    handleGlobalRefresh()
  })

  // Section A: On Leave Today
  const [todayLeaves, setTodayLeaves] = useState<LeaveTodayEmployee[]>([])
  const [todayLoading, setTodayLoading] = useState<boolean>(true)
  const [todayError, setTodayError] = useState<string | null>(null)

  // Section B: Pending Approvals
  const [pendingRequests, setPendingRequests] = useState<LeaveRequestWithEmployee[]>([])
  const [pendingLoading, setPendingLoading] = useState<boolean>(true)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<Record<string, 'approve' | 'reject'>>({})

  // Section C: Recently Approved (7 days)
  const [recentApproved, setRecentApproved] = useState<LeaveRequestWithEmployee[]>([])
  const [recentLoading, setRecentLoading] = useState<boolean>(true)
  const [recentError, setRecentError] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<LeaveRequestWithEmployee | null>(null)
  const [selectedRequestForBreakdown, setSelectedRequestForBreakdown] = useState<LeaveRequestWithEmployee | null>(null)

  // Section D: Employee-Centric Leave Management Search
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false)
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<EmployeeListItem | null>(null)
  const [lwpReportOpen, setLwpReportOpen] = useState<boolean>(false)

  // Global Refresh State
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  /* ─── Data Fetchers ─── */
  const fetchTodayLeaves = useCallback(async () => {
    setTodayLoading(true)
    setTodayError(null)
    try {
      const data = await leaveApi.getToday('company')
      setTodayLeaves(data.employees || [])
    } catch (err: any) {
      setTodayError(err?.response?.data?.message || 'Failed to load today’s leave data')
    } finally {
      setTodayLoading(false)
    }
  }, [])

  const fetchPendingRequests = useCallback(async () => {
    setPendingLoading(true)
    setPendingError(null)
    try {
      const data = await leaveApi.getPendingRequests()
      setPendingRequests(data || [])
    } catch (err: any) {
      setPendingError(err?.response?.data?.message || 'Failed to load pending leave requests')
    } finally {
      setPendingLoading(false)
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true)
    try {
      const data = await employeeApi.list()
      setEmployees(data || [])
    } catch (err) {
      console.error('Failed to load employees for leave management', err)
    } finally {
      setEmployeesLoading(false)
    }
  }, [])

  const fetchRecentApproved = useCallback(async () => {
    setRecentLoading(true)
    setRecentError(null)
    try {
      const data = await leaveApi.getRecentRequests('APPROVED', 7)
      setRecentApproved(data || [])
    } catch (err: any) {
      setRecentError(err?.response?.data?.message || 'Failed to load recently approved leaves')
    } finally {
      setRecentLoading(false)
    }
  }, [])

  // Initial Load (Independent via Promise.allSettled)
  useEffect(() => {
    fetchTodayLeaves()
    fetchPendingRequests()
    fetchRecentApproved()
    fetchEmployees()
  }, [fetchTodayLeaves, fetchPendingRequests, fetchRecentApproved, fetchEmployees])

  // Global Refresh Handler
  const handleGlobalRefresh = async () => {
    setIsRefreshing(true)
    await Promise.allSettled([
      fetchTodayLeaves(),
      fetchPendingRequests(),
      fetchRecentApproved(),
      fetchEmployees(),
    ])
    setIsRefreshing(false)
    toast.success('Leave dashboard refreshed')
  }

  /* ─── Actions: Approve / Reject / Nudge ─── */
  const handleNudgeManager = async (requestId: string) => {
    setNudgingId(requestId)
    try {
      const res = await leaveApi.nudgeManager(requestId)
      toast.success(res.message || 'Nudge notification sent to reporting manager')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send nudge')
    } finally {
      setNudgingId(null)
    }
  }
    const handleApprove = async (requestId: string) => {
    setActionInProgress((prev) => ({ ...prev, [requestId]: 'approve' }))
    try {
      await leaveApi.approve(requestId)
      toast.success('Leave request approved successfully')
      // Immediately remove from pending state
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
      // Reconcile recently approved and today's leaves
      fetchRecentApproved()
      fetchTodayLeaves()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve leave request')
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev }
        delete next[requestId]
        return next
      })
    }
  }

  const handleReject = async (requestId: string) => {
    setActionInProgress((prev) => ({ ...prev, [requestId]: 'reject' }))
    try {
      await leaveApi.reject(requestId)
      toast.success('Leave request rejected')
      // Immediately remove from pending state
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject leave request')
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev }
        delete next[requestId]
        return next
      })
    }
  }

  /* ─── Action: HR Cancel ─── */
  const handleHrCancelConfirm = async (requestId: string, reason: string) => {
    try {
      await leaveApi.hrCancel(requestId, reason)
      toast.success('Approved leave cancelled successfully')
      // Immediately remove from recently approved
      setRecentApproved((prev) => prev.filter((r) => r.id !== requestId))
      // Reconcile today's leaves if affected
      fetchTodayLeaves()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to cancel approved leave'
      toast.error(msg)
      throw new Error(msg)
    }
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', pb: 4 }}>
      <PageHeader
        title="Leave Dashboard"
        subtitle="Operational overview of employees on leave today, pending approvals, and recent actions"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Leave Dashboard' },
        ]}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={
              isRefreshing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon fontSize="small" />
              )
            }
            onClick={handleGlobalRefresh}
            disabled={isRefreshing}
            sx={{ borderRadius: '8px' }}
          >
            Refresh
          </Button>
        }
      />

      {/* ─────────────────────────────────────────────────────────────────────────
          SECTION 1: EMPLOYEE LEAVE MANAGEMENT (SEARCH & PROFILE)
         ───────────────────────────────────────────────────────────────────────── */}
      <Paper
        elevation={2}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: '16px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonSearchIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Employee Leave Management
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Search and select an employee to view leave balances, manage quota entitlements, inspect history, or review requests
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 650 }}>
          <EmployeeAutocomplete
            value={selectedEmployeeForModal?.id || ''}
            onChange={(_, emp) => {
              if (emp) {
                setSelectedEmployeeForModal(emp)
              }
            }}
            employees={employees}
            loading={employeesLoading}
            label="Search Employee Leave Profile"
            placeholder="Type name, #code (e.g. #101), email, designation, or team..."
          />
        </Box>
      </Paper>

      {/* ─── OPERATIONAL OVERVIEW SECTIONS ─── */}
      <Grid container spacing={3}>
        {/* ══════════════════════════════════════════════
            SECTION A: ON LEAVE TODAY
           ══════════════════════════════════════════════ */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              height: 520,
              maxHeight: 520,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Section Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: 'info.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BeachAccessIcon fontSize="small" />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  On Leave Today
                </Typography>
              </Box>
              <Chip
                label={todayLeaves.length}
                size="small"
                color={todayLeaves.length > 0 ? 'info' : 'default'}
                sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Section Body */}
            {todayLoading ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : todayError ? (
              <Alert
                severity="error"
                sx={{ borderRadius: '10px' }}
                action={
                  <Button color="inherit" size="small" onClick={fetchTodayLeaves}>
                    Retry
                  </Button>
                }
              >
                {todayError}
              </Alert>
            ) : todayLeaves.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <EmptyState
                  title="No Employees On Leave"
                  subtitle="Everyone scheduled for work today is expected to be present."
                />
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto', minHeight: 0, pr: 0.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.12), borderRadius: 3 } }}>
                {todayLeaves.map((emp) => (
                  <Paper
                    key={emp.employeeId}
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.info.main, 0.02),
                      borderColor: alpha(theme.palette.info.main, 0.15),
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {emp.displayName}
                      </Typography>
                      <Chip
                        label={emp.leaveType}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: 'info.dark',
                        }}
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      display="block"
                      sx={{ mb: 1 }}
                    >
                      {emp.designation}
                      {emp.team ? ` • ${emp.team}` : ''}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={formatDurationLabel(emp.durationType)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.625rem', fontWeight: 600 }}
                      />
                      {emp.startTime && emp.endTime && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <AccessTimeIcon sx={{ fontSize: 13 }} />
                          {emp.startTime} - {emp.endTime}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* ══════════════════════════════════════════════
            SECTION B: PENDING APPROVALS
           ══════════════════════════════════════════════ */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              height: 520,
              maxHeight: 520,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Section Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PendingActionsIcon fontSize="small" />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Pending Approvals
                </Typography>
              </Box>
              <Chip
                label={pendingRequests.length}
                size="small"
                color={pendingRequests.length > 0 ? 'warning' : 'default'}
                sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Section Body */}
            {pendingLoading ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : pendingError ? (
              <Alert
                severity="error"
                sx={{ borderRadius: '10px' }}
                action={
                  <Button color="inherit" size="small" onClick={fetchPendingRequests}>
                    Retry
                  </Button>
                }
              >
                {pendingError}
              </Alert>
            ) : pendingRequests.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <EmptyState
                  title="No Pending Approvals"
                  subtitle="All leave applications have been reviewed and processed."
                />
              </Box>
            ) : (
              <Stack spacing={2} sx={{ flex: 1, overflowY: 'auto', minHeight: 0, pr: 0.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.12), borderRadius: 3 } }}>
                {pendingRequests.map((req) => {
                  const isProcessing = Boolean(actionInProgress[req.id])
                  const isApproving = actionInProgress[req.id] === 'approve'
                  const isRejecting = actionInProgress[req.id] === 'reject'

                  return (
                    <Paper
                      key={req.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: alpha(theme.palette.warning.main, 0.02),
                        borderColor: alpha(theme.palette.warning.main, 0.2),
                      }}
                    >
                      {/* Top: Employee & Leave Type */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {req.employee.displayName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {req.employee.employeeCode
                              ? `#${req.employee.employeeCode} • `
                              : ''}
                            {req.employee.designation.name}
                            {req.employee.team ? ` • ${req.employee.team.name}` : ''}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {req.status === 'PENDING_MANAGER' && (
                            <Chip
                              label="Stage 1: Pending Manager"
                              size="small"
                              color="warning"
                              sx={{
                                height: 20,
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                              }}
                            />
                          )}
                          {req.status === 'PENDING_HR' && (
                            <Chip
                              label="Stage 2: Pending HR"
                              size="small"
                              color="info"
                              sx={{
                                height: 20,
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                              }}
                            />
                          )}
                          <Chip
                            label={req.leaveType.name}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              color: 'warning.dark',
                            }}
                          />
                        </Stack>
                      </Box>

                      {/* Middle: Dates & Duration */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mt: 1,
                          mb: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 600,
                            color: 'text.primary',
                          }}
                        >
                          <EventNoteIcon sx={{ fontSize: 14, color: 'action.active' }} />
                          {req.fromDate.slice(0, 10) === req.toDate.slice(0, 10)
                            ? dayjs(req.fromDate).format('DD MMM YYYY')
                            : `${dayjs(req.fromDate).format('DD MMM')} - ${dayjs(
                                req.toDate
                              ).format('DD MMM YYYY')}`}
                        </Typography>
                        <Chip
                          label={formatDurationLabel(req.durationType, req.durationValue)}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.625rem', fontWeight: 600 }}
                        />
                      </Box>

                      {/* Reason */}
                      {req.reason && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mb: 1.5,
                            fontStyle: 'italic',
                            bgcolor: 'action.hover',
                            p: 0.75,
                            borderRadius: '6px',
                          }}
                        >
                          "{req.reason}"
                        </Typography>
                      )}

                      {/* Actions: Nudge, Approve & Reject Buttons */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
                        {req.status === 'PENDING_MANAGER' && (
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            fullWidth
                            startIcon={
                              nudgingId === req.id ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <NotificationsActiveIcon sx={{ fontSize: 16 }} />
                              )
                            }
                            disabled={isProcessing || nudgingId === req.id}
                            onClick={() => handleNudgeManager(req.id)}
                            sx={{
                              borderRadius: '8px',
                              fontWeight: 700,
                              textTransform: 'none',
                              fontSize: '0.8125rem',
                              py: 0.75,
                              bgcolor: 'warning.main',
                              color: 'warning.contrastText',
                              boxShadow: '0 2px 6px rgba(237, 108, 2, 0.25)',
                              '&:hover': { bgcolor: 'warning.dark' },
                            }}
                          >
                            {nudgingId === req.id ? 'Sending Nudge...' : 'Nudge Reporting Manager'}
                          </Button>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            fullWidth
                            startIcon={
                              isApproving ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <CheckCircleIcon sx={{ fontSize: 16 }} />
                              )
                            }
                            disabled={isProcessing}
                            onClick={() => handleApprove(req.id)}
                            sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                          >
                            {isApproving ? 'Processing...' : req.status === 'PENDING_MANAGER' ? 'Approve (Override)' : 'Approve'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            fullWidth
                            startIcon={
                              isRejecting ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <DoNotDisturbIcon sx={{ fontSize: 16 }} />
                              )
                            }
                            disabled={isProcessing}
                            onClick={() => handleReject(req.id)}
                            sx={{ borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                          >
                            {isRejecting ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  )
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* ══════════════════════════════════════════════
            SECTION C: RECENTLY APPROVED (LAST 7 DAYS)
           ══════════════════════════════════════════════ */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              height: 520,
              maxHeight: 520,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Section Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Recently Approved
                </Typography>
              </Box>
              <Chip
                label={`${recentApproved.length} (7d)`}
                size="small"
                color={recentApproved.length > 0 ? 'success' : 'default'}
                sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Section Body */}
            {recentLoading ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : recentError ? (
              <Alert
                severity="error"
                sx={{ borderRadius: '10px' }}
                action={
                  <Button color="inherit" size="small" onClick={fetchRecentApproved}>
                    Retry
                  </Button>
                }
              >
                {recentError}
              </Alert>
            ) : recentApproved.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <EmptyState
                  title="No Recent Approvals"
                  subtitle="No leave requests were approved in the last 7 days."
                />
              </Box>
            ) : (
              <Stack spacing={1.75} sx={{ flex: 1, overflowY: 'auto', minHeight: 0, pr: 0.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.12), borderRadius: 3 } }}>
                {recentApproved.map((req) => (
                  <Paper
                    key={req.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.success.main, 0.02),
                      borderColor: alpha(theme.palette.success.main, 0.2),
                    }}
                  >
                    {/* Top: Employee & Status Badge */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {req.employee.displayName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          display="block"
                        >
                          {req.employee.employeeCode
                            ? `#${req.employee.employeeCode} • `
                            : ''}
                          {req.employee.designation.name}
                          {req.employee.team ? ` • ${req.employee.team.name}` : ''}
                        </Typography>
                      </Box>
                      <Chip
                        label={req.leaveType.name}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: 'success.dark',
                        }}
                      />
                    </Box>

                    {/* Middle: Dates & Duration */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 1,
                        mb: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontWeight: 600,
                          color: 'text.primary',
                        }}
                      >
                        <EventNoteIcon sx={{ fontSize: 14, color: 'action.active' }} />
                        {req.fromDate.slice(0, 10) === req.toDate.slice(0, 10)
                          ? dayjs(req.fromDate).format('DD MMM YYYY')
                          : `${dayjs(req.fromDate).format('DD MMM')} - ${dayjs(
                              req.toDate
                            ).format('DD MMM YYYY')}`}
                      </Typography>
                      <Chip
                        label={formatDurationLabel(req.durationType, req.durationValue)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.625rem', fontWeight: 600 }}
                      />
                    </Box>

                    {/* Approval Time & HR Cancel Button */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1.5,
                        pt: 1,
                        borderTop: '1px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {req.updatedAt
                          ? `Approved ${dayjs(req.updatedAt).fromNow()}`
                          : 'Approved'}
                      </Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon sx={{ fontSize: 15 }} />}
                        onClick={() => setCancelTarget(req)}
                        sx={{ borderRadius: '6px', fontSize: '0.75rem', py: 0.25 }}
                      >
                        Cancel Leave
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>



      {/* ─── HR Cancel Dialog ─── */}
      {/* LWP / Unpaid Leave Report Dialog */}
      <AdminLwpReportDialog
        open={lwpReportOpen}
        onClose={() => setLwpReportOpen(false)}
      />
      {/* Employee Leave Profile Modal */}
      {selectedEmployeeForModal && (
        <AdminEmployeeLeaveProfileModal
          open={Boolean(selectedEmployeeForModal)}
          employee={selectedEmployeeForModal}
          onClose={() => setSelectedEmployeeForModal(null)}
          onLeaveChanged={handleGlobalRefresh}
        />
      )}

      {/* Multi-Day Breakdown Dialog */}
      {selectedRequestForBreakdown && (
        <AdminLeaveDayBreakdownDialog
          open={Boolean(selectedRequestForBreakdown)}
          request={selectedRequestForBreakdown}
          employeeName={selectedRequestForBreakdown.employee?.displayName}
          onClose={() => setSelectedRequestForBreakdown(null)}
          onSuccess={handleGlobalRefresh}
        />
      )}

      <HrCancelDialog
        open={Boolean(cancelTarget)}
        request={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleHrCancelConfirm}
      />
    </Box>
  )
}

export default AdminLeaveDashboard
