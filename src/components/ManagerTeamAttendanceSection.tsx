// src/components/ManagerTeamAttendanceSection.tsx
import React, { useState, useEffect, useCallback } from 'react'
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
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popper,
  Fade,
  Button,
  Grid,
  alpha,
  useTheme,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import RefreshIcon from '@mui/icons-material/Refresh'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import GroupsIcon from '@mui/icons-material/Groups'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BeachAccessIcon from '@mui/icons-material/BeachAccess'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

import { managerApi } from '../api/manager.api'
import type { ReporteeSummary } from '../types/manager.types'
import type {
  AttendanceDashboardResponse,
  AttendanceDashboardEmployeeRow,
  AttendanceDashboardDayMeta,
  DashboardAttendanceStatus,
} from '../types/attendance.types'
import DaySessionDetail from './DaySessionDetail'

const STATUS_CONFIG: Record<
  DashboardAttendanceStatus,
  { label: string; short: string; color: string; bg: string; border: string }
> = {
  PRESENT: {
    label: 'Present',
    short: 'P',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  ABSENT: {
    label: 'Absent',
    short: 'A',
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#fecaca',
  },
  PARTIAL: {
    label: 'Partial',
    short: 'PT',
    color: '#c2410c',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
  ON_LEAVE: {
    label: 'On Leave',
    short: 'L',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  HALF_DAY_LEAVE: {
    label: 'Half Day',
    short: 'HD',
    color: '#2563eb',
    bg: '#dbeafe',
    border: '#93c5fd',
  },
  PENDING_LEAVE: {
    label: 'Pending Leave',
    short: 'PL',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  HOLIDAY: {
    label: 'Holiday',
    short: 'H',
    color: '#7e22ce',
    bg: '#faf5ff',
    border: '#e9d5ff',
  },
  WEEKEND: {
    label: 'Weekend',
    short: 'W',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
  },
  UNRECORDED: {
    label: 'Unrecorded',
    short: '—',
    color: '#94a3b8',
    bg: '#f1f5f9',
    border: '#cbd5e1',
  },
}

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

function shiftMonth(monthStr: string, delta: number): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr
  const [y, m] = monthStr.split('-').map((v) => parseInt(v, 10))
  if (isNaN(y!) || isNaN(m!)) return monthStr
  const d = new Date(y!, m! - 1 + delta, 1)
  const newY = d.getFullYear()
  const newM = String(d.getMonth() + 1).padStart(2, '0')
  return `${newY}-${newM}`
}

interface ManagerTeamAttendanceSectionProps {
  reportees: ReporteeSummary[]
}

export const ManagerTeamAttendanceSection: React.FC<ManagerTeamAttendanceSectionProps> = ({
  reportees,
}) => {
  const theme = useTheme()
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthStr())
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL')
  const [data, setData] = useState<AttendanceDashboardResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Popover state for hover drilldown
  const [hoveredCell, setHoveredCell] = useState<{
    emp: AttendanceDashboardEmployeeRow
    day: AttendanceDashboardDayMeta
    anchorEl: HTMLElement
  } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await managerApi.getReporteeAttendance({
        month: currentMonth,
        employeeId: selectedEmployeeId !== 'ALL' ? selectedEmployeeId : undefined,
      })
      setData(res)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch team attendance')
    } finally {
      setLoading(false)
    }
  }, [currentMonth, selectedEmployeeId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const todayStr = getTodayDateStr()

  // Summary Metrics calculation
  const totalEmployees = data?.employees.length ?? 0
  const todaySummary = data?.dailySummary[todayStr] ?? {
    present: 0,
    absent: 0,
    partial: 0,
    onLeave: 0,
    pendingLeave: 0,
    holiday: 0,
    weekend: 0,
    unrecorded: 0,
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ─── SUMMARY METRICS ─── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GroupsIcon />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {totalEmployees}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Team Reportees
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: '1px solid',
              borderColor: alpha(STATUS_CONFIG.PRESENT.border, 0.8),
              bgcolor: alpha(STATUS_CONFIG.PRESENT.bg, 0.5),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  bgcolor: alpha(STATUS_CONFIG.PRESENT.color, 0.15),
                  color: STATUS_CONFIG.PRESENT.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: STATUS_CONFIG.PRESENT.color }}>
                  {todaySummary.present}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Present Today
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: '1px solid',
              borderColor: alpha(STATUS_CONFIG.ON_LEAVE.border, 0.8),
              bgcolor: alpha(STATUS_CONFIG.ON_LEAVE.bg, 0.5),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  bgcolor: alpha(STATUS_CONFIG.ON_LEAVE.color, 0.15),
                  color: STATUS_CONFIG.ON_LEAVE.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BeachAccessIcon />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: STATUS_CONFIG.ON_LEAVE.color }}>
                  {todaySummary.onLeave}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  On Leave Today
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: '1px solid',
              borderColor: alpha(STATUS_CONFIG.PARTIAL.border, 0.8),
              bgcolor: alpha(STATUS_CONFIG.PARTIAL.bg, 0.5),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  bgcolor: alpha(STATUS_CONFIG.PARTIAL.color, 0.15),
                  color: STATUS_CONFIG.PARTIAL.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccessTimeIcon />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: STATUS_CONFIG.PARTIAL.color }}>
                  {todaySummary.partial}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Partial / In-Progress
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── MONTHLY ATTENDANCE GRID ─── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.8),
        }}
      >
        {/* Controls Bar */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '10px',
                p: 0.5,
                bgcolor: 'background.paper',
              }}
            >
              <IconButton size="small" onClick={() => setCurrentMonth((m) => shiftMonth(m, -1))}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" fontWeight={800} sx={{ minWidth: 140, textAlign: 'center', px: 1 }}>
                {dayjs(currentMonth).format('MMMM YYYY').toUpperCase()}
              </Typography>
              <IconButton size="small" onClick={() => setCurrentMonth((m) => shiftMonth(m, 1))}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>

            <Tooltip title="Reset to Current Month">
              <Button
                size="small"
                variant="outlined"
                onClick={() => setCurrentMonth(getCurrentMonthStr())}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Today
              </Button>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter Reportee</InputLabel>
              <Select
                value={selectedEmployeeId}
                label="Filter Reportee"
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <MenuItem value="ALL">All Reportees ({reportees.length})</MenuItem>
                {reportees.map((rep) => (
                  <MenuItem key={rep.id} value={rep.id}>
                    {rep.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5, px: 0.5 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '4px',
                  bgcolor: cfg.bg,
                  border: '1px solid',
                  borderColor: cfg.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: cfg.color,
                }}
              >
                {cfg.short}
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {cfg.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        ) : !data || data.employees.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CalendarMonthIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              No attendance records found for this period
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      minWidth: 180,
                      bgcolor: 'background.paper',
                      zIndex: 3,
                      position: 'sticky',
                      left: 0,
                    }}
                  >
                    Employee
                  </TableCell>
                  {data.days.map((d) => {
                    const isToday = d.date === todayStr
                    return (
                      <TableCell
                        key={d.date}
                        align="center"
                        sx={{
                          p: 0.5,
                          minWidth: 36,
                          maxWidth: 36,
                          bgcolor: isToday ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
                          color: d.isWeekend ? 'text.secondary' : 'text.primary',
                          fontWeight: isToday ? 800 : 600,
                          borderRight: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: '0.625rem', display: 'block', lineHeight: 1 }}>
                          {d.dayOfWeek.slice(0, 2)}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>
                          {d.dayNumber}
                        </Typography>
                      </TableCell>
                    )
                  })}
                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: 'background.paper', minWidth: 50 }}>
                    P
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: 'background.paper', minWidth: 50 }}>
                    L
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: 'background.paper', minWidth: 50 }}>
                    A
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.employees.map((emp) => (
                  <TableRow key={emp.employeeId} hover>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'background.paper',
                        zIndex: 2,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 26,
                            height: 26,
                            fontSize: '0.75rem',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            fontWeight: 700,
                          }}
                        >
                          {emp.displayName.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color="text.primary"
                            sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {emp.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.625rem' }}>
                            {emp.designationName || 'Reportee'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    {data.days.map((d) => {
                      const cell = emp.days[d.date]
                      const status: DashboardAttendanceStatus = cell ? cell.status : 'UNRECORDED'
                      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNRECORDED
                      const isToday = d.date === todayStr

                      return (
                        <TableCell
                          key={d.date}
                          align="center"
                          sx={{
                            p: 0.25,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            bgcolor: isToday ? alpha(theme.palette.primary.main, 0.03) : 'inherit',
                          }}
                        >
                          <Box
                            onMouseEnter={(e) => setHoveredCell({ emp, day: d, anchorEl: e.currentTarget })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={(e) => setHoveredCell({ emp, day: d, anchorEl: e.currentTarget })}
                            sx={{
                              width: 28,
                              height: 24,
                              mx: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              bgcolor: cfg.bg,
                              border: '1px solid',
                              borderColor: cfg.border,
                              color: cfg.color,
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'transform 0.1s ease',
                              '&:hover': {
                                transform: 'scale(1.15)',
                                zIndex: 10,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                              },
                            }}
                          >
                            {cfg.short}
                          </Box>
                        </TableCell>
                      )
                    })}
                    <TableCell align="center" sx={{ fontWeight: 700, color: STATUS_CONFIG.PRESENT.color }}>
                      {emp.summary.present}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: STATUS_CONFIG.ON_LEAVE.color }}>
                      {emp.summary.onLeave}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: STATUS_CONFIG.ABSENT.color }}>
                      {emp.summary.absent}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ─── HOVER / CLICK CELL SESSION DRILLDOWN POPUP ─── */}
      {hoveredCell && (
        <Popper
          open={Boolean(hoveredCell.anchorEl)}
          anchorEl={hoveredCell.anchorEl}
          placement="bottom"
          transition
          sx={{ zIndex: 1400, pointerEvents: 'none' }}
        >
          {({ TransitionProps }) => {
            const { emp, day } = hoveredCell
            const cell = emp.days[day.date]
            const status: DashboardAttendanceStatus = cell ? cell.status : 'UNRECORDED'

            return (
              <Fade {...TransitionProps} timeout={150}>
                <Paper
                  elevation={8}
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
            )
          }}
        </Popper>
      )}
    </Box>
  )
}

export default ManagerTeamAttendanceSection
