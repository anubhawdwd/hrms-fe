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
  Checkbox,
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
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Delete Entire Request Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Delete Selected Days Confirmation State
  const [deleteSelectedDaysConfirmOpen, setDeleteSelectedDaysConfirmOpen] = useState(false)
  const [isDeletingDays, setIsDeletingDays] = useState(false)

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
      setSelectedDayIds([])
      setDeleteConfirmOpen(false)
      setIsDeleting(false)
      setDeleteSelectedDaysConfirmOpen(false)
      setIsDeletingDays(false)
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

  /* ---------------- Selection Handlers ---------------- */
  const handleToggleSelectDay = (dayId: string) => {
    setSelectedDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    )
  }

  const handleToggleSelectAll = () => {
    if (selectedDayIds.length === days.length) {
      setSelectedDayIds([])
    } else {
      setSelectedDayIds(days.map((d) => d.id))
    }
  }

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

  /* ---------------- Delete Selected Days ---------------- */
  const handleConfirmDeleteSelectedDays = async () => {
    if (selectedDayIds.length === 0) return
    setIsDeletingDays(true)
    try {
      const res: any = await leaveApi.deleteDays(request.id, selectedDayIds)
      if (res?.revertedDays && res.revertedDays > 0) {
        toast.success(`${selectedDayIds.length} day(s) deleted & ${res.revertedDays} day(s) restored to balance`)
      } else {
        toast.success(`${selectedDayIds.length} day(s) deleted successfully`)
      }
      setDeleteSelectedDaysConfirmOpen(false)
      if (res?.deletedRequestId || res?.remainingDaysCount === 0) {
        onSuccess?.(null)
        onClose()
      } else {
        onSuccess?.(res)
        onClose()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete selected days')
    } finally {
      setIsDeletingDays(false)
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
    setSelectedDayIds([])
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
        onClose={isSaving || isDeleting || isDeletingDays ? undefined : handleCancel}
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
                {request.leaveType?.name} · {durationStr} &middot;{' '}
                {dayjs(request.fromDate).format('DD MMM YYYY')}
                {request.fromDate.slice(0, 10) !== request.toDate.slice(0, 10) &&
                  ` - ${dayjs(request.toDate).format('DD MMM YYYY')}`}
              </Typography>
            </Box>
            <IconButton onClick={handleCancel} disabled={isSaving || isDeleting || isDeletingDays} size="small">
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

          {/* Day by Day Table Header Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Individual Day Breakdown & Actions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select specific rows to delete, or toggle individual day approval status
              </Typography>
            </Box>
            {selectedDayIds.length > 0 && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setDeleteSelectedDaysConfirmOpen(true)}
                disabled={isSaving || isDeleting || isDeletingDays}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Delete Selected Days ({selectedDayIds.length})
              </Button>
            )}
          </Box>

          {days.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 3, textAlign: 'center', borderRadius: '12px' }}
            >
              <Typography variant="body2" color="text.secondary">
                Single-day leave on {dayjs(request.fromDate).format('dddd, DD MMM YYYY')} (
                {request.durationType === 'FULL_DAY' ? 'Full Day' : request.durationType} · {request.leaveType?.name})
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
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        indeterminate={
                          selectedDayIds.length > 0 && selectedDayIds.length < days.length
                        }
                        checked={days.length > 0 && selectedDayIds.length === days.length}
                        onChange={handleToggleSelectAll}
                        disabled={isSaving || isDeleting || isDeletingDays}
                      />
                    </TableCell>
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
                    const isSelected = selectedDayIds.includes(day.id)

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
                        selected={isSelected}
                        sx={{
                          bgcolor: isSelected
                            ? alpha(theme.palette.error.main, 0.04)
                            : isSandwich
                            ? alpha(theme.palette.warning.main, 0.03)
                            : undefined,
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => handleToggleSelectDay(day.id)}
                            disabled={isSaving || isDeleting || isDeletingDays}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {isWeekend ? (
                              <WeekendIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            ) : (
                              <EventNoteIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {dayObj.format('dddd, DD MMM YYYY')}
                              </Typography>
                              {isWeekend && (
                                <Typography variant="caption" color="text.secondary">
                                  Weekend
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography variant="body2">{durationLabel}</Typography>
                            {isSandwich && (
                              <Chip
                                label="Sandwich"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                              />
                            )}
                            {day.deductDays === 0 ? (
                              <Chip
                                label="Non-Deductible"
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem', color: 'text.secondary' }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                ({day.deductDays} day deduct)
                              </Typography>
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
                              disabled={isSaving || isDeleting || isDeletingDays}
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
                              disabled={isSaving || isDeleting || isDeletingDays}
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
                disabled={isSaving || isDeleting || isDeletingDays}
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
              disabled={isSaving || isDeleting || isDeletingDays || pendingCount === 0}
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
              disabled={isSaving || isDeleting || isDeletingDays || pendingCount === 0}
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
              disabled={isSaving || isDeleting || isDeletingDays}
              sx={{ fontWeight: 600, borderRadius: '8px', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!hasUnsavedChanges || isSaving || isDeleting || isDeletingDays}
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

      {/* Delete Entire Request Confirmation Dialog */}
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

      {/* Delete Selected Days Confirmation Dialog */}
      <Dialog
        open={deleteSelectedDaysConfirmOpen}
        onClose={() => !isDeletingDays && setDeleteSelectedDaysConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Selected Days?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete <strong>{selectedDayIds.length}</strong> selected day(s) from this leave request?
            {request.leaveType?.isPaid && (
              <> If any of these days were already approved, their deducted days will be <strong>restored to the employee's balance</strong>.</>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteSelectedDaysConfirmOpen(false)}
            disabled={isDeletingDays}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteSelectedDays}
            disabled={isDeletingDays}
            variant="contained"
            color="error"
            startIcon={isDeletingDays ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ borderRadius: '8px' }}
          >
            {isDeletingDays ? 'Deleting Days...' : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AdminLeaveDayBreakdownDialog
