// src/components/ManagerTeamLeaveSection.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  alpha,
  useTheme,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import RefreshIcon from '@mui/icons-material/Refresh'
import BeachAccessIcon from '@mui/icons-material/BeachAccess'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import HistoryIcon from '@mui/icons-material/History'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import SearchIcon from '@mui/icons-material/Search'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

import { managerApi } from '../api/manager.api'
import { leaveApi } from '../api/leave.api'
import type { ReporteeSummary, ReporteeLeaveItem } from '../types/manager.types'
import type { LeaveRequestStatus } from '../types/leave.types'

function formatDateRange(fromDate: string, toDate: string): string {
  if (!fromDate || !toDate) return '—'
  const from = dayjs(fromDate)
  const to = dayjs(toDate)
  if (from.isSame(to, 'day')) {
    return from.format('DD MMM YYYY')
  }
  return `${from.format('DD MMM')} – ${to.format('DD MMM YYYY')}`
}

interface ManagerTeamLeaveSectionProps {
  reportees: ReporteeSummary[]
  onLeaveActionSuccess?: () => void
}

export const ManagerTeamLeaveSection: React.FC<ManagerTeamLeaveSectionProps> = ({
  reportees,
  onLeaveActionSuccess,
}) => {
  const theme = useTheme()
  const [allLeaves, setAllLeaves] = useState<ReporteeLeaveItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Action Dialog State
  const [dialogState, setDialogState] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    item: ReporteeLeaveItem | null
    submitting: boolean
    rejectionReason: string
  }>({
    open: false,
    type: 'approve',
    item: null,
    submitting: false,
    rejectionReason: '',
  })

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true)
      const data = await managerApi.getReporteeLeaves()
      setAllLeaves(data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch team leave requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  // Always derive pending approvals directly from allLeaves so top banner stays visible
  const pendingApprovals = useMemo(() => {
    return allLeaves.filter((l) => l.status === 'PENDING_MANAGER')
  }, [allLeaves])

  // Filter table rows in memory for instantaneous filtering
  const filteredLeaves = useMemo(() => {
    return allLeaves.filter((l) => {
      if (selectedStatus !== 'ALL' && l.status !== selectedStatus) {
        return false
      }
      if (selectedEmployeeId !== 'ALL' && l.employeeId !== selectedEmployeeId) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = l.employee.displayName.toLowerCase().includes(q)
        const typeMatch = l.leaveType.name.toLowerCase().includes(q)
        const reasonMatch = l.reason?.toLowerCase().includes(q) || false
        if (!nameMatch && !typeMatch && !reasonMatch) return false
      }
      return true
    })
  }, [allLeaves, selectedStatus, selectedEmployeeId, searchQuery])

  const handleOpenApproveDialog = (item: ReporteeLeaveItem) => {
    setDialogState({
      open: true,
      type: 'approve',
      item,
      submitting: false,
      rejectionReason: '',
    })
  }

  const handleOpenRejectDialog = (item: ReporteeLeaveItem) => {
    setDialogState({
      open: true,
      type: 'reject',
      item,
      submitting: false,
      rejectionReason: '',
    })
  }

  const handleConfirmAction = async () => {
    if (!dialogState.item) return
    try {
      setDialogState((prev) => ({ ...prev, submitting: true }))
      if (dialogState.type === 'approve') {
        await leaveApi.approve(dialogState.item.id)
        toast.success('Leave request approved (forwarded to HR for final sign-off)')
      } else {
        await leaveApi.reject(dialogState.item.id, dialogState.rejectionReason.trim() || undefined)
        toast.success('Leave request rejected')
      }
      setDialogState({
        open: false,
        type: 'approve',
        item: null,
        submitting: false,
        rejectionReason: '',
      })
      await fetchLeaves()
      onLeaveActionSuccess?.()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process action')
      setDialogState((prev) => ({ ...prev, submitting: false }))
    }
  }

  const renderStatusChip = (status: LeaveRequestStatus) => {
    switch (status) {
      case 'PENDING_MANAGER':
        return (
          <Chip
            icon={<HourglassTopIcon sx={{ '&&': { fontSize: 14, color: 'warning.dark' } }} />}
            label="Pending My Approval"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              color: 'warning.dark',
              fontWeight: 700,
              fontSize: '0.75rem',
              border: '1px solid',
              borderColor: alpha(theme.palette.warning.main, 0.3),
            }}
          />
        )
      case 'PENDING_HR':
        return (
          <Chip
            icon={<PendingActionsIcon sx={{ '&&': { fontSize: 14, color: 'info.main' } }} />}
            label="Pending HR Approval"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.12),
              color: 'info.dark',
              fontWeight: 700,
              fontSize: '0.75rem',
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.3),
            }}
          />
        )
      case 'APPROVED':
        return (
          <Chip
            icon={<CheckCircleOutlineIcon sx={{ '&&': { fontSize: 14, color: 'success.main' } }} />}
            label="Approved"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.success.main, 0.12),
              color: 'success.dark',
              fontWeight: 700,
              fontSize: '0.75rem',
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.3),
            }}
          />
        )
      case 'REJECTED':
        return (
          <Chip
            icon={<CancelIcon sx={{ '&&': { fontSize: 14, color: 'error.main' } }} />}
            label="Rejected"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.12),
              color: 'error.dark',
              fontWeight: 700,
              fontSize: '0.75rem',
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.3),
            }}
          />
        )
      default:
        return (
          <Chip
            label={status}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        )
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ─── PENDING MANAGER APPROVALS SECTION ─── */}
      {pendingApprovals.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            bgcolor: alpha(theme.palette.warning.main, 0.04),
            border: '1px solid',
            borderColor: alpha(theme.palette.warning.main, 0.25),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.warning.main, 0.15),
                  color: 'warning.dark',
                }}
              >
                <PendingActionsIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                  Pending Approvals Awaiting You ({pendingApprovals.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Review and approve or reject leave applications submitted by your reportees.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {pendingApprovals.map((req) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={req.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'background.paper',
                    borderColor: alpha(theme.palette.warning.main, 0.3),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.8125rem',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            fontWeight: 700,
                          }}
                        >
                          {req.employee.displayName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {req.employee.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                            {req.employee.designation?.name || 'Employee'}
                            {req.employee.department?.name ? ' • ' + req.employee.department.name : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={req.leaveType.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.6875rem', height: 22 }}
                      />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ my: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Dates:
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="text.primary">
                          {formatDateRange(req.fromDate, req.toDate)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Duration:
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="text.primary">
                          {req.durationValue} {req.durationValue === 1 ? 'day' : 'days'} ({req.durationType})
                        </Typography>
                      </Box>
                      {req.reason && (
                        <Box sx={{ mt: 0.5, p: 1, bgcolor: alpha(theme.palette.action.hover, 0.05), borderRadius: '8px' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                            "{req.reason}"
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon fontSize="small" />}
                      onClick={() => handleOpenApproveDialog(req)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                    >
                      Approve
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon fontSize="small" />}
                      onClick={() => handleOpenRejectDialog(req)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* ─── TEAM LEAVE HISTORY TABLE ─── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.8),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
              }}
            >
              <HistoryIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                Team Leave History
              </Typography>
              <Typography variant="caption" color="text.secondary">
                View all leave applications and approval statuses across your reportees
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
            <TextField
              size="small"
              placeholder="Search employee, type, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 200 }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PENDING_MANAGER">Pending My Approval</MenuItem>
                <MenuItem value="PENDING_HR">Pending HR</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Employee</InputLabel>
              <Select
                value={selectedEmployeeId}
                label="Employee"
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <MenuItem value="ALL">All Reportees ({reportees.length})</MenuItem>
                {reportees.map((rep) => (
                  <MenuItem key={rep.id} value={rep.id}>
                    {rep.displayName} {rep.isSecondaryManager ? '(Secondary)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Refresh">
              <IconButton onClick={fetchLeaves} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredLeaves.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <BeachAccessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              No leave requests found
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allLeaves.length > 0 ? 'No requests match the selected filters.' : 'Leave requests from your reportees will appear here.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.04) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>Leave Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>Dates</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem', textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeaves.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.8125rem',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            fontWeight: 700,
                          }}
                        >
                          {row.employee.displayName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {row.employee.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.employee.designation?.name || 'Employee'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.leaveType.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatDateRange(row.fromDate, row.toDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {row.durationValue} {row.durationValue === 1 ? 'day' : 'days'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.durationType}
                      </Typography>
                    </TableCell>
                    <TableCell>{renderStatusChip(row.status)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 220,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {row.reason || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      {row.status === 'PENDING_MANAGER' ? (
                        <Box sx={{ display: 'inline-flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleOpenApproveDialog(row)}
                            sx={{ minWidth: 70, fontSize: '0.75rem', textTransform: 'none', fontWeight: 700 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleOpenRejectDialog(row)}
                            sx={{ minWidth: 65, fontSize: '0.75rem', textTransform: 'none', fontWeight: 700 }}
                          >
                            Reject
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Completed
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ─── ACTION CONFIRMATION DIALOG ─── */}
      <Dialog
        open={dialogState.open}
        onClose={() => !dialogState.submitting && setDialogState((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {dialogState.type === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important', px: 3, pb: 2 }}>
          <Box sx={{ pt: 0.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {dialogState.type === 'approve'
                ? 'Are you sure you want to approve this leave request? In a 2-step workflow, this will advance the application to HR for final sign-off.'
                : 'Are you sure you want to reject this leave request? Please provide a reason below for the applicant.'}
            </Typography>

            {dialogState.item && (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha(theme.palette.action.hover, 0.04) }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {dialogState.item.employee.displayName} — {dialogState.item.leaveType.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateRange(dialogState.item.fromDate, dialogState.item.toDate)} ({dialogState.item.durationValue} days)
                </Typography>
              </Paper>
            )}

            {dialogState.type === 'reject' && (
              <TextField
                label="Rejection Reason (Optional)"
                placeholder="e.g. Critical project deadline conflict"
                fullWidth
                multiline
                rows={2}
                value={dialogState.rejectionReason}
                onChange={(e) => setDialogState((prev) => ({ ...prev, rejectionReason: e.target.value }))}
                size="small"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDialogState((prev) => ({ ...prev, open: false }))}
            disabled={dialogState.submitting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={dialogState.type === 'approve' ? 'success' : 'error'}
            onClick={handleConfirmAction}
            disabled={dialogState.submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {dialogState.submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : dialogState.type === 'approve' ? (
              'Confirm Approval'
            ) : (
              'Confirm Rejection'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManagerTeamLeaveSection
