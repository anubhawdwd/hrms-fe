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
  Popper,
  Fade,
  Badge,
  Tooltip,
  useTheme,
  alpha,
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
import dayjs from 'dayjs'

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
import { DaySessionDetail, STATUS_CONFIG } from '../components/DaySessionDetail'

// Helper date utilities
function getCurrentMonthStr(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getTodayDateStr(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMonthTitle(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr
  const [y, m] = monthStr.split('-')
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()
}

function shiftMonth(monthStr: string, delta: number): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr
  const [y, m] = monthStr.split('-').map((v) => parseInt(v, 10))
  const d = new Date(y, m - 1 + delta, 1)
  const newY = d.getFullYear()
  const newM = String(d.getMonth() + 1).padStart(2, '0')
  return `${newY}-${newM}`
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = dayjs(iso)
  return d.isValid() ? d.format('hh:mm A') : '—'
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ─── MEMOIZED MATRIX CELL COMPONENT ───
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
        p: 0.5,
        minWidth: 38,
        maxWidth: 38,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: isToday ? 'action.hover' : 'inherit',
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

  return (
    <Popper
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      placement="bottom"
      transition
      sx={{
        zIndex: 1400,
        pointerEvents: 'none',
      }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={150}>
          <Paper
            elevation={8}
            onMouseEnter={() => {}}
            onMouseLeave={onClose}
            sx={{
              bgcolor: '#1e293b',
              color: '#ffffff',
              borderRadius: 2,
              p: 1.5,
              border: '1px solid rgba(255,255,255,0.12)',
              minWidth: 260,
              maxWidth: 340,
              pointerEvents: 'auto',
              mt: 0.5,
            }}
          >
            <DaySessionDetail
              date={day.date}
              dayOfWeek={day.dayOfWeek}
              status={status}
              employeeName={emp.displayName}
              employeeCode={emp.employeeCode}
              designationOrDept={emp.designationName || emp.departmentName}
              totalMinutes={cell?.totalMinutes ?? 0}
              sessions={cell?.sessions ?? []}
              checkIn={cell?.checkIn}
              checkOut={cell?.checkOut}
              leaveType={cell?.leaveType}
              leaveDuration={cell?.leaveDuration}
              holidayName={cell?.holidayName || day.holidayName}
              isAutoPresent={cell?.isAutoPresent}
              isExempt={cell?.isExempt}
              themeMode="dark"
              showEmployeeHeader={true}
            />
          </Paper>
        </Fade>
      )}
    </Popper>
  )
}

// ─── METRIC CARD DETAIL POPOVER (PRESENT, ABSENT, ON LEAVE, PENDING APPROVAL) WITH SEARCH ───
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
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setSearchTerm('')
  }, [category])

  if (!category || !anchorEl) return null

  let title = ''
  let headerColor = 'primary.main'
  let headerBg = '#f8fafc'

  if (category === 'PRESENT') {
    title = 'Present Employees'
    headerColor = STATUS_CONFIG.PRESENT.color
    headerBg = STATUS_CONFIG.PRESENT.bg
  } else if (category === 'ABSENT') {
    title = 'Absent Employees'
    headerColor = STATUS_CONFIG.ABSENT.color
    headerBg = STATUS_CONFIG.ABSENT.bg
  } else if (category === 'ON_LEAVE') {
    title = 'Employees On Leave'
    headerColor = STATUS_CONFIG.ON_LEAVE.color
    headerBg = STATUS_CONFIG.ON_LEAVE.bg
  } else if (category === 'PENDING') {
    title = 'Pending Leave Applications'
    headerColor = STATUS_CONFIG.PENDING_LEAVE.color
    headerBg = STATUS_CONFIG.PENDING_LEAVE.bg
  }

  const q = searchTerm.toLowerCase().trim()

  const filteredPresent = presentEmployees.filter((e) => {
    if (!q) return true
    return (
      e.displayName.toLowerCase().includes(q) ||
      (e.employeeCode && e.employeeCode.toString().includes(q)) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(q)) ||
      (e.designationName && e.designationName.toLowerCase().includes(q))
    )
  })

  const filteredAbsent = absentEmployees.filter((e) => {
    if (!q) return true
    return (
      e.displayName.toLowerCase().includes(q) ||
      (e.employeeCode && e.employeeCode.toString().includes(q)) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(q)) ||
      (e.designationName && e.designationName.toLowerCase().includes(q))
    )
  })

  const filteredOnLeave = onLeaveEmployees.filter((e) => {
    if (!q) return true
    return (
      e.displayName.toLowerCase().includes(q) ||
      (e.employeeCode && e.employeeCode.toString().includes(q)) ||
      (e.leaveType && e.leaveType.toLowerCase().includes(q)) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(q)) ||
      (e.designationName && e.designationName.toLowerCase().includes(q))
    )
  })

  const filteredPending = pendingLeaveRequests.filter((req) => {
    if (!q) return true
    const empName = req.employee?.displayName || ''
    const code = req.employee?.employeeCode?.toString() || ''
    const lType = req.leaveType?.name || ''
    const reason = req.reason || ''
    return (
      empName.toLowerCase().includes(q) ||
      code.includes(q) ||
      lType.toLowerCase().includes(q) ||
      reason.toLowerCase().includes(q)
    )
  })

  const totalCount =
    category === 'PRESENT'
      ? presentEmployees.length
      : category === 'ABSENT'
      ? absentEmployees.length
      : category === 'ON_LEAVE'
      ? onLeaveEmployees.length
      : pendingLeaveRequests.length

  const filteredCount =
    category === 'PRESENT'
      ? filteredPresent.length
      : category === 'ABSENT'
      ? filteredAbsent.length
      : category === 'ON_LEAVE'
      ? filteredOnLeave.length
      : filteredPending.length

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
            width: { xs: 320, sm: 380, md: 420 },
            maxHeight: 520,
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
            {totalCount} {totalCount === 1 ? 'record' : 'records'}
            {searchTerm ? ` (${filteredCount} matching)` : ''}
          </Typography>
        </Box>
        <Chip
          label={totalCount}
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

      {/* Search Input Bar */}
      <Box sx={{ p: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          size="small"
          fullWidth
          placeholder={`Search ${category === 'PENDING' ? 'leave requests' : 'employees'} by name, code, dept...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Box>

      {/* Scrollable Content List */}
      <Box sx={{ overflowY: 'auto', p: 1.5, flex: 1, maxHeight: 340 }}>
        {/* PRESENT EMPLOYEES */}
        {category === 'PRESENT' && (
          <>
            {filteredPresent.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'No matching present employees found.' : 'No employees present on this date.'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredPresent.map((emp) => (
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
            {filteredAbsent.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'No matching absent employees found.' : 'No absent employees on this date.'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredAbsent.map((emp) => (
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
            {filteredOnLeave.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'No matching on-leave employees found.' : 'No employees on leave on this date.'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredOnLeave.map((emp) => (
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
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label={emp.leaveType} size="small" color="primary" sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700 }} />
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6875rem', mt: 0.25 }}>
                        {emp.leaveDuration}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}

        {/* PENDING LEAVE REQUESTS */}
        {category === 'PENDING' && (
          <>
            {loadingPending ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={24} />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Loading pending leave requests...
                </Typography>
              </Box>
            ) : filteredPending.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'No matching pending requests found.' : 'No pending leave applications requiring approval.'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredPending.map((req) => (
                  <Paper
                    key={req.id}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      borderLeft: '3px solid',
                      borderColor: 'warning.main',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Box sx={{ minWidth: 0, pr: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {req.employee?.displayName || 'Unknown Employee'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {req.leaveType?.name || 'Leave'} • {req.durationValue || 1} day(s)
                        </Typography>
                      </Box>
                      <Chip label="Pending" size="small" color="warning" sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem', display: 'block' }}>
                      Dates: {dayjs(req.fromDate).format('DD MMM')} - {dayjs(req.toDate).format('DD MMM YYYY')}
                    </Typography>
                    {req.reason && (
                      <Typography
                        variant="caption"
                        color="text.primary"
                        sx={{ fontSize: '0.6875rem', fontStyle: 'italic', display: 'block', mt: 0.5 }}
                      >
                        "{req.reason}"
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>

      {/* Popover Footer Action */}
      {category === 'PENDING' && (
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Button
            variant="contained"
            color="warning"
            fullWidth
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => {
              onClose()
              onNavigateToApprovals()
            }}
            sx={{ fontWeight: 700 }}
          >
            Review in Leave Approvals
          </Button>
        </Box>
      )}
    </Popover>
  )
}

// ─── MAIN ADMIN ATTENDANCE DASHBOARD COMPONENT ───
export const AdminAttendanceDashboard: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const currentMonthStr = useMemo(() => getCurrentMonthStr(), [])
  const todayDateStr = useMemo(() => getTodayDateStr(), [])

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)
  const [selectedDayDate, setSelectedDayDate] = useState<string>(todayDateStr)
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

  // ─── Month Navigation Handlers ───
  const handlePrevMonth = () => {
    const newMonth = shiftMonth(selectedMonth, -1)
    setSelectedMonth(newMonth)
    setSelectedDayDate(`${newMonth}-01`)
  }

  const handleNextMonth = () => {
    const newMonth = shiftMonth(selectedMonth, 1)
    setSelectedMonth(newMonth)
    setSelectedDayDate(`${newMonth}-01`)
  }

  const handleCurrentMonth = () => {
    setSelectedMonth(currentMonthStr)
    setSelectedDayDate(todayDateStr)
  }

  // ─── Day Navigation Handlers ───
  const handlePrevDay = () => {
    const prevDay = dayjs(selectedDayDate).subtract(1, 'day')
    const newDayStr = prevDay.format('YYYY-MM-DD')
    const newMonthStr = prevDay.format('YYYY-MM')
    setSelectedDayDate(newDayStr)
    if (newMonthStr !== selectedMonth) {
      setSelectedMonth(newMonthStr)
    }
  }

  const handleNextDay = () => {
    const nextDay = dayjs(selectedDayDate).add(1, 'day')
    const newDayStr = nextDay.format('YYYY-MM-DD')
    const newMonthStr = nextDay.format('YYYY-MM')
    setSelectedDayDate(newDayStr)
    if (newMonthStr !== selectedMonth) {
      setSelectedMonth(newMonthStr)
    }
  }

  const handleTodayDay = () => {
    setSelectedDayDate(todayDateStr)
    if (selectedMonth !== currentMonthStr) {
      setSelectedMonth(currentMonthStr)
    }
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

  // ─── Detailed Lists for Selected Day's Metric Cards ───
  const selectedDayDataSource = useMemo(() => {
    const targetMonth = selectedDayDate.slice(0, 7)
    if (selectedMonthData && selectedMonthData.month === targetMonth) {
      return selectedMonthData
    }
    if (currentMonthData && currentMonthData.month === targetMonth) {
      return currentMonthData
    }
    if (monthCache.current[targetMonth]) {
      return monthCache.current[targetMonth]
    }
    return selectedMonthData
  }, [selectedDayDate, selectedMonthData, currentMonthData])

  const presentEmployees = useMemo(() => {
    if (!selectedDayDataSource) return []

    return selectedDayDataSource.employees
      .filter((emp) => {
        const cell = emp.days[selectedDayDate]
        return cell && (cell.status === 'PRESENT' || cell.status === 'PARTIAL')
      })
      .map((emp) => {
        const cell = emp.days[selectedDayDate]
        return {
          id: emp.employeeId,
          displayName: emp.displayName,
          employeeCode: emp.employeeCode,
          designationName: emp.designationName,
          departmentName: emp.departmentName,
          checkIn: formatTime(cell?.checkIn ?? null),
          checkOut: cell?.checkOut ? formatTime(cell.checkOut) : cell?.checkIn ? 'In progress' : '—',
          totalWorked: formatDuration(cell?.totalMinutes ?? 0),
          isPartial: cell?.status === 'PARTIAL',
        }
      })
  }, [selectedDayDataSource, selectedDayDate])

  const absentEmployees = useMemo(() => {
    if (!selectedDayDataSource) return []

    return selectedDayDataSource.employees
      .filter((emp) => {
        const cell = emp.days[selectedDayDate]
        return cell && cell.status === 'ABSENT'
      })
      .map((emp) => ({
        id: emp.employeeId,
        displayName: emp.displayName,
        employeeCode: emp.employeeCode,
        designationName: emp.designationName,
        departmentName: emp.departmentName,
      }))
  }, [selectedDayDataSource, selectedDayDate])

  const onLeaveEmployees = useMemo(() => {
    if (!selectedDayDataSource) return []

    return selectedDayDataSource.employees
      .filter((emp) => {
        const cell = emp.days[selectedDayDate]
        return cell && (cell.status === 'ON_LEAVE' || cell.status === 'HALF_DAY_LEAVE')
      })
      .map((emp) => {
        const cell = emp.days[selectedDayDate]
        return {
          id: emp.employeeId,
          displayName: emp.displayName,
          employeeCode: emp.employeeCode,
          designationName: emp.designationName,
          departmentName: emp.departmentName,
          leaveType: cell?.leaveType || 'General Leave',
          leaveDuration: cell?.leaveDuration || 'Full Day',
        }
      })
  }, [selectedDayDataSource, selectedDayDate])

  // ─── Compute Selected Day's Summary Counts ───
  const selectedDaySummaryCounts = useMemo(() => {
    const presentOnly = presentEmployees.filter((e) => !e.isPartial).length
    const partialOnly = presentEmployees.filter((e) => e.isPartial).length
    return {
      present: presentOnly,
      partial: partialOnly,
      totalPresent: presentEmployees.length,
      absent: absentEmployees.length,
      onLeave: onLeaveEmployees.length,
      pendingLeave: pendingLeaveRequests.length,
    }
  }, [presentEmployees, absentEmployees, onLeaveEmployees, pendingLeaveRequests])

  // ─── Metadata for Selected Month Summary ───
  const selectedMonthMetadata = useMemo(() => {
    if (!selectedMonthData) {
      return {
        workingDays: 0,
        holidayDays: 0,
        weekendDays: 0,
      }
    }
    const holidayDays = selectedMonthData.days.filter((d) => Boolean(d.holidayName)).length
    const weekendDays = selectedMonthData.days.filter((d) => d.isWeekend).length
    return {
      workingDays: selectedMonthData.companySummary.totalWorkingDays || 0,
      holidayDays,
      weekendDays,
    }
  }, [selectedMonthData])

  // ─── Filtered Matrix Employees via Search ───
  const visibleEmployees = useMemo(() => {
    if (!selectedMonthData) return []
    const q = searchQuery.toLowerCase().trim()
    if (!q) return selectedMonthData.employees

    return selectedMonthData.employees.filter((emp) => {
      const matchName = emp.displayName.toLowerCase().includes(q)
      const matchCode = emp.employeeCode ? emp.employeeCode.toString().includes(q) : false
      const matchDept = emp.departmentName ? emp.departmentName.toLowerCase().includes(q) : false
      const matchDesig = emp.designationName ? emp.designationName.toLowerCase().includes(q) : false
      return matchName || matchCode || matchDept || matchDesig
    })
  }, [selectedMonthData, searchQuery])

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ─── Header & Top Actions ─── */}
      <PageHeader
        title="Attendance Dashboard"
        subtitle="Visual company-wide monthly attendance matrix, presence rates, and daily records"
      />

      {/* ─── Navigation Toolbar ─── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        {/* Month & Day Steppers */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          {/* Month Navigator Pill */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          </Box>

          {/* Day Navigator Pill */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Paper
              elevation={1}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: '2px 4px',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <IconButton
                size="small"
                onClick={handlePrevDay}
                title="Previous Day"
                disabled={loading}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ px: 1.5, minWidth: 160, textAlign: 'center', userSelect: 'none' }}
              >
                {dayjs(selectedDayDate).format('ddd, DD MMM YYYY')}
              </Typography>
              <IconButton
                size="small"
                onClick={handleNextDay}
                title="Next Day"
                disabled={loading}
              >
                <ChevronRightIcon />
              </IconButton>
            </Paper>

            {selectedDayDate !== todayDateStr && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<TodayIcon />}
                onClick={handleTodayDay}
                disabled={loading}
              >
                Today
              </Button>
            )}
          </Box>
        </Stack>

        {/* Right Toolbar Actions */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Compact Pending Approvals Notification Badge */}
          <Tooltip
            title={
              pendingLeaveRequests.length > 0
                ? `${pendingLeaveRequests.length} pending leave application${pendingLeaveRequests.length === 1 ? '' : 's'} requiring approval`
                : 'No pending leave applications'
            }
          >
            <IconButton
              color={pendingLeaveRequests.length > 0 ? 'warning' : 'default'}
              onClick={(e) => setActiveMetricPopover({ category: 'PENDING', anchorEl: e.currentTarget })}
              sx={{
                border: '1px solid',
                borderColor: pendingLeaveRequests.length > 0 ? 'warning.main' : 'divider',
                bgcolor: pendingLeaveRequests.length > 0 ? alpha(theme.palette.warning.main, 0.1) : 'background.paper',
                p: 1,
              }}
            >
              <Badge badgeContent={pendingLeaveRequests.length} color="error">
                <PendingActionsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Refresh Button */}
          <IconButton
            size="small"
            onClick={handleRefresh}
            title="Refresh Data"
            disabled={loading}
            sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}
          >
            <RefreshIcon />
          </IconButton>

          {/* Manual Entry Button */}
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/admin/attendance')}
            sx={{ fontWeight: 600, px: 2, height: 38 }}
          >
            Manual Entry
          </Button>
        </Stack>
      </Box>

      {/* ─── Error Alert ─── */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchSelectedMonth(selectedMonth, true)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ─── Loading Placeholder ─── */}
      {loading && !selectedMonthData && (
        <LoadingState message="Loading monthly attendance matrix..." />
      )}

      {/* ─── Selected Day Status Header & 3 Date-Dependent Summary Cards ─── */}
      {selectedMonthData && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Showing status for:
              </Typography>
              <Typography variant="subtitle2" color="text.primary" fontWeight={700}>
                {dayjs(selectedDayDate).format('dddd, DD MMMM YYYY')}
              </Typography>
              {selectedDayDate === todayDateStr && (
                <Chip label="Today" size="small" color="primary" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }} />
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            {/* Card 1: Present */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                elevation={1}
                onClick={(e) => setActiveMetricPopover({ category: 'PRESENT', anchorEl: e.currentTarget })}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: STATUS_CONFIG.PRESENT.bg,
                  border: '1px solid',
                  borderColor: STATUS_CONFIG.PRESENT.border,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" fontWeight={700} color={STATUS_CONFIG.PRESENT.color}>
                    PRESENT
                  </Typography>
                  <CheckCircleOutlineIcon sx={{ color: STATUS_CONFIG.PRESENT.color, fontSize: 20 }} />
                </Box>
                <Typography variant="h4" fontWeight={800} color={STATUS_CONFIG.PRESENT.color}>
                  {selectedDaySummaryCounts.totalPresent}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {selectedDaySummaryCounts.partial > 0 ? `Includes ${selectedDaySummaryCounts.partial} partial • ` : ''}Click to inspect
                </Typography>
              </Paper>
            </Grid>

            {/* Card 2: Absent */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                elevation={1}
                onClick={(e) => setActiveMetricPopover({ category: 'ABSENT', anchorEl: e.currentTarget })}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: STATUS_CONFIG.ABSENT.bg,
                  border: '1px solid',
                  borderColor: STATUS_CONFIG.ABSENT.border,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" fontWeight={700} color={STATUS_CONFIG.ABSENT.color}>
                    ABSENT
                  </Typography>
                  <HighlightOffIcon sx={{ color: STATUS_CONFIG.ABSENT.color, fontSize: 20 }} />
                </Box>
                <Typography variant="h4" fontWeight={800} color={STATUS_CONFIG.ABSENT.color}>
                  {selectedDaySummaryCounts.absent}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Employees unrecorded / absent • Click to inspect
                </Typography>
              </Paper>
            </Grid>

            {/* Card 3: On Leave */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                elevation={1}
                onClick={(e) => setActiveMetricPopover({ category: 'ON_LEAVE', anchorEl: e.currentTarget })}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: STATUS_CONFIG.ON_LEAVE.bg,
                  border: '1px solid',
                  borderColor: STATUS_CONFIG.ON_LEAVE.border,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" fontWeight={700} color={STATUS_CONFIG.ON_LEAVE.color}>
                    ON LEAVE
                  </Typography>
                  <EventAvailableIcon sx={{ color: STATUS_CONFIG.ON_LEAVE.color, fontSize: 20 }} />
                </Box>
                <Typography variant="h4" fontWeight={800} color={STATUS_CONFIG.ON_LEAVE.color}>
                  {selectedDaySummaryCounts.onLeave}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Approved full / partial leaves • Click to inspect
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ─── Search Bar & Matrix Card ─── */}
      {selectedMonthData && (
        <Paper elevation={1} sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          {/* Filter Bar & Quick Stats */}
          <Box
            sx={{
              p: 2,
              px: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search employee by name, code, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ width: { xs: '100%', sm: 320, md: 380 } }}
            />

            {/* Quick Summary Counts & Status Legend */}
            <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary">
                <strong>Employees:</strong> {visibleEmployees.length} of {selectedMonthData.companySummary.totalEmployees}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Typography variant="caption" color="text.secondary">
                <strong>Working Days:</strong> {selectedMonthMetadata.workingDays}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Typography variant="caption" color="text.secondary">
                <strong>Holidays:</strong> {selectedMonthMetadata.holidayDays}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Typography variant="caption" color="text.secondary">
                <strong>Weekends:</strong> {selectedMonthMetadata.weekendDays}
              </Typography>
            </Stack>
          </Box>

          {/* Status Legend Strip */}
          <Box
            sx={{
              py: 1,
              px: 2.5,
              bgcolor: 'grey.50',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 0.5 }}>
              Status Legend:
            </Typography>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 16,
                    borderRadius: 0.5,
                    bgcolor: cfg.bg,
                    border: '1px solid',
                    borderColor: cfg.border,
                    color: cfg.color,
                    fontWeight: 700,
                    fontSize: '0.5625rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cfg.short}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  {cfg.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Table Matrix */}
          <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ borderCollapse: 'separate' }}>
              <TableHead>
                <TableRow>
                  {/* Sticky Column: Employee */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      bgcolor: 'background.paper',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      fontWeight: 700,
                      minWidth: 190,
                      maxWidth: 190,
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    Employee
                  </TableCell>

                  {/* Dynamic Date Columns */}
                  {selectedMonthData.days.map((d) => {
                    const isToday = d.date === todayDateStr
                    const isSelectedDay = d.date === selectedDayDate
                    return (
                      <TableCell
                        key={d.date}
                        align="center"
                        onClick={() => setSelectedDayDate(d.date)}
                        sx={{
                          p: 0.5,
                          minWidth: 38,
                          maxWidth: 38,
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          bgcolor: isSelectedDay
                            ? alpha(theme.palette.primary.main, 0.15)
                            : isToday
                            ? alpha(theme.palette.warning.main, 0.1)
                            : d.isWeekend
                            ? 'grey.100'
                            : 'background.paper',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={isToday || isSelectedDay ? 800 : 600}
                          color={isSelectedDay ? 'primary.main' : isToday ? 'warning.dark' : 'text.primary'}
                          sx={{ fontSize: '0.6875rem', display: 'block', lineHeight: 1.1 }}
                        >
                          {d.dayNumber}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={isSelectedDay ? 'primary.main' : 'text.secondary'}
                          sx={{ fontSize: '0.5625rem', textTransform: 'uppercase' }}
                        >
                          {d.dayOfWeek.slice(0, 2)}
                        </Typography>
                      </TableCell>
                    )
                  })}
                </TableRow>
              </TableHead>

              <TableBody>
                {visibleEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedMonthData.days.length + 1} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery
                          ? `No employees matching "${searchQuery}".`
                          : 'No active employees found for this organization.'}
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
      )}

      {/* ─── Shared Popovers ─── */}
      <SharedDetailPopover active={activeCell} onClose={handleCellLeave} />

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
