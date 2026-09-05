// src/components/AdminEmployeeLeaveProfileModal.tsx
import { formatLeaveDays } from '../utils/format.utils'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Grid,
  Stack,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  LinearProgress,
  alpha,
  useTheme,
  DialogContentText,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import TuneIcon from '@mui/icons-material/Tune'
import PostAddIcon from '@mui/icons-material/PostAdd'
import EventNoteIcon from '@mui/icons-material/EventNote'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import RefreshIcon from '@mui/icons-material/Refresh'
import LayersIcon from '@mui/icons-material/Layers'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

import { leaveApi } from '../api/leave.api'
import type {
  LeaveBalance,
  LeaveRequest,
  LeaveType,
} from '../types/leave.types'
import type { EmployeeListItem } from '../types/employee.types'
import { AdminEditLeaveAllocationDialog } from './AdminEditLeaveAllocationDialog'
import { AdminMarkLeaveDialog } from './AdminMarkLeaveDialog'
import { AdminLeaveDayBreakdownDialog } from './AdminLeaveDayBreakdownDialog'

export interface AdminEmployeeLeaveProfileModalProps {
  open: boolean
  employee: EmployeeListItem | null
  onClose: () => void
  onLeaveChanged?: () => void
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

export const AdminEmployeeLeaveProfileModal: React.FC<
  AdminEmployeeLeaveProfileModalProps
> = ({ open, employee, onClose, onLeaveChanged }) => {
  const theme = useTheme()
  const currentYear = new Date().getFullYear()

  // State
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [companyLeaveTypes, setCompanyLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Filters for Leave History
  const [monthFilter, setMonthFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  // Sub-dialogs
  const [editAllocOpen, setEditAllocOpen] = useState<boolean>(false)
  const [markLeaveOpen, setMarkLeaveOpen] = useState<boolean>(false)
  const [breakdownRequest, setBreakdownRequest] = useState<LeaveRequest | null>(null)

  // Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false)
  const [requestToDelete, setRequestToDelete] = useState<LeaveRequest | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

  // Action in progress (approve/reject/delete)
  const [actionInProgress, setActionInProgress] = useState<Record<string, string>>({})

  /* ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    if (!employee?.id) return
    setLoading(true)
    try {
      const [bRes, rRes, tRes] = await Promise.all([
        leaveApi.getEmployeeBalances(employee.id, selectedYear),
        leaveApi.getEmployeeRequests(employee.id),
        leaveApi.getTypes(),
      ])
      setBalances(bRes || [])
      setRequests(rRes || [])
      setCompanyLeaveTypes(tRes || [])
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load employee leave details')
    } finally {
      setLoading(false)
    }
  }, [employee?.id, selectedYear])

  useEffect(() => {
    if (open && employee?.id) {
      fetchData()
    }
  }, [open, employee?.id, fetchData])

  /* ---------------- Zero-Entitlement Filtering ---------------- */
  const visibleBalances = useMemo(() => {
    return balances.filter(
      (b) =>
        b.allocated > 0 ||
        b.carriedForward > 0 ||
        b.used > 0 ||
        b.remaining > 0
    )
  }, [balances])

  /* ---------------- Available Months for Filter ---------------- */
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>()
    requests.forEach((r) => {
      if (r.fromDate) {
        monthSet.add(dayjs(r.fromDate).format('YYYY-MM'))
      }
    })
    for (let m = 1; m <= 12; m++) {
      const mStr = m < 10 ? '0' + m : '' + m
      monthSet.add(selectedYear + '-' + mStr)
    }
    return Array.from(monthSet).sort().reverse()
  }, [requests, selectedYear])

  /* ---------------- Filtered Requests ---------------- */
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (monthFilter !== 'ALL') {
        const reqMonth = dayjs(r.fromDate).format('YYYY-MM')
        if (reqMonth !== monthFilter) return false
      }
      if (statusFilter !== 'ALL') {
        if (r.status !== statusFilter) return false
      }
      if (typeFilter !== 'ALL') {
        if (r.leaveType?.code !== typeFilter) return false
      }
      return true
    })
  }, [requests, monthFilter, statusFilter, typeFilter])

  /* ---------------- Actions ---------------- */
  const handleApprove = async (requestId: string) => {
    setActionInProgress((prev) => ({ ...prev, [requestId]: 'approve' }))
    try {
      await leaveApi.approve(requestId)
      toast.success('Leave request approved')
      await fetchData()
      onLeaveChanged?.()
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
      await fetchData()
      onLeaveChanged?.()
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

  const promptDeleteRequest = (req: LeaveRequest) => {
    setRequestToDelete(req)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return
    setDeleting(true)
    try {
      const res = await leaveApi.deleteRequest(requestToDelete.id)
      if (res.revertedDays && res.revertedDays > 0) {
        toast.success('Leave deleted & ' + res.revertedDays + ' day(s) restored to balance')
      } else {
        toast.success('Leave request deleted successfully')
      }
      setDeleteConfirmOpen(false)
      setRequestToDelete(null)
      await fetchData()
      onLeaveChanged?.()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete leave request')
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenBreakdown = (req: LeaveRequest) => {
    setBreakdownRequest(req)
  }

  if (!employee) return null

  const initials = employee.displayName
    ? employee.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'E'

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Modal Header */}
        <DialogTitle
          sx={{
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 46,
                height: 46,
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: theme.shadows[2],
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight={700} noWrap>
                  {employee.displayName}
                </Typography>
                <Chip
                  label={'#' + employee.employeeCode}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, borderRadius: 1 }}
                />
                {!employee.isActive && (
                  <Chip
                    label="Inactive"
                    size="small"
                    color="default"
                    sx={{ height: 20, fontSize: '0.6875rem' }}
                  />
                )}
                {employee.isProbation && (
                  <Chip
                    label="Probation"
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600 }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {employee.designation?.name || 'Employee'}
                {employee.team?.name ? ' · ' + employee.team.name : ''}
                {employee.user?.email ? ' · ' + employee.user.email : ''}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{ borderRadius: '8px', fontSize: '0.8125rem', height: 32 }}
              >
                <MenuItem value={currentYear - 1}>{currentYear - 1}</MenuItem>
                <MenuItem value={currentYear}>{currentYear}</MenuItem>
                <MenuItem value={currentYear + 1}>{currentYear + 1}</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh data">
              <IconButton size="small" onClick={fetchData} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        {/* Modal Scrollable Content */}
        <DialogContent
          sx={{
            p: 3,
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* SECTION A: LEAVE BALANCES */}
          <Box sx={{ pt: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2.5,
                mt: 0.5,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventNoteIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Leave Entitlements & Balances ({selectedYear})
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<TuneIcon fontSize="small" />}
                  onClick={() => setEditAllocOpen(true)}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Grant / Edit Allocation
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<PostAddIcon fontSize="small" />}
                  onClick={() => setMarkLeaveOpen(true)}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Apply Leave (HR)
                </Button>
              </Stack>
            </Box>

            {loading ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : visibleBalances.length === 0 ? (
              <Box
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.info.main, 0.04),
                  border: '1px dashed',
                  borderColor: 'divider',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No active leave entitlements allocated for this employee in {selectedYear}. Click <strong>Grant / Edit Allocation</strong> to assign quota.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {visibleBalances.map((bal) => {
                  const total = bal.remaining + bal.used
                  const usedPct = total > 0 ? Math.min(100, (bal.used / total) * 100) : 0
                  const isLow = bal.remaining <= 0 || (total > 0 && bal.remaining / total < 0.2)

                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bal.id}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          border: '1px solid',
                          borderColor: isLow ? alpha(theme.palette.error.main, 0.25) : 'divider',
                          bgcolor: isLow
                            ? alpha(theme.palette.error.main, 0.02)
                            : alpha(theme.palette.primary.main, 0.02),
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            boxShadow: theme.shadows[1],
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {bal.leaveType?.name || 'Leave'}
                          </Typography>
                          <Chip
                            label={bal.leaveType?.code || 'LV'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                          <Typography
                            variant="h5"
                            fontWeight={800}
                            color={bal.remaining <= 0 ? 'error.main' : 'primary.main'}
                          >
                            {formatLeaveDays(bal.remaining)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            days available
                          </Typography>
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={usedPct}
                          color={isLow ? 'error' : 'primary'}
                          sx={{ height: 6, borderRadius: 3, mb: 1 }}
                        />

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                          }}
                        >
                          <span>Available: <strong>{formatLeaveDays(bal.remaining)}</strong></span>
                          <span>Used: <strong>{formatLeaveDays(bal.used)}</strong></span>
                        </Box>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            )}
          </Box>

          <Divider />

          {/* SECTION B: LEAVE HISTORY & MANAGEMENT */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Leave History & Request Management
                </Typography>
                <Chip
                  label={filteredRequests.length}
                  size="small"
                  color="default"
                  sx={{ height: 20, fontWeight: 700 }}
                />
              </Box>

              {/* Filters Bar */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {/* Month Filter */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="modal-month-filter-label">Month</InputLabel>
                  <Select
                    labelId="modal-month-filter-label"
                    value={monthFilter}
                    label="Month"
                    onChange={(e) => setMonthFilter(e.target.value)}
                    sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
                  >
                    <MenuItem value="ALL">All Months</MenuItem>
                    {availableMonths.map((m) => (
                      <MenuItem key={m} value={m}>
                        {dayjs(m + '-01').format('MMM YYYY')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Status Filter */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="modal-status-filter-label">Status</InputLabel>
                  <Select
                    labelId="modal-status-filter-label"
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
                  >
                    <MenuItem value="ALL">All Status</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>

                {/* Leave Type Filter */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="modal-type-filter-label">Leave Type</InputLabel>
                  <Select
                    labelId="modal-type-filter-label"
                    value={typeFilter}
                    label="Leave Type"
                    onChange={(e) => setTypeFilter(e.target.value)}
                    sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
                  >
                    <MenuItem value="ALL">All Types</MenuItem>
                    {companyLeaveTypes.map((t) => (
                      <MenuItem key={t.id} value={t.code}>
                        {t.name} ({t.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Request List Items */}
            {filteredRequests.length === 0 ? (
              <Box
                sx={{
                  py: 5,
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No leave requests matching the selected filters.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {filteredRequests.map((req) => {
                  const sc = statusConfig[req.status] || statusConfig.CANCELLED
                  const hasSandwich = req.days?.some((d) => d.isSandwichDay) || false
                  const isMultiDay = req.days && req.days.length > 1
                  const isOperating = Boolean(actionInProgress[req.id])

                  // Duration text
                  const fromStr = dayjs(req.fromDate).format('DD MMM YYYY')
                  const toStr = dayjs(req.toDate).format('DD MMM YYYY')
                  const dateRangeText =
                    req.fromDate.slice(0, 10) === req.toDate.slice(0, 10)
                      ? fromStr
                      : dayjs(req.fromDate).format('DD MMM') + ' – ' + toStr

                  const durationLabel =
                    req.durationType === 'FULL_DAY'
                      ? formatLeaveDays(req.durationValue) + ' Day' + (req.durationValue > 1 ? 's' : '')
                      : req.durationType === 'HALF_DAY'
                      ? 'Half Day'
                      : req.durationType === 'QUARTER_DAY'
                      ? 'Quarter Day'
                      : formatLeaveDays(req.durationValue) + 'h (Hourly)'

                  return (
                    <Box
                      key={req.id}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor:
                          req.status === 'PENDING'
                            ? alpha(theme.palette.warning.main, 0.3)
                            : 'divider',
                        bgcolor:
                          req.status === 'PENDING'
                            ? alpha(theme.palette.warning.main, 0.02)
                            : 'background.paper',
                        transition: 'all 0.15s',
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          boxShadow: theme.shadows[1],
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* Request Title & Details */}
                        <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: '10px',
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main',
                              fontWeight: 800,
                              fontSize: '0.8125rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {req.leaveType?.code || 'LV'}
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                              <Typography variant="body2" fontWeight={700}>
                                {req.leaveType?.name || 'Leave Request'}
                              </Typography>
                              <Chip
                                label={sc.label}
                                color={sc.color}
                                size="small"
                                sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600 }}
                              />
                              {hasSandwich && (
                                <Chip
                                  label="SANDWICH LEAVE"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6875rem',
                                    fontWeight: 800,
                                    bgcolor: alpha(theme.palette.warning.main, 0.15),
                                    color: theme.palette.warning.dark,
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.warning.main, 0.3),
                                  }}
                                />
                              )}
                            </Box>

                            <Typography variant="caption" color="text.secondary" display="block">
                              <strong>{dateRangeText}</strong> &middot; {durationLabel}
                              {req.startTime && req.endTime && (' (' + req.startTime + ' – ' + req.endTime + ')')}
                            </Typography>

                            {req.reason && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  fontStyle: 'italic',
                                  bgcolor: alpha(theme.palette.grey[500], 0.05),
                                  px: 1,
                                  py: 0.3,
                                  borderRadius: '6px',
                                }}
                              >
                                {req.reason}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={1} alignItems="center">
                          {/* Multi-day Breakdown Trigger */}
                          {isMultiDay && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              startIcon={<LayersIcon fontSize="small" />}
                              onClick={() => handleOpenBreakdown(req)}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                px: 1.5,
                              }}
                            >
                              Day Breakdown
                            </Button>
                          )}

                          {/* Pending Actions */}
                          {req.status === 'PENDING' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon fontSize="small" />}
                                onClick={() => handleApprove(req.id)}
                                disabled={isOperating}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon fontSize="small" />}
                                onClick={() => handleReject(req.id)}
                                disabled={isOperating}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {/* Delete Request (Any Status) */}
                          <Tooltip title="Delete Leave Record">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => promptDeleteRequest(req)}
                              disabled={isOperating}
                              sx={{
                                border: '1px solid',
                                borderColor: alpha(theme.palette.error.main, 0.2),
                                borderRadius: '8px',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.error.main, 0.08),
                                },
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Box>
        </DialogContent>

        {/* Modal Footer */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '8px', px: 3 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUB-MODAL 1: Grant / Edit Allocation */}
      {editAllocOpen && employee && (
        <AdminEditLeaveAllocationDialog
          open={editAllocOpen}
          employee={{
            id: employee.id,
            displayName: employee.displayName,
            employeeCode: employee.employeeCode,
          }}
          allLeaveTypes={companyLeaveTypes}
          currentBalances={balances}
          onClose={() => setEditAllocOpen(false)}
          onSuccess={() => {
            fetchData()
            onLeaveChanged?.()
          }}
        />
      )}

      {/* SUB-MODAL 2: Apply / Mark Leave */}
      {markLeaveOpen && employee && (
        <AdminMarkLeaveDialog
          open={markLeaveOpen}
          employee={{
            id: employee.id,
            displayName: employee.displayName,
            employeeCode: employee.employeeCode,
          }}
          leaveTypes={companyLeaveTypes}
          leaveBalances={balances}
          onClose={() => setMarkLeaveOpen(false)}
          onSuccess={() => {
            fetchData()
            onLeaveChanged?.()
          }}
        />
      )}

      {/* SUB-MODAL 3: Day Breakdown Dialog */}
      {breakdownRequest && (
        <AdminLeaveDayBreakdownDialog
          open={Boolean(breakdownRequest)}
          request={breakdownRequest}
          employeeName={employee.displayName}
          onClose={() => setBreakdownRequest(null)}
          onSuccess={() => {
            fetchData()
            onLeaveChanged?.()
          }}
        />
      )}

      {/* SUB-MODAL 4: Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Leave Request?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {requestToDelete?.status === 'APPROVED' ? (
              <>
                This leave request is currently <strong>APPROVED</strong>. Deleting this request will permanently remove the record and <strong>restore the exact deducted balance</strong> to the employee.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete this leave request? This action cannot be undone.
              </>
            )}
          </DialogContentText>
          {requestToDelete && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: '8px',
                bgcolor: alpha(theme.palette.error.main, 0.05),
                border: '1px solid',
                borderColor: alpha(theme.palette.error.main, 0.15),
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {requestToDelete.leaveType?.name} ({formatLeaveDays(requestToDelete.durationValue)} day(s))
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(requestToDelete.fromDate).format('DD MMM YYYY')}
                {requestToDelete.fromDate.slice(0, 10) !== requestToDelete.toDate.slice(0, 10) &&
                  (' – ' + dayjs(requestToDelete.toDate).format('DD MMM YYYY'))}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={deleting}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ borderRadius: '8px' }}
          >
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AdminEmployeeLeaveProfileModal
