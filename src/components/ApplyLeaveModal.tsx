// src/components/ApplyLeaveModal.tsx
import { formatLeaveDays } from "../utils/format.utils"
import React, { useState, useMemo } from "react"
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
  alpha,
  useTheme,
  Divider,
  Chip,
  Alert,
} from "@mui/material"
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
import CelebrationIcon from "@mui/icons-material/Celebration"
import { useLeaveTypes, useLeaveBalances, useHolidays } from "../hooks/useLeave"
import { leaveApi } from "../api/leave.api"
import type { ApplyLeaveRequest } from "../types/leave.types"
import dayjs from "dayjs"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const ApplyLeaveModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const theme = useTheme()
  const currentYear = new Date().getFullYear()
  const { types, loading: typesLoading } = useLeaveTypes()
  const { balances } = useLeaveBalances(currentYear)
  const { holidays } = useHolidays()

  // Filter available leave types:
  // 1. Unpaid Leave / LWP is ALWAYS available (requires no allocation, balance > 0 not required)
  // 2. Paid leaves must have available entitlement (remaining > 0)
  const availableLeaveTypes = useMemo(() => {
    return types.filter((t) => {
      if (t.isActive === false) return false
      if (t.isPaid === false || t.code === "LWP") return true

      const b = balances.find(
        (bal) =>
          bal.leaveTypeId === t.id ||
          bal.leaveType?.name === t.name ||
          bal.leaveType?.code === t.code
      )
      return b && b.remaining > 0
    })
  }, [types, balances])

  const [leaveTypeId, setLeaveTypeId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Detect overlapping holidays in selected range
  const holidayOverlap = useMemo(() => {
    if (!fromDate || !toDate) return { normal: [], restricted: [] }
    const start = dayjs(fromDate)
    const end = dayjs(toDate)
    if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
      return { normal: [], restricted: [] }
    }

    const normal: { name: string; date: string }[] = []
    const restricted: { name: string; date: string }[] = []

    for (const h of holidays) {
      const hDate = dayjs(h.date)
      if ((hDate.isSame(start, "day") || hDate.isAfter(start, "day")) && (hDate.isSame(end, "day") || hDate.isBefore(end, "day"))) {
        const formattedDate = hDate.format("DD MMM YYYY")
        if (h.type === "RESTRICTED") {
          restricted.push({ name: h.name, date: formattedDate })
        } else {
          normal.push({ name: h.name, date: formattedDate })
        }
      }
    }

    return { normal, restricted }
  }, [fromDate, toDate, holidays])

  // Duration calculation helper
  const durationSummary = useMemo(() => {
    if (!fromDate || !toDate) return null
    const start = new Date(fromDate)
    const end = new Date(toDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null

    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return `${diff} full day${diff > 1 ? "s" : ""}`
  }, [fromDate, toDate])

  const resetForm = () => {
    setLeaveTypeId("")
    setFromDate("")
    setToDate("")
    setReason("")
    setError(null)
  }

  const handleSubmit = async () => {
    setError(null)

    if (!leaveTypeId) {
      setError("Please select a leave type")
      return
    }
    if (!fromDate) {
      setError("Please select a start date")
      return
    }
    if (!toDate) {
      setError("Please select an end date")
      return
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("End date must be on or after start date")
      return
    }
    if (holidayOverlap.normal.length > 0) {
      setError(`Cannot apply leave on official company holiday (${holidayOverlap.normal.map((n) => `${n.name} on ${n.date}`).join(", ")}).`)
      return
    }

    setSubmitting(true)

    try {
      const payload: ApplyLeaveRequest = {
        leaveTypeId,
        fromDate,
        toDate,
        durationType: "FULL_DAY",
      }

      if (reason.trim()) {
        payload.reason = reason.trim()
      }

      await leaveApi.apply(payload)
      resetForm()
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to apply leave")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", overflow: "hidden" },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          pb: 1,
          pt: 3,
          px: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "12px",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: "primary.main",
          }}
        >
          <CalendarMonthIcon />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Apply Leave
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select leave type and full-day dates for your request
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Leave Type Selector */}
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
              "& .MuiOutlinedInput-root": { borderRadius: "10px" },
            }}
          >
            {availableLeaveTypes.map((t) => {
              const isUnpaid = t.isPaid === false || t.code === "LWP"
              const b = balances.find(
                (bal) =>
                  bal.leaveTypeId === t.id ||
                  bal.leaveType?.name === t.name ||
                  bal.leaveType?.code === t.code
              )

              return (
                <MenuItem key={t.id} value={t.id}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>{t.name}</span>
                    {isUnpaid ? (
                      <Chip
                        label="Unpaid (LWP)"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 600 }}
                      />
                    ) : b ? (
                      <Chip
                        label={`${formatLeaveDays(b.remaining)} days available`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 600 }}
                      />
                    ) : null}
                  </Box>
                </MenuItem>
              )
            })}
          </TextField>

          {/* Full Day: From Date -> To Date */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <DatePicker
              label="From Date"
              value={fromDate ? dayjs(fromDate) : null}
              onChange={(newValue) => {
                const valStr = newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : ""
                setFromDate(valStr)
                if (valStr && (!toDate || dayjs(valStr).isAfter(dayjs(toDate)))) {
                  setToDate(valStr)
                }
                setError(null)
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  sx: { "& .MuiOutlinedInput-root": { borderRadius: "10px" } },
                },
              }}
            />
            <DatePicker
              label="To Date"
              value={toDate ? dayjs(toDate) : null}
              minDate={fromDate ? dayjs(fromDate) : undefined}
              onChange={(newValue) => {
                const valStr = newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : ""
                setToDate(valStr)
                setError(null)
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  sx: { "& .MuiOutlinedInput-root": { borderRadius: "10px" } },
                },
              }}
            />
          </Box>

          {/* Holiday Overlay Notices */}
          {holidayOverlap.normal.length > 0 && (
            <Alert severity="error" sx={{ borderRadius: "10px", py: 0.5 }}>
              Selected range includes official company holiday: <strong>{holidayOverlap.normal.map((n) => `${n.name} (${n.date})`).join(", ")}</strong>. Leave cannot be applied on official holidays.
            </Alert>
          )}

          {holidayOverlap.restricted.length > 0 && (
            <Alert
              icon={<CelebrationIcon fontSize="inherit" color="warning" />}
              severity="info"
              sx={{
                borderRadius: "10px",
                py: 0.5,
                bgcolor: alpha(theme.palette.warning.main, 0.08),
                color: theme.palette.warning.dark,
                border: "1px solid",
                borderColor: alpha(theme.palette.warning.main, 0.2),
              }}
            >
              Includes restricted holiday: <strong>{holidayOverlap.restricted.map((r) => `${r.name} (Restricted) on ${r.date}`).join(", ")}</strong>. This is an optional holiday — your leave request will be applied normally.
            </Alert>
          )}

          {/* Duration Summary Badge */}
          {durationSummary && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: "10px",
                bgcolor: alpha(theme.palette.info.main, 0.08),
                border: "1px solid",
                borderColor: alpha(theme.palette.info.main, 0.2),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="caption" fontWeight={600} color="info.main">
                Requested Duration:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="info.dark">
                {durationSummary}
              </Typography>
            </Box>
          )}

          {/* Reason */}
          <TextField
            label="Reason (Optional)"
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a brief reason for your leave request..."
            fullWidth
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: "10px" },
            }}
          />

          {/* Error message */}
          {error && (
            <Typography
              variant="caption"
              color="error"
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.08),
                p: 1.5,
                borderRadius: "8px",
                border: "1px solid",
                borderColor: alpha(theme.palette.error.main, 0.2),
              }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          color="inherit"
          disabled={submitting}
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || holidayOverlap.normal.length > 0}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            minWidth: 120,
          }}
        >
          {submitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Submit Request"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ApplyLeaveModal
