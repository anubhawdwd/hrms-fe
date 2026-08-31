// src/pages/AdminAttendanceDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  Popover,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TodayIcon from '@mui/icons-material/Today'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useNavigate } from 'react-router-dom'

import { attendanceApi } from '../api/attendance.api'
import { leaveApi } from '../api/leave.api'
import type {
  AttendanceDashboardResponse,
  DashboardAttendanceStatus,
  AttendanceDashboardEmployeeRow,
  AttendanceDashboardDayMeta,
} from '../types/attendance.types'
import type { LeaveRequestWithEmployee } from '../types/leave.types'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'

// ─── Status Mapping Config ───
export const STATUS_CONFIG: Record<
  DashboardAttendanceStatus,
  { label: string; short: string; bg: string; color: string; border: string }
> = {
  PRESENT: {
    label: 'Present',
    short: 'P',
    bg: '#e8f5e9',
    color: '#2e7d32',
    border: '#a5d6a7',
  },
  PARTIAL: {
    label: 'Partial',
    short: 'PT',
    bg: '#fff8e1',
    color: '#f57f17',
    border: '#ffe082',
  },
  ABSENT: {
    label: 'Absent',
    short: 'A',
    bg: '#ffebee',
    color: '#c62828',
    border: '#ef9a9a',
  },
  ON_LEAVE: {
    label: 'On Leave',
    short: 'L',
    bg: '#e3f2fd',
    color: '#1565c0',
    border: '#90caf9',
  },
  HALF_DAY_LEAVE: {
    label: 'Half Day Leave',
    short: 'HL',
    bg: '#e0f7fa',
    color: '#00838f',
    border: '#80deea',
  },
  PENDING_LEAVE: {
    label: 'Pending Leave',
    short: 'PL',
    bg: '#fff3e0',
    color: '#e65100',
    border: '#ffcc80',
  },
  HOLIDAY: {
    label: 'Holiday',
    short: 'H',
    bg: '#f3e5f5',
    color: '#7b1fa2',
    border: '#ce93d8',
  },
  WEEKEND: {
    label: 'Weekend',
    short: 'W',
    bg: '#f5f5f5',
    color: '#757575',
    border: '#e0e0e0',
  },
  UNRECORDED: {
    label: 'Unrecorded',
    short: '—',
    bg: '#fafafa',
    color: '#9e9e9e',
    border: '#eeeeee',
  },
}

function getCurrentMonthStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function getTodayDateStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatMonthTitle(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function formatDatePretty(dateStr: string): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  const dateObj = new Date(Date.UTC(y, m - 1, d))
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    return (
      d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' IST'
    )
  } catch {
    return '—'
  }
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '00:00:00'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const s = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 + delta, 1))
  const newY = date.getUTCFullYear()
  const newM = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${newY}-${newM}`
}

// Simple Levenshtein distance for fuzzy typo tolerance
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const d: number[][] = []
  for (let i = 0; i <= m; i++) d[i] = [i]
  for (let j = 0; j <= n; j++) d[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    }
  }
  return d[m][n]
}

function isFuzzyMatch(word: string, token: string): boolean {
  if (word.includes(token)) return true
  if (token.length >= 4) {
    const dist = levenshteinDistance(word, token)
    if (dist <= 1 && token.length <= 6) return true
    if (dist <= 2 && token.length > 6) return true
  }
  return false
}

// ─── HIGH-PERFORMANCE LIGHTWEIGHT MATRIX CELL ───
interface MatrixCellProps {
  status: DashboardAttendanceStatus
  isToday: boolean
  onHover: (el: HTMLElement) => void
  onLeave: () => void
}

const MatrixCell = memo<MatrixCellProps>(({ status, isToday, onHover, onLeave }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNRECORDED

  return (
    <TableCell
      align="center"
      sx={{
        p: '4px 2px',
        width: 44,
        minWidth: 44,
        bgcolor: isToday ? 'primary.50' : undefined,
        borderLeft: isToday ? '1px solid' : undefined,
        borderRight: isToday ? '1px solid' : undefined,
        borderColor: isToday ? 'primary.light' : undefined,
      }}
    >
      <Box
        onMouseEnter={(e) => onHover(e.currentTarget)}
        onMouseLeave={onLeave}
        onClick={(e) => onHover(e.currentTarget)}
        sx={{
          width: 32,
          height: 26,
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
          bgcolor: config.bg,
          color: config.color,
          border: '1px solid',
          borderColor: config.border,
          fontWeight: 700,
          fontSize: '0.6875rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease-in-out',
          userSelect: 'none',
          '&:hover': {
            transform: 'scale(1.15)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            zIndex: 2,
          },
        }}
      >
        {config.short}
      </Box>
    </TableCell>
  )
})

// ─── MEMOIZED EMPLOYEE ROW COMPONENT ───
interface EmployeeRowProps {
  emp: AttendanceDashboardEmployeeRow
  days: AttendanceDashboardDayMeta[]
  todayDateStr: string
  onCellHover: (
    emp: AttendanceDashboardEmployeeRow,
    day: AttendanceDashboardDayMeta,
    anchorEl: HTMLElement
  ) => void
  onCellLeave: () => void
}

const EmployeeMatrixRow = memo<EmployeeRowProps>(({ emp, days, todayDateStr, onCellHover, onCellLeave }) => {
  return (
    <TableRow hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
      {/* Sticky Employee Name Column */}
      <TableCell
        component="th"
        scope="row"
        sx={{
          position: 'sticky',
          left: 0,
          zIndex: 2,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          minWidth: 190,
          maxWidth: 190,
          py: 1,
          px: 1.5,
        }}
      >
        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            title={emp.displayName}
            sx={{ fontSize: '0.8125rem' }}
          >
            {emp.displayName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            display="block"
            sx={{ fontSize: '0.6875rem' }}
          >
            {emp.employeeCode ? `#${emp.employeeCode} • ` : ''}
            {emp.designationName || emp.departmentName || 'Employee'}
          </Typography>
        </Box>
      </TableCell>

      {/* Date Cells across All Days */}
      {days.map((day) => {
        const cell = emp.days[day.date]
        const status: DashboardAttendanceStatus = cell ? cell.status : 'UNRECORDED'
        const isToday = day.date === todayDateStr

        return (
          <MatrixCell
            key={day.date}
            status={status}
            isToday={isToday}
            onHover={(el) => onCellHover(emp, day, el)}
            onLeave={onCellLeave}
          />
        )
      })}
    </TableRow>
  )
})

// ─── SINGLE SHARED FLOATING DETAIL CARD FOR MATRIX CELLS ───
interface SharedDetailPopoverProps {
  active: {
    emp: AttendanceDashboardEmployeeRow
    day: AttendanceDashboardDayMeta
    anchorEl: HTMLElement
  } | null
  onClose: () => void
}

const SharedDetailPopover: React.FC<SharedDetailPopoverProps> = ({ active, onClose }) => {
  if (!active) return null

  const { emp, day, anchorEl } = active
  const cell = emp.days[day.date]
  const status: DashboardAttendanceStatus = cell ? cell.status : 'UNRECORDED'
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNRECORDED

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      disableRestoreFocus
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      slotProps={{
        paper: {
          onMouseEnter: () => {},
          onMouseLeave: onClose,
          sx: {
            bgcolor: '#1e293b',
            color: '#ffffff',
            boxShadow: 8,
            borderRadius: 2,
            p: 1.5,
            border: '1px solid rgba(255,255,255,0.12)',
            minWidth: 220,
            maxWidth: 280,
            pointerEvents: 'auto',
          },
        },
      }}
      sx={{
        pointerEvents: 'none',
      }}
    >
      {/* Header: Name + Date + Status Badge */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: '0.8125rem', color: '#ffffff' }}>
            {emp.displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.6875rem', display: 'block' }}>
            {formatDatePretty(day.date)} • {day.dayOfWeek}
          </Typography>
        </Box>
        <Chip
          label={config.label}
          size="small"
          sx={{
            bgcolor: config.bg,
            color: config.color,
            border: '1px solid',
            borderColor: config.border,
            fontWeight: 700,
            fontSize: '0.625rem',
            height: 20,
          }}
        />
      </Box>

      <Divider sx={{ my: 0.75, borderColor: 'rgba(255, 255, 255, 0.15)' }} />

      {/* Body per Status */}
      {status === 'HOLIDAY' ? (
        <Typography variant="caption" sx={{ color: '#ffffff', display: 'block', fontSize: '0.75rem' }}>
          <strong>Holiday:</strong> {cell?.holidayName || day.holidayName || 'Official Holiday'}
        </Typography>
      ) : status === 'WEEKEND' ? (
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontSize: '0.75rem' }}>
          Weekly Off / Weekend
        </Typography>
      ) : status === 'ON_LEAVE' || status === 'HALF_DAY_LEAVE' || status === 'PENDING_LEAVE' ? (
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: '#ffffff', fontSize: '0.75rem' }}>
            <strong>Leave:</strong> {cell?.leaveType || 'General Leave'}
          </Typography>
          {cell?.leaveDuration && (
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
              <strong>Duration:</strong> {cell.leaveDuration}
            </Typography>
          )}
          {cell?.checkIn && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Check-In:</Typography>
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>{formatTime(cell.checkIn)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Check-Out:</Typography>
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>{formatTime(cell.checkOut)}</Typography>
              </Box>
            </>
          )}
        </Stack>
      ) : status === 'PRESENT' || status === 'PARTIAL' || status === 'ABSENT' ? (
        <Stack spacing={0.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Check-In:</Typography>
            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>{formatTime(cell?.checkIn ?? null)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Check-Out:</Typography>
            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>
              {cell?.checkOut ? formatTime(cell.checkOut) : cell?.checkIn ? 'In progress' : '—'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Presence:</Typography>
            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>{formatDuration(cell?.totalMinutes ?? 0)}</Typography>
          </Box>
          {cell?.isAutoPresent && (
            <Typography variant="caption" sx={{ color: '#a5d6a7', mt: 0.5, display: 'block', fontSize: '0.6875rem' }}>
              • Auto-Present Policy Applied
            </Typography>
          )}
          {cell?.isExempt && (
            <Typography variant="caption" sx={{ color: '#90caf9', mt: 0.5, display: 'block', fontSize: '0.6875rem' }}>
              • Attendance Exempt
            </Typography>
          )}
        </Stack>
      ) : (
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
          No attendance recorded
        </Typography>
      )}
    </Popover>
  )
}

// ─── METRIC CARD DETAIL POPOVER (PRESENT, ABSENT, ON LEAVE, PENDING APPROVAL) ───
type MetricCategory = 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'PENDING'

interface MetricDetailPopoverProps {
  category: MetricCategory | null
  anchorEl: HTMLElement | null
  onClose: () => void
  presentEmployees: Array<{
    id: string
    displayName: string
    employeeCode?: number | null
    designationName?: string | null
    departmentName?: string | null
    checkIn: string
    checkOut: string
    totalWorked: string
    isPartial: boolean
  }>
  absentEmployees: Array<{
    id: string
    displayName: string
    employeeCode?: number | null
    designationName?: string | null
    departmentName?: string | null
  }>
  onLeaveEmployees: Array<{
    id: string
    displayName: string
    employeeCode?: number | null
    designationName?: string | null
    departmentName?: string | null
    leaveType: string
    leaveDuration: string
  }>
  pendingLeaveRequests: LeaveRequestWithEmployee[]
  loadingPending: boolean
  onNavigateToApprovals: () => void
}

const MetricDetailPopover: React.FC<MetricDetailPopoverProps> = ({
  category,
  anchorEl,
  onClose,
  presentEmployees,
  absentEmployees,
  onLeaveEmployees,
  pendingLeaveRequests,
  loadingPending,
  onNavigateToApprovals,
}) => {
  if (!category || !anchorEl) return null

  let title = ''
  let count = 0
  let headerColor = 'primary.main'
  let headerBg = '#f8fafc'

  if (category === 'PRESENT') {
    title = 'Present Employees Today'
    count = presentEmployees.length
    headerColor = STATUS_CONFIG.PRESENT.color
    headerBg = STATUS_CONFIG.PRESENT.bg
  } else if (category === 'ABSENT') {
    title = 'Absent Employees Today'
    count = absentEmployees.length
    headerColor = STATUS_CONFIG.ABSENT.color
    headerBg = STATUS_CONFIG.ABSENT.bg
  } else if (category === 'ON_LEAVE') {
    title = 'Employees On Leave Today'
    count = onLeaveEmployees.length
    headerColor = STATUS_CONFIG.ON_LEAVE.color
    headerBg = STATUS_CONFIG.ON_LEAVE.bg
  } else if (category === 'PENDING') {
    title = 'Pending Leave Applications'
    count = pendingLeaveRequests.length
    headerColor = STATUS_CONFIG.PENDING_LEAVE.color
    headerBg = STATUS_CONFIG.PENDING_LEAVE.bg
  }

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: 300, sm: 360, md: 400 },
            maxHeight: 460,
            borderRadius: 2.5,
            boxShadow: 8,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Popover Header */}
      <Box
        sx={{
          p: 1.75,
          px: 2,
          bgcolor: headerBg,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color={headerColor}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {count} {count === 1 ? 'employee' : 'employees'}
          </Typography>
        </Box>
        <Chip
          label={count}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: 'background.paper',
            color: headerColor,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      </Box>

      {/* Scrollable Content List */}
      <Box sx={{ overflowY: 'auto', p: 1.5, flex: 1, maxHeight: 340 }}>
        {/* PRESENT EMPLOYEES */}
        {category === 'PRESENT' && (
          <>
            {presentEmployees.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No employees present today.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {presentEmployees.map((emp) => (
                  <Paper
                    key={emp.id}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      bgcolor: emp.isPartial ? '#fffdf7' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                      <Box sx={{ minWidth: 0, pr: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {emp.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {emp.employeeCode ? `#${emp.employeeCode} • ` : ''}
                          {emp.designationName || emp.departmentName || 'Employee'}
                        </Typography>
                      </Box>
                      {emp.isPartial ? (
                        <Chip label="Partial" size="small" color="warning" sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700 }} />
                      ) : (
                        <Chip label="Present" size="small" color="success" sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700 }} />
                      )}
                    </Box>

                    <Divider sx={{ my: 0.5, borderColor: 'divider' }} />

                    <Grid container spacing={1} sx={{ fontSize: '0.75rem', mt: 0.25 }}>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          In Time
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color="text.primary">
                          {emp.checkIn}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Out Time
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color={emp.checkOut === 'In progress' ? 'warning.main' : 'text.primary'}
                        >
                          {emp.checkOut}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Worked
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="primary.main">
                          {emp.totalWorked}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}

        {/* ABSENT EMPLOYEES */}
        {category === 'ABSENT' && (
          <>
            {absentEmployees.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No absent employees today. All active employees accounted for.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {absentEmployees.map((emp) => (
                  <Paper
                    key={emp.id}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {emp.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {emp.employeeCode ? `#${emp.employeeCode} • ` : ''}
                        {emp.designationName || emp.departmentName || 'Employee'}
                      </Typography>
                    </Box>
                    <Chip label="Absent" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700 }} />
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}

        {/* ON LEAVE EMPLOYEES */}
        {category === 'ON_LEAVE' && (
          <>
            {onLeaveEmployees.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No employees on approved leave today.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {onLeaveEmployees.map((emp) => (
                  <Paper
                    key={emp.id}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ minWidth: 0, pr: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {emp.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {emp.employeeCode ? `#${emp.employeeCode} • ` : ''}
                          {emp.designationName || emp.departmentName || 'Employee'}
                        </Typography>
                      </Box>
                      <Chip label={emp.leaveDuration} size="small" color="info" sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700 }} />
                    </Box>
                    <Divider sx={{ my: 0.5, borderColor: 'divider' }} />
                    <Typography variant="caption" color="text.secondary">
                      <strong>Leave Type:</strong> {emp.leaveType}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}

        {/* PENDING LEAVE APPLICATIONS */}
        {category === 'PENDING' && (
          <>
            {loadingPending ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={24} />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Loading pending leave requests...
                </Typography>
              </Box>
            ) : pendingLeaveRequests.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No pending leave applications awaiting approval.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {pendingLeaveRequests.map((req) => (
                  <Paper
                    key={req.id}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      borderLeft: '3px solid #e65100',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Box sx={{ minWidth: 0, pr: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {req.employee?.displayName || 'Employee'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {req.employee?.employeeCode ? `#${req.employee.employeeCode} • ` : ''}
                          {req.employee?.designation?.name || 'Staff'}
                        </Typography>
                      </Box>
                      <Chip
                        label={req.leaveType?.name || 'Leave'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          bgcolor: '#fff3e0',
                          color: '#e65100',
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 0.5, borderColor: 'divider' }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Dates:</strong> {formatDatePretty(req.fromDate)} {req.fromDate !== req.toDate ? `to ${formatDatePretty(req.toDate)}` : ''}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="text.primary">
                        {req.durationType === 'FULL_DAY' ? 'Full Day' : req.durationType === 'HALF_DAY' ? 'Half Day' : req.durationType}
                        {req.durationValue ? ` (${req.durationValue}d)` : ''}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>

      {/* Popover Footer Action */}
      {category === 'PENDING' && (
        <Box sx={{ p: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
          <Button
            variant="contained"
            color="warning"
            size="small"
            fullWidth
            endIcon={<ArrowForwardIcon />}
            onClick={() => {
              onClose()
              onNavigateToApprovals()
            }}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Review in Leave Dashboard
          </Button>
        </Box>
      )}
    </Popover>
  )
}

const AdminAttendanceDashboard: React.FC = () => {
  const navigate = useNavigate()
  const currentMonthStr = useMemo(() => getCurrentMonthStr(), [])
  const todayDateStr = useMemo(() => getTodayDateStr(), [])

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)
  const [selectedMonthData, setSelectedMonthData] = useState<AttendanceDashboardResponse | null>(null)
  const [currentMonthData, setCurrentMonthData] = useState<AttendanceDashboardResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Pending leave requests cache & state
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<LeaveRequestWithEmployee[]>([])
  const [loadingPending, setLoadingPending] = useState<boolean>(false)

  // In-memory cache for loaded months to prevent redundant network calls
  const monthCache = useRef<Record<string, AttendanceDashboardResponse>>({})

  // Shared Floating Detail Popover State for Matrix Cell
  const [activeCell, setActiveCell] = useState<{
    emp: AttendanceDashboardEmployeeRow
    day: AttendanceDashboardDayMeta
    anchorEl: HTMLElement
  } | null>(null)

  // Metric Card Detail Popover State
  const [activeMetricPopover, setActiveMetricPopover] = useState<{
    category: MetricCategory
    anchorEl: HTMLElement
  } | null>(null)

  const isCurrentMonthSelected = selectedMonth === currentMonthStr

  // ─── Fetch Pending Leave Requests from Canonical Leave API ───
  const fetchPendingLeaveRequests = useCallback(async () => {
    setLoadingPending(true)
    try {
      const data = await leaveApi.getPendingRequests()
      setPendingLeaveRequests(data)
    } catch {
      // Ignore background fetch error
    } finally {
      setLoadingPending(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingLeaveRequests()
  }, [fetchPendingLeaveRequests])

  // ─── Fetch Selected Month Data with In-Memory Caching ───
  const fetchSelectedMonth = useCallback(
    async (month: string, force = false) => {
      if (!force && monthCache.current[month]) {
        const cached = monthCache.current[month]
        setSelectedMonthData(cached)
        if (month === currentMonthStr) {
          setCurrentMonthData(cached)
        }
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await attendanceApi.getDashboard(month)
        monthCache.current[month] = data
        setSelectedMonthData(data)
        if (month === currentMonthStr) {
          setCurrentMonthData(data)
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load monthly attendance data')
      } finally {
        setLoading(false)
      }
    },
    [currentMonthStr]
  )

  useEffect(() => {
    fetchSelectedMonth(selectedMonth)
  }, [selectedMonth, fetchSelectedMonth])

  useEffect(() => {
    if (selectedMonth !== currentMonthStr && !currentMonthData && !monthCache.current[currentMonthStr]) {
      attendanceApi
        .getDashboard(currentMonthStr)
        .then((data) => {
          monthCache.current[currentMonthStr] = data
          setCurrentMonthData(data)
        })
        .catch(() => {})
    }
  }, [selectedMonth, currentMonthStr, currentMonthData])

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => shiftMonth(prev, -1))
  }

  const handleNextMonth = () => {
    setSelectedMonth((prev) => shiftMonth(prev, 1))
  }

  const handleCurrentMonth = () => {
    setSelectedMonth(currentMonthStr)
  }

  const handleRefresh = () => {
    fetchSelectedMonth(selectedMonth, true)
    fetchPendingLeaveRequests()
    if (selectedMonth !== currentMonthStr) {
      attendanceApi
        .getDashboard(currentMonthStr)
        .then((data) => {
          monthCache.current[currentMonthStr] = data
          setCurrentMonthData(data)
        })
        .catch(() => {})
    }
  }

  const handleCellHover = useCallback(
    (emp: AttendanceDashboardEmployeeRow, day: AttendanceDashboardDayMeta, anchorEl: HTMLElement) => {
      setActiveCell({ emp, day, anchorEl })
    },
    []
  )

  const handleCellLeave = useCallback(() => {
    setActiveCell(null)
  }, [])

  // ─── Detailed Lists for Today's Metric Cards ───
  const presentEmployees = useMemo(() => {
    const dataSource = isCurrentMonthSelected ? selectedMonthData : currentMonthData
    if (!dataSource) return []

    return dataSource.employees
      .filter((emp) => {
        const cell = emp.days[todayDateStr]
        return cell && (cell.status === 'PRESENT' || cell.status === 'PARTIAL')
      })
      .map((emp) => {
        const cell = emp.days[todayDateStr]
        return {
          id: emp.employeeId,
          displayName: emp.displayName,
          employeeCode: emp.employeeCode,
          designationName: emp.designationName,
          departmentName: emp.departmentName,
          checkIn: cell?.checkIn ? formatTime(cell.checkIn) : '—',
          checkOut: cell?.checkOut ? formatTime(cell.checkOut) : cell?.checkIn ? 'In progress' : '—',
          totalWorked: formatDuration(cell?.totalMinutes ?? 0),
          isPartial: cell?.status === 'PARTIAL',
        }
      })
  }, [isCurrentMonthSelected, selectedMonthData, currentMonthData, todayDateStr])

  const absentEmployees = useMemo(() => {
    const dataSource = isCurrentMonthSelected ? selectedMonthData : currentMonthData
    if (!dataSource) return []

    return dataSource.employees
      .filter((emp) => {
        const cell = emp.days[todayDateStr]
        return cell && cell.status === 'ABSENT'
      })
      .map((emp) => ({
        id: emp.employeeId,
        displayName: emp.displayName,
        employeeCode: emp.employeeCode,
        designationName: emp.designationName,
        departmentName: emp.departmentName,
      }))
  }, [isCurrentMonthSelected, selectedMonthData, currentMonthData, todayDateStr])

  const onLeaveEmployees = useMemo(() => {
    const dataSource = isCurrentMonthSelected ? selectedMonthData : currentMonthData
    if (!dataSource) return []

    return dataSource.employees
      .filter((emp) => {
        const cell = emp.days[todayDateStr]
        return cell && (cell.status === 'ON_LEAVE' || cell.status === 'HALF_DAY_LEAVE')
      })
      .map((emp) => {
        const cell = emp.days[todayDateStr]
        return {
          id: emp.employeeId,
          displayName: emp.displayName,
          employeeCode: emp.employeeCode,
          designationName: emp.designationName,
          departmentName: emp.departmentName,
          leaveType: cell?.leaveType || 'Approved Leave',
          leaveDuration: cell?.leaveDuration || (cell?.status === 'HALF_DAY_LEAVE' ? 'Half Day' : 'Full Day'),
        }
      })
  }, [isCurrentMonthSelected, selectedMonthData, currentMonthData, todayDateStr])

  // ─── Compute TODAY'S Summary Counts ───
  const todaySummary = useMemo(() => {
    const dataSource = isCurrentMonthSelected ? selectedMonthData : currentMonthData

    if (!dataSource) {
      return {
        present: 0,
        partial: 0,
        absent: 0,
        onLeave: 0,
        pendingLeave: pendingLeaveRequests.length,
        totalEmployees: 0,
      }
    }

    let present = 0
    let partial = 0
    let absent = 0
    let onLeave = 0

    for (const emp of dataSource.employees) {
      const cell = emp.days[todayDateStr]
      const status: DashboardAttendanceStatus = cell ? cell.status : 'UNRECORDED'

      if (status === 'PRESENT') present++
      else if (status === 'PARTIAL') partial++
      else if (status === 'ABSENT') absent++
      else if (status === 'ON_LEAVE' || status === 'HALF_DAY_LEAVE') onLeave++
    }

    return {
      present,
      partial,
      absent,
      onLeave,
      pendingLeave: pendingLeaveRequests.length,
      totalEmployees: dataSource.companySummary.totalEmployees || 0,
    }
  }, [isCurrentMonthSelected, selectedMonthData, currentMonthData, todayDateStr, pendingLeaveRequests])

  // Secondary counts for the selected month
  const selectedMonthMetadata = useMemo(() => {
    if (!selectedMonthData) {
      return {
        workingDays: 0,
        weekendDays: 0,
        holidayDays: 0,
      }
    }
    const holidayDays = selectedMonthData.days.filter((d) => Boolean(d.holidayName)).length
    const weekendDays = selectedMonthData.days.filter((d) => d.isWeekend).length

    return {
      workingDays: selectedMonthData.companySummary.totalWorkingDays || 0,
      weekendDays,
      holidayDays,
    }
  }, [selectedMonthData])

  // ─── Live Typo-Tolerant Filter for Employee Rows ───
  const visibleEmployees = useMemo(() => {
    if (!selectedMonthData) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return selectedMonthData.employees

    const tokens = q.split(/\s+/).filter(Boolean)

    return selectedMonthData.employees.filter((emp) => {
      const name = (emp.displayName || `${emp.firstName} ${emp.lastName}`).toLowerCase()
      const firstName = (emp.firstName || '').toLowerCase()
      const lastName = (emp.lastName || '').toLowerCase()
      const codeStr = String(emp.employeeCode || '')
      const codeFormatted = `#${codeStr}`
      const codeEmp = `emp-${codeStr}`
      const codeEmpPadded = `emp-${codeStr.padStart(4, '0')}`
      const desig = (emp.designationName || '').toLowerCase()
      const dept = (emp.departmentName || '').toLowerCase()

      const searchableText = `${name} ${codeStr} ${codeFormatted} ${codeEmp} ${codeEmpPadded} ${desig} ${dept}`
      const searchableWords = [
        ...name.split(/\s+/),
        firstName,
        lastName,
        codeStr,
        ...desig.split(/\s+/),
        ...dept.split(/\s+/),
      ].filter(Boolean)

      return tokens.every((token) => {
        if (searchableText.includes(token)) return true
        return searchableWords.some((word) => isFuzzyMatch(word, token))
      })
    })
  }, [selectedMonthData, searchQuery])

  return (
    <Box sx={{ width: '100%', mx: 'auto', pb: 4 }}>
      <PageHeader
        title="Attendance Dashboard"
        subtitle="Monthly employee attendance overview and presence matrix"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Attendance' },
        ]}
        action={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {/* Month Navigation Control */}
            <Paper
              elevation={1}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: '2px 4px',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <IconButton
                size="small"
                onClick={handlePrevMonth}
                title="Previous Month"
                disabled={loading}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ px: 1.5, minWidth: 140, textAlign: 'center', userSelect: 'none' }}
              >
                {formatMonthTitle(selectedMonth)}
              </Typography>
              <IconButton
                size="small"
                onClick={handleNextMonth}
                title="Next Month"
                disabled={loading}
              >
                <ChevronRightIcon />
              </IconButton>
            </Paper>

            {!isCurrentMonthSelected && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<TodayIcon />}
                onClick={handleCurrentMonth}
                disabled={loading}
              >
                This Month
              </Button>
            )}

            <IconButton
              size="small"
              onClick={handleRefresh}
              title="Refresh"
              disabled={loading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      />

      {/* ─── ERROR STATE ─── */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchSelectedMonth(selectedMonth, true)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ─── LOADING STATE ─── */}
      {loading && !selectedMonthData && (
        <LoadingState message="Loading monthly attendance matrix..." />
      )}

      {/* ─── DASHBOARD CONTENT ─── */}
      {selectedMonthData && (
        <Stack spacing={2.5}>
          {/* ─── TOP SUMMARY CARDS (ALWAYS TODAY'S COUNTS WITH HOVER/CLICK DRILLDOWN) ─── */}
          <Grid container spacing={2}>
            {/* Present Card */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                elevation={1}
                onClick={(e) => setActiveMetricPopover({ category: 'PRESENT', anchorEl: e.currentTarget })}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: STATUS_CONFIG.PRESENT.bg,
                  border: '1px solid',
                  borderColor: STATUS_CONFIG.PRESENT.border,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    borderColor: STATUS_CONFIG.PRESENT.color,
                  },
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: STATUS_CONFIG.PRESENT.color,
                    display: 'flex',
                  }}
                >
                  <CheckCircleOutlineIcon fontSize="medium" />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" fontWeight={700} color={STATUS_CONFIG.PRESENT.color}>
                    Present
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color={STATUS_CONFIG.PRESENT.color} noWrap>
                    {todaySummary.present}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {todaySummary.partial > 0 ? `+${todaySummary.partial} partial • ` : ''}
                    click for details
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Absent Card */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                elevation={1}
                onClick={(e) => setActiveMetricPopover({ category: 'ABSENT', anchorEl: e.currentTarget })}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: STATUS_CONFIG.ABSENT.bg,
                  border: '1px solid',
                  borderColor: STATUS_CONFIG.ABSENT.border,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    borderColor: STATUS_CONFIG.ABSENT.color,
                  },
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: STATUS_CONFIG.ABSENT.color,
                    display: 'flex',
                  }}
                >
                  <HighlightOffIcon fontSize="medium" />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" fontWeight={700} color={STATUS_CONFIG.ABSENT.color}>
                    Absent
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color={STATUS_CONFIG.ABSENT.color} noWrap>
                    {todaySummary.absent}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    click for details
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* On Leave Card */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                elevation={1}
                onClick={(e) => setActiveMetricPopover({ category: 'ON_LEAVE', anchorEl: e.currentTarget })}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: STATUS_CONFIG.ON_LEAVE.bg,
                  border: '1px solid',
                  borderColor: STATUS_CONFIG.ON_LEAVE.border,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    borderColor: STATUS_CONFIG.ON_LEAVE.color,
                  },
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: STATUS_CONFIG.ON_LEAVE.color,
                    display: 'flex',
                  }}
                >
                  <EventAvailableIcon fontSize="medium" />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" fontWeight={700} color={STATUS_CONFIG.ON_LEAVE.color}>
                    On Leave
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color={STATUS_CONFIG.ON_LEAVE.color} noWrap>
                    {todaySummary.onLeave}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    approved leaves today
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Pending Approval Card (Canonical Leave Approvals Metric) */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                elevation={1}
                onClick={(e) => setActiveMetricPopover({ category: 'PENDING', anchorEl: e.currentTarget })}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: STATUS_CONFIG.PENDING_LEAVE.bg,
                  border: '1px solid',
                  borderColor: STATUS_CONFIG.PENDING_LEAVE.border,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    borderColor: STATUS_CONFIG.PENDING_LEAVE.color,
                  },
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: STATUS_CONFIG.PENDING_LEAVE.color,
                    display: 'flex',
                  }}
                >
                  <PendingActionsIcon fontSize="medium" />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" fontWeight={700} color={STATUS_CONFIG.PENDING_LEAVE.color}>
                    Pending Approval
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color={STATUS_CONFIG.PENDING_LEAVE.color} noWrap>
                    {todaySummary.pendingLeave}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    pending leave requests
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ─── SECONDARY METADATA & SEARCH STRIP ─── */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            {/* Search Input Filter */}
            <Box sx={{ minWidth: { xs: '100%', sm: 320, md: 420 }, flex: { sm: 1, md: 'none' } }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search employee by name, code (#194), role, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')} title="Clear search">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>

            {/* Quick Summary Counts & Status Legend */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="caption" color="text.secondary">
                <strong>Employees:</strong> {visibleEmployees.length} of {selectedMonthData.companySummary.totalEmployees}
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
              <Typography variant="caption" color="text.secondary">
                <strong>Working Days:</strong> {selectedMonthMetadata.workingDays}
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
              <Typography variant="caption" color="text.secondary">
                <strong>Holidays:</strong> {selectedMonthMetadata.holidayDays}
              </Typography>
            </Stack>
          </Paper>

          {/* ─── MONTHLY ATTENDANCE MATRIX TABLE ─── */}
          <Paper
            elevation={1}
            sx={{
              width: '100%',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TableContainer
              sx={{
                maxHeight: 'calc(100vh - 380px)',
                minHeight: 360,
              }}
            >
              <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
                {/* Table Header: Days of the Month */}
                <TableHead>
                  <TableRow>
                    {/* Sticky Employee Header Cell */}
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                        bgcolor: '#f8fafc',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        minWidth: 190,
                        maxWidth: 190,
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                      }}
                    >
                      Employee ({visibleEmployees.length})
                    </TableCell>

                    {/* Day Meta Column Headers */}
                    {selectedMonthData.days.map((d) => {
                      const isToday = d.date === todayDateStr
                      const isHoliday = Boolean(d.holidayName)

                      return (
                        <TableCell
                          key={d.date}
                          align="center"
                          sx={{
                            p: '6px 2px',
                            width: 44,
                            minWidth: 44,
                            bgcolor: isToday ? 'primary.50' : d.isWeekend ? 'grey.100' : isHoliday ? '#f3e5f5' : '#f8fafc',
                            borderLeft: isToday ? '1px solid' : undefined,
                            borderRight: isToday ? '1px solid' : undefined,
                            borderColor: isToday ? 'primary.light' : undefined,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: isToday ? 'primary.main' : isHoliday ? '#7b1fa2' : d.isWeekend ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {d.dayOfWeek}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontWeight: isToday ? 800 : 600,
                              color: isToday ? 'primary.main' : isHoliday ? '#7b1fa2' : 'inherit',
                            }}
                          >
                            {d.dayNumber}
                          </Typography>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                </TableHead>

                {/* Table Body: Memoized Employee Rows */}
                <TableBody>
                  {visibleEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedMonthData.days.length + 1} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {searchQuery
                            ? `No employees found matching "${searchQuery}"`
                            : 'No active employees found for this company'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleEmployees.map((emp) => (
                      <EmployeeMatrixRow
                        key={emp.employeeId}
                        emp={emp}
                        days={selectedMonthData.days}
                        todayDateStr={todayDateStr}
                        onCellHover={handleCellHover}
                        onCellLeave={handleCellLeave}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* ─── STATUS LEGEND BAR ─── */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 20,
                    borderRadius: 0.75,
                    bgcolor: config.bg,
                    color: config.color,
                    border: '1px solid',
                    borderColor: config.border,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {config.short}
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {config.label}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Stack>
      )}

      {/* ─── SHARED DETAIL CARD POPOVER FOR MATRIX CELL ─── */}
      <SharedDetailPopover active={activeCell} onClose={handleCellLeave} />

      {/* ─── TOP METRIC CARDS DETAIL POPOVER (PRESENT, ABSENT, ON LEAVE, PENDING APPROVAL) ─── */}
      <MetricDetailPopover
        category={activeMetricPopover?.category ?? null}
        anchorEl={activeMetricPopover?.anchorEl ?? null}
        onClose={() => setActiveMetricPopover(null)}
        presentEmployees={presentEmployees}
        absentEmployees={absentEmployees}
        onLeaveEmployees={onLeaveEmployees}
        pendingLeaveRequests={pendingLeaveRequests}
        loadingPending={loadingPending}
        onNavigateToApprovals={() => navigate('/admin/leave-dashboard')}
      />
    </Box>
  )
}

export default AdminAttendanceDashboard
