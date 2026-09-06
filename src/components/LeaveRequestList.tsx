// src/components/LeaveRequestList.tsx
import React from "react"
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material"
import CancelIcon from "@mui/icons-material/Cancel"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import HourglassTopIcon from "@mui/icons-material/HourglassTop"
import PendingActionsIcon from "@mui/icons-material/PendingActions"
import dayjs from "dayjs"
import type { LeaveRequest } from "../types/leave.types"
import { formatLeaveDays } from "../utils/format.utils"

interface Props {
  requests: LeaveRequest[]
  loading: boolean
  onCancel?: (id: string) => void
}

const statusConfig: Record<
  string,
  {
    color: "warning" | "info" | "success" | "error" | "default"
    label: string
    icon?: React.ReactElement
  }
> = {
  PENDING: {
    color: "warning",
    label: "Pending Approval",
    icon: <HourglassTopIcon sx={{ "&&": { fontSize: 13 } }} />,
  },
  PENDING_MANAGER: {
    color: "warning",
    label: "Pending Manager Approval",
    icon: <HourglassTopIcon sx={{ "&&": { fontSize: 13 } }} />,
  },
  PENDING_HR: {
    color: "info",
    label: "Pending HR Approval",
    icon: <PendingActionsIcon sx={{ "&&": { fontSize: 13 } }} />,
  },
  APPROVED: {
    color: "success",
    label: "Approved",
    icon: <CheckCircleOutlineIcon sx={{ "&&": { fontSize: 13 } }} />,
  },
  REJECTED: {
    color: "error",
    label: "Rejected",
    icon: <CancelIcon sx={{ "&&": { fontSize: 13 } }} />,
  },
  CANCELLED: {
    color: "default",
    label: "Cancelled",
  },
}

const formatTimeLabel = (time: string) => {
  const parts = time.split(":")
  const h = parseInt(parts[0] ?? "0", 10)
  const m = parts[1] ?? "00"
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${ampm}`
}

const formatDuration = (req: LeaveRequest): string => {
  switch (req.durationType) {
    case "FULL_DAY": {
      const days = req.durationValue
      return `${formatLeaveDays(days)} day${days > 1 ? "s" : ""}`
    }
    case "HALF_DAY":
      return "Half Day"
    case "QUARTER_DAY":
      return "Quarter Day"
    case "HOURLY": {
      const hours = Math.floor(req.durationValue)
      const mins = Math.round((req.durationValue - hours) * 60)
      const parts: string[] = []
      if (hours > 0) parts.push(`${hours}h`)
      if (mins > 0) parts.push(`${mins}m`)
      return parts.join(" ") || "0m"
    }
    default:
      return formatLeaveDays(req.durationValue)
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
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No leave requests found
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {requests.map((req) => {
        const sc = statusConfig[req.status] ?? statusConfig.CANCELLED
        const timeRange = formatTimeRange(req)

        return (
          <Box
            key={req.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              borderRadius: "12px",
              bgcolor:
                req.status === "PENDING_MANAGER" || req.status === "PENDING"
                  ? alpha(theme.palette.warning.main, 0.04)
                  : req.status === "PENDING_HR"
                  ? alpha(theme.palette.info.main, 0.04)
                  : "transparent",
              border: "1px solid",
              borderColor: theme.palette.divider,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          >
            {/* Leave type badge */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: "10px",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
                fontWeight: 800,
                fontSize: "0.75rem",
                flexShrink: 0,
              }}
            >
              {req.leaveType.code}
            </Box>

            {/* Details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.3,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="body2" fontWeight={600} noWrap>
                  {req.leaveType.name}
                </Typography>
                <Chip
                  icon={sc.icon}
                  label={sc.label}
                  color={sc.color}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    "& .MuiChip-icon": {
                      ml: "4px",
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {req.durationType === "FULL_DAY"
                  ? req.fromDate.slice(0, 10) === req.toDate.slice(0, 10)
                    ? dayjs(req.fromDate).format("DD MMM YYYY")
                    : `${dayjs(req.fromDate).format("DD MMM")} – ${dayjs(req.toDate).format("DD MMM YYYY")}`
                  : dayjs(req.fromDate).format("DD MMM YYYY")}
                {" · "}
                {formatDuration(req)}
                {timeRange && ` · ${timeRange}`}
              </Typography>
              {req.reason && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    mt: 0.3,
                    fontStyle: "italic",
                  }}
                >
                  {req.reason}
                </Typography>
              )}
            </Box>

            {/* Cancel button */}
            {(req.status === "PENDING" || req.status === "PENDING_MANAGER" || req.status === "PENDING_HR") && onCancel && (
              <Tooltip title="Cancel request">
                <IconButton
                  size="small"
                  onClick={() => onCancel(req.id)}
                  sx={{
                    color: "error.main",
                    "&:hover": {
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
