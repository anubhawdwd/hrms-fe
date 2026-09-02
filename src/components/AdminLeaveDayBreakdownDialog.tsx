// src/components/AdminLeaveDayBreakdownDialog.tsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Stack,
  CircularProgress,
  IconButton,
  DialogContentText,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import SaveIcon from '@mui/icons-material/Save'
import EventNoteIcon from '@mui/icons-material/EventNote'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import WeekendIcon from '@mui/icons-material/Weekend'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { leaveApi } from '../api/leave.api'
import type { LeaveRequest, LeaveRequestDay, LeaveRequestStatus } from '../types/leave.types'

interface AdminLeaveDayBreakdownDialogProps {
  open: boolean
  onClose: () => void
  request: LeaveRequest | null
  employeeName?: string
  onSuccess?: (updatedRequest?: LeaveRequest | null) => void
}

export const AdminLeaveDayBreakdownDialog: React.FC<AdminLeaveDayBreakdownDialogProps> = ({
  open,
  onClose,
  request,
  employeeName,
  onSuccess,
}) => {
  const theme = useTheme()
  const [draftDaysStatus, setDraftDaysStatus] = useState<Record<string, LeaveRequestStatus>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Delete Request Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Initialize/reset draft state whenever dialog opens or request changes
  useEffect(() => {
    if (request && open) {
      const initial: Record<string, LeaveRequestStatus> = {}
      if (request.days) {
        request.days.forEach((day) => {
          initial[day.id] = day.status
        })
      }
      setDraftDaysStatus(initial)
      setDeleteConfirmOpen(false)
      setIsDeleting(false)
    }
  }, [request, open])

  const days: LeaveRequestDay[] = useMemo(() => {
    if (!request?.days) return []
    return [...request.days].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [request?.days])

  // Compare draft status vs persisted status to find pending unsaved edits
  const hasUnsavedChanges = useMemo(() => {
    if (!request?.days) return false
    return request.days.some((day) => {
      const draft = draftDaysStatus[day.id]
      return draft !== undefined && draft !== day.status
    })
  }, [request?.days, draftDaysStatus])

  // Count pending days in draft state
  const pendingCount = useMemo(() => {
    return days.filter(
      (day) => (draftDaysStatus[day.id] ?? day.status) === 'PENDING'
    ).length
  }, [days, draftDaysStatus])

  if (!request) return null

  /* ---------------- Day Actions (Local Draft) ---------------- */
  const handleSetDayDraft = (dayId: string, status: LeaveRequestStatus) => {
    setDraftDaysStatus((prev) => ({
      ...prev,
      [dayId]: status,
    }))
  }

  // Selective bulk operation on draft PENDING days
  const handleApproveRemaining = () => {
    setDraftDaysStatus((prev) => {
      const next = { ...prev }
      days.forEach((day) => {
        if ((next[day.id] ?? day.status) === 'PENDING') {
          next[day.id] = 'APPROVED'
        }
      })
      return next
    })
    toast.success('Marked remaining pending days as Approved in draft')
  }

  const handleRejectRemaining = () => {
    setDraftDaysStatus((prev) => {
      const next = { ...prev }
      days.forEach((day) => {
        if ((next[day.id] ?? day.status) === 'PENDING') {
          next[day.id] = 'REJECTED'
        }
      })
      return next
    })
    toast.success('Marked remaining pending days as Rejected in draft')
  }

  /* ---------------- Persist Changes to Backend ---------------- */
  const handleSaveChanges = async () => {
    setIsSaving(true)
    let latestRequest: LeaveRequest | null = null

    try {
      // Find modified days
      const modifiedDays = days.filter((day) => {
        const draft = draftDaysStatus[day.id]
        return (
          draft !== undefined &&
          draft !== day.status &&
          (draft === 'APPROVED' || draft === 'REJECTED')
        )
      })

      // Execute sequential API calls for changed days
      for (const day of modifiedDays) {
        const targetStatus = draftDaysStatus[day.id] as 'APPROVED' | 'REJECTED'
        latestRequest = await leaveApi.updateDayStatus(
          request.id,
          day.id,
          targetStatus
        )
      }

      toast.success('All day breakdown changes saved successfully')
      onSuccess?.(latestRequest || request)
      onClose()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Failed to save some day breakdown updates'
      )
      if (latestRequest) {
        onSuccess?.(latestRequest)
      }
    } finally {
      setIsSaving(false)
    }
  }

  /* ---------------- Delete Entire Leave Request ---------------- */
  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await leaveApi.deleteRequest(request.id)
      if (res.revertedDays && res.revertedDays > 0) {
        toast.success(`Leave request deleted & ${res.revertedDays} day(s) restored to balance`)
      } else {
        toast.success('Leave request deleted successfully')
      }
      setDeleteConfirmOpen(false)
      onSuccess?.(null)
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete leave request')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    const reset: Record<string, LeaveRequestStatus> = {}
    if (request.days) {
      request.days.forEach((day) => {
        reset[day.id] = day.status
      })
    }
    setDraftDaysStatus(reset)
    onClose()
  }

  const durationStr =
    request.durationType === 'FULL_DAY'
      ? `${request.durationValue} Day${request.durationValue > 1 ? 's' : ''}`
      : request.durationType === 'HALF_DAY'
      ? 'Half Day'
      : request.durationType === 'QUARTER_DAY'
      ? 'Quarter Day'
      : `${request.durationValue}h (Hourly)`

  return (
    <>
      <Dialog
        open={open}
        onClose={isSaving || isDeleting ? undefined : handleCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ pt: 2.5, pb: 1.5, px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Day-by-Day Leave Breakdown
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {employeeName ? `${employeeName} · ` : ''}
                {request.leaveType.name} · {durationStr} &middot;{' '}
                {dayjs(request.fromDate).format('DD MMM YYYY')}
                {request.fromDate.slice(0, 10) !== request.toDate.slice(0, 10) &&
                  ` - ${dayjs(request.toDate).format('DD MMM YYYY')}`}
              </Typography>
            </Box>
            <IconButton onClick={handleCancel} disabled={isSaving || isDeleting} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Reason if available */}
          {request.reason && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                mb: 2.5,
                borderRadius: '10px',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">
                Reason / Notes:
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25 }}>
                {request.reason}
              </Typography>
            </Paper>
          )}

          {/* Day by Day Table */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Individual Day Breakdown & Day-Level Actions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Review and selectively approve/reject each day before saving
            </Typography>
          </Box>

          {days.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 3, textAlign: 'center', borderRadius: '12px' }}
            >
              <Typography variant="body2" color="text.secondary">
                Single-day leave on {dayjs(request.fromDate).format('dddd, DD MMM YYYY')} (
                {request.durationType === 'FULL_DAY' ? 'Full Day' : request.durationType} · {request.leaveType.name})
              </Typography>
            </Paper>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: '12px', overflow: 'hidden' }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date + Day</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Schedule · Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Day Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {days.map((day) => {
                    const currentDraftStatus = draftDaysStatus[day.id] ?? day.status
                    const isApproved = currentDraftStatus === 'APPROVED'
                    const isRejected = currentDraftStatus === 'REJECTED'

                    const dayObj = dayjs(day.date)
                    const dayOfWeek = dayObj.day() // 0 = Sunday, 6 = Saturday
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                    const isSandwich = Boolean(day.isSandwichDay)

                    const durationLabel =
                      request.durationType === 'FULL_DAY'
                        ? 'Full Day'
                        : request.durationType === 'HALF_DAY'
                        ? 'Half Day'
                        : request.durationType === 'QUARTER_DAY'
                        ? 'Quarter Day'
                        : `${request.durationValue}h`

                    return (
                      <TableRow
                        key={day.id}
                        hover
                        sx={{
                          bgcolor: isSandwich
                            ? alpha(theme.palette.warning.main, 0.05)
                            : isWeekend
                            ? alpha(theme.palette.grey[500], 0.04)
                            : 'inherit',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isWeekend ? (
                              <WeekendIcon
                                sx={{
                                  fontSize: 16,
                                  color: isSandwich ? 'warning.main' : 'text.secondary',
                                }}
                              />
                            ) : (
                              <EventNoteIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            )}
                            <span>{dayObj.format('dddd, DD MMM YYYY')}</span>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {durationLabel} · {request.leaveType.name}
                            </Typography>
                            {isSandwich && (
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
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={currentDraftStatus}
                            size="small"
                            color={
                              isApproved
                                ? 'success'
                                : isRejected
                                ? 'error'
                                : 'warning'
                            }
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                            alignItems="center"
                          >
                            <Button
                              size="small"
                              variant={isApproved ? 'contained' : 'outlined'}
                              color="success"
                              disabled={isSaving || isDeleting}
                              onClick={() => handleSetDayDraft(day.id, 'APPROVED')}
                              startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.4,
                                px: 1.2,
                                borderRadius: '6px',
                                fontWeight: 600,
                                textTransform: 'none',
                              }}
                            >
                              {isApproved ? 'Approved' : 'Approve'}
                            </Button>
                            <Button
                              size="small"
                              variant={isRejected ? 'contained' : 'outlined'}
                              color="error"
                              disabled={isSaving || isDeleting}
                              onClick={() => handleSetDayDraft(day.id, 'REJECTED')}
                              startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.4,
                                px: 1.2,
                                borderRadius: '6px',
                                fontWeight: 600,
                                textTransform: 'none',
                              }}
                            >
                              {isRejected ? 'Rejected' : 'Reject'}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          {/* Left Side: Delete Entire Request & Bulk Actions */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip title="Delete this entire leave request">
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={isSaving || isDeleting}
                onClick={() => setDeleteConfirmOpen(true)}
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                sx={{ fontWeight: 600, borderRadius: '8px', textTransform: 'none' }}
              >
                Delete Request
              </Button>
            </Tooltip>

            <Button
              variant="outlined"
              color="error"
              size="small"
              disabled={isSaving || isDeleting || pendingCount === 0}
              onClick={handleRejectRemaining}
              startIcon={<CancelIcon fontSize="small" />}
              sx={{ fontWeight: 600, borderRadius: '8px', textTransform: 'none' }}
            >
              Reject Remaining ({pendingCount})
            </Button>
            <Button
              variant="outlined"
              color="success"
              size="small"
              disabled={isSaving || isDeleting || pendingCount === 0}
              onClick={handleApproveRemaining}
              startIcon={<CheckCircleIcon fontSize="small" />}
              sx={{ fontWeight: 600, borderRadius: '8px', textTransform: 'none' }}
            >
              Approve Remaining ({pendingCount})
            </Button>
          </Box>

          {/* Right Side: Cancel / Save Changes */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleCancel}
              variant="outlined"
              color="inherit"
              size="small"
              disabled={isSaving || isDeleting}
              sx={{ fontWeight: 600, borderRadius: '8px', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!hasUnsavedChanges || isSaving || isDeleting}
              onClick={handleSaveChanges}
              startIcon={
                isSaving ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <SaveIcon fontSize="small" />
                )
              }
              sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'none' }}
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Leave Request?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {request.status === 'APPROVED' ? (
              <>
                This entire leave request is currently <strong>APPROVED</strong>. Deleting this request will permanently remove the record and <strong>restore the actual deducted days</strong> to the employee's leave balance (if paid leave).
              </>
            ) : (
              <>
                Are you sure you want to permanently delete this leave request? No balance deduction has occurred for this pending request.
              </>
            )}
          </DialogContentText>
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
              {request.leaveType?.name} ({durationStr})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayjs(request.fromDate).format('DD MMM YYYY')}
              {request.fromDate.slice(0, 10) !== request.toDate.slice(0, 10) &&
                ` – ${dayjs(request.toDate).format('DD MMM YYYY')}`}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={isDeleting}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            variant="contained"
            color="error"
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ borderRadius: '8px' }}
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AdminLeaveDayBreakdownDialog
