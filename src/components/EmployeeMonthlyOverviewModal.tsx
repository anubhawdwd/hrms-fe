// src/components/EmployeeMonthlyOverviewModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Popover,
  Divider,
  useTheme,
  alpha,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CloseIcon from '@mui/icons-material/Close'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import BeachAccessIcon from '@mui/icons-material/BeachAccess'
import CelebrationIcon from '@mui/icons-material/Celebration'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { attendanceApi } from '../api/attendance.api'
import type {
  MyMonthlyAttendanceResponse,
  AttendanceDashboardCell,
  DashboardAttendanceStatus,
  AttendanceDashboardDayMeta,
} from '../types/attendance.types'

interface Props {
  open: boolean
  onClose: () => void
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatTime(ts: string | null | undefined): string {
  if (!ts) return ''
  if (/^\d{2}:\d{2}$/.test(ts)) {
    const [h, m] = ts.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedH = hour % 12 === 0 ? 12 : hour % 12
    return `${formattedH}:${m} ${ampm}`
  }
  const d = dayjs(ts)
  return d.isValid() ? d.format('hh:mm A') : ts
}

const STATUS_CONFIG: Record<
  DashboardAttendanceStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PRESENT: {
    label: 'Present',
    color: '#10b981',
    bg: '#ecfdf5',
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />,
  },
  PARTIAL: {
    label: 'Partial',
    color: '#f59e0b',
    bg: '#fffbeb',
    icon: <RemoveCircleOutlineIcon sx={{ fontSize: 14 }} />,
  },
  ABSENT: {
    label: 'Absent',
    color: '#ef4444',
    bg: '#fef2f2',
    icon: <HighlightOffIcon sx={{ fontSize: 14 }} />,
  },
  ON_LEAVE: {
    label: 'On Leave',
    color: '#6366f1',
    bg: '#eef2ff',
    icon: <BeachAccessIcon sx={{ fontSize: 14 }} />,
  },
  HALF_DAY_LEAVE: {
    label: 'Half-Day Leave',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    icon: <BeachAccessIcon sx={{ fontSize: 14 }} />,
  },
  PENDING_LEAVE: {
    label: 'Pending Leave',
    color: '#f97316',
    bg: '#fff7ed',
    icon: <BeachAccessIcon sx={{ fontSize: 14 }} />,
  },
  HOLIDAY: {
    label: 'Holiday',
    color: '#06b6d4',
    bg: '#ecfeff',
    icon: <CelebrationIcon sx={{ fontSize: 14 }} />,
  },
  WEEKEND: {
    label: 'Weekend',
    color: '#64748b',
    bg: '#f8fafc',
    icon: null,
  },
  UNRECORDED: {
    label: 'No Record',
    color: '#94a3b8',
    bg: '#ffffff',
    icon: null,
  },
}

export const EmployeeMonthlyOverviewModal: React.FC<Props> = ({ open, onClose }) => {
  const theme = useTheme()
  const [currentMonth, setCurrentMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<MyMonthlyAttendanceResponse | null>(null)

  // Popover State
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)
  const [activeCell, setActiveCell] = useState<{
    date: string
    cell: AttendanceDashboardCell | null
    holidayName: string | null
    isWeekend: boolean
  } | null>(null)

  const loadMonthData = useCallback(async (monthStr: string) => {
    setLoading(true)
    try {
      const res = await attendanceApi.getMyMonthly(monthStr)
      setData(res)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load monthly attendance')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadMonthData(currentMonth)
    }
  }, [open, currentMonth, loadMonthData])

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => dayjs(prev + '-01').subtract(1, 'month').format('YYYY-MM'))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => dayjs(prev + '-01').add(1, 'month').format('YYYY-MM'))
  }

  const handleCurrentMonth = () => {
    setCurrentMonth(dayjs().format('YYYY-MM'))
  }

  // Calculate monthly stats
  const stats = useMemo(() => {
    if (!data?.employee) return { present: 0, partial: 0, leaves: 0, holidays: 0, totalMinutes: 0 }
    const summary = data.employee.summary
    let totalMinutes = 0
    Object.values(data.employee.days || {}).forEach((c) => {
      totalMinutes += c.totalMinutes || 0
    })
    return {
      present: summary.present || 0,
      partial: summary.partial || 0,
      leaves: (summary.onLeave || 0) + (summary.pendingLeave || 0),
      holidays: summary.holiday || 0,
      totalMinutes,
    }
  }, [data])

  // Calendar Grid Cells Computation (Monday-start grid)
  const calendarGrid = useMemo(() => {
    if (!data) return []
    const firstDayOfMonth = dayjs(currentMonth + '-01')
    const daysInMonth = firstDayOfMonth.daysInMonth()
    const rawDay = firstDayOfMonth.day()
    const startDayIndex = rawDay === 0 ? 6 : rawDay - 1

    const cells: Array<{
      type: 'padding' | 'day'
      dateStr?: string
      dayNum?: number
      meta?: AttendanceDashboardDayMeta
      cell?: AttendanceDashboardCell
    }> = []

    // Add leading padding cells
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({ type: 'padding' })
    }

    // Add day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = firstDayOfMonth.date(d).format('YYYY-MM-DD')
      const meta = data.days.find((day) => day.date === dateStr)
      const cell = data.employee?.days?.[dateStr]
      cells.push({
        type: 'day',
        dateStr,
        dayNum: d,
        meta,
        cell,
      })
    }

    return cells
  }, [data, currentMonth])

  const handleCellClick = (
    e: React.MouseEvent<HTMLElement>,
    item: { dateStr?: string; meta?: AttendanceDashboardDayMeta; cell?: AttendanceDashboardCell }
  ) => {
    if (!item.dateStr) return
    setActiveCell({
      date: item.dateStr,
      cell: item.cell || null,
      holidayName: item.meta?.holidayName || null,
      isWeekend: item.meta?.isWeekend || false,
    })
    setPopoverAnchor(e.currentTarget)
  }

  const isToday = (dateStr?: string) => dateStr === dayjs().format('YYYY-MM-DD')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
        },
      }}
    >
      {/* ─── MODAL HEADER ─── */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          px: 3,
          pt: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarMonthIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Monthly Attendance Overview
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Calendar view of daily presence, working hours, leaves, and holidays
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" aria-label="Close modal">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ─── MONTH NAVIGATION & STATS BAR ─── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 1.5,
            mb: 3,
            p: 2,
            bgcolor: alpha(theme.palette.background.default, 0.6),
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            gap: 1.75,
          }}
        >
          {/* Navigation Controls Centered */}
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
            <IconButton
              onClick={handlePrevMonth}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              aria-label="Previous Month"
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 170, textAlign: 'center' }}>
              {dayjs(currentMonth + '-01').format('MMMM YYYY')}
            </Typography>
            <IconButton
              onClick={handleNextMonth}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              aria-label="Next Month"
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCurrentMonth}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 1.5,
                ml: 0.5,
              }}
            >
              This Month
            </Button>
          </Stack>

          {/* Quick Summary Badges Centered */}
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" justifyContent="center" useFlexGap>
            <Chip
              icon={<CheckCircleOutlineIcon sx={{ fontSize: '15px !important' }} />}
              label={`${stats.present} Present`}
              size="small"
              sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 700, border: '1px solid #a7f3d0' }}
            />
            {stats.partial > 0 && (
              <Chip
                label={`${stats.partial} Partial`}
                size="small"
                sx={{ bgcolor: '#fffbeb', color: '#92400e', fontWeight: 700, border: '1px solid #fde68a' }}
              />
            )}
            <Chip
              icon={<BeachAccessIcon sx={{ fontSize: '15px !important' }} />}
              label={`${stats.leaves} Leave${stats.leaves === 1 ? '' : 's'}`}
              size="small"
              sx={{ bgcolor: '#eef2ff', color: '#3730a3', fontWeight: 700, border: '1px solid #c7d2fe' }}
            />
            <Chip
              icon={<CelebrationIcon sx={{ fontSize: '15px !important' }} />}
              label={`${stats.holidays} Holiday${stats.holidays === 1 ? '' : 's'}`}
              size="small"
              sx={{ bgcolor: '#ecfeff', color: '#155e75', fontWeight: 700, border: '1px solid #a5f3fc' }}
            />
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '15px !important' }} />}
              label={`${formatMinutes(stats.totalMinutes)} Total`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ py: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary">
              Loading attendance data...
            </Typography>
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            {/* ─── CALENDAR HEADER (Mon - Sun) ─── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
                <Box
                  key={dayName}
                  sx={{
                    py: 1.25,
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    color: idx >= 5 ? 'text.secondary' : 'text.primary',
                  }}
                >
                  {dayName}
                </Box>
              ))}
            </Box>

            {/* ─── CALENDAR CELLS ─── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                bgcolor: 'divider',
                gap: '1px',
              }}
            >
              {calendarGrid.map((item, idx) => {
                if (item.type === 'padding') {
                  return (
                    <Box
                      key={`pad-${idx}`}
                      sx={{
                        minHeight: { xs: 72, sm: 84 },
                        bgcolor: 'background.paper',
                        opacity: 0.35,
                      }}
                    />
                  )
                }

                const status = item.cell?.status || (item.meta?.holidayName ? 'HOLIDAY' : item.meta?.isWeekend ? 'WEEKEND' : 'UNRECORDED')
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNRECORDED
                const todayCell = isToday(item.dateStr)
                const isHoliday = Boolean(item.meta?.holidayName)
                const hasWorkedTime = (item.cell?.totalMinutes || 0) > 0
                const hasLeave = Boolean(item.cell?.leaveType)

                return (
                  <Box
                    key={item.dateStr}
                    onClick={(e) => handleCellClick(e, item)}
                    sx={{
                      minHeight: { xs: 72, sm: 84 },
                      p: 1,
                      bgcolor: isHoliday ? '#f0f9ff' : item.meta?.isWeekend ? '#f8fafc' : 'background.paper',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      border: todayCell ? `2px solid ${theme.palette.primary.main}` : 'none',
                      '&:hover': {
                        bgcolor: isHoliday ? '#e0f2fe' : alpha(theme.palette.primary.main, 0.08),
                        zIndex: 1,
                      },
                    }}
                  >
                    {/* Day Number Header + Holiday Marker */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: todayCell ? 800 : item.meta?.isWeekend ? 600 : 700,
                            color: todayCell
                              ? 'primary.main'
                              : isHoliday
                              ? '#0369a1'
                              : item.meta?.isWeekend
                              ? '#475569'
                              : 'text.primary',
                            fontSize: '0.8125rem',
                          }}
                        >
                          {item.dayNum}
                        </Typography>

                        {/* Holiday Visual Marker */}
                        {isHoliday && (
                          <Typography component="span" sx={{ fontSize: '0.8125rem', lineHeight: 1 }}>
                            🎉
                          </Typography>
                        )}
                      </Stack>

                      {todayCell && (
                        <Typography variant="caption" sx={{ fontSize: '0.625rem', fontWeight: 800, color: 'primary.main' }}>
                          TODAY
                        </Typography>
                      )}
                    </Box>

                    {/* Status Badge & Content */}
                    <Box sx={{ mt: 0.5 }}>
                      {/* Mixed Case: Worked Presence AND Leave together on same day */}
                      {hasWorkedTime && hasLeave ? (
                        <Stack spacing={0.5}>
                          <Box
                            sx={{
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: cfg.bg,
                              color: cfg.color,
                              border: `1px solid ${alpha(cfg.color, 0.3)}`,
                              textAlign: 'center',
                            }}
                          >
                            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', fontSize: '0.6875rem' }}>
                              {formatMinutes(item.cell?.totalMinutes || 0)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: '#eef2ff',
                              color: '#4f46e5',
                              border: '1px solid #c7d2fe',
                              textAlign: 'center',
                            }}
                          >
                            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', fontSize: '0.625rem' }} noWrap>
                              {item.cell?.leaveDuration === 'HALF_DAY' ? 'Half-Day Leave' : item.cell?.leaveDuration === 'HOURLY' ? 'Hourly Leave' : item.cell?.leaveType}
                            </Typography>
                          </Box>
                        </Stack>
                      ) : status === 'PRESENT' ? (
                        <Box
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${alpha(cfg.color, 0.3)}`,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} sx={{ display: 'block', fontSize: '0.75rem' }}>
                            {formatMinutes(item.cell?.totalMinutes || 0)}
                          </Typography>
                        </Box>
                      ) : status === 'PARTIAL' ? (
                        <Box
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${alpha(cfg.color, 0.3)}`,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} sx={{ display: 'block', fontSize: '0.75rem' }}>
                            {formatMinutes(item.cell?.totalMinutes || 0)}
                          </Typography>
                        </Box>
                      ) : status === 'ON_LEAVE' || status === 'HALF_DAY_LEAVE' ? (
                        <Box
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${alpha(cfg.color, 0.3)}`,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} sx={{ display: 'block', fontSize: '0.6875rem' }} noWrap>
                            {item.cell?.leaveType || 'On Leave'}
                          </Typography>
                          {status === 'HALF_DAY_LEAVE' && (
                            <Typography variant="caption" sx={{ fontSize: '0.625rem', display: 'block', opacity: 0.85 }}>
                              Half Day
                            </Typography>
                          )}
                        </Box>
                      ) : status === 'PENDING_LEAVE' ? (
                        <Box
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            border: `1px dashed ${cfg.color}`,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} sx={{ display: 'block', fontSize: '0.6875rem' }} noWrap>
                            Pending
                          </Typography>
                        </Box>
                      ) : status === 'HOLIDAY' ? (
                        <Box
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${alpha(cfg.color, 0.3)}`,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} sx={{ display: 'block', fontSize: '0.6875rem' }} noWrap>
                            {item.meta?.holidayName || 'Holiday'}
                          </Typography>
                        </Box>
                      ) : status === 'ABSENT' ? (
                        <Box
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${alpha(cfg.color, 0.3)}`,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} sx={{ display: 'block', fontSize: '0.7rem' }}>
                            Absent
                          </Typography>
                        </Box>
                      ) : status === 'WEEKEND' ? (
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', textAlign: 'center', display: 'block', color: '#94a3b8', fontWeight: 600 }}>
                          Weekend
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Paper>
        )}

        {/* ─── DAY DETAIL POPOVER ─── */}
        <Popover
          open={Boolean(popoverAnchor)}
          anchorEl={popoverAnchor}
          onClose={() => setPopoverAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          PaperProps={{
            sx: {
              p: 2.5,
              minWidth: 260,
              maxWidth: 320,
              borderRadius: 2,
              boxShadow: 4,
            },
          }}
        >
          {activeCell && (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>
                  {dayjs(activeCell.date).format('dddd, DD MMMM YYYY')}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {(() => {
                    const st = activeCell.cell?.status || (activeCell.holidayName ? 'HOLIDAY' : activeCell.isWeekend ? 'WEEKEND' : 'UNRECORDED')
                    const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.UNRECORDED
                    return (
                      <Chip
                        icon={cfg.icon as any}
                        label={cfg.label}
                        size="small"
                        sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${alpha(cfg.color, 0.3)}` }}
                      />
                    )
                  })()}
                </Box>
              </Box>

              <Divider />

              {/* Present / Worked Time Section */}
              {(activeCell.cell?.totalMinutes || 0) > 0 && (
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Presence Duration:
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {formatMinutes(activeCell.cell!.totalMinutes)}
                    </Typography>
                  </Box>
                  {activeCell.cell?.checkIn && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        First Punch In:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatTime(activeCell.cell.checkIn)}
                      </Typography>
                    </Box>
                  )}
                  {activeCell.cell?.checkOut && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Punch Out:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatTime(activeCell.cell.checkOut)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {/* Leave Section (Shows for both full-day and partial/hourly leaves) */}
              {activeCell.cell?.leaveType && (
                <Stack spacing={0.75} sx={{ bgcolor: '#f8fafc', p: 1.25, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    LEAVE DETAILS
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      Type:
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="secondary.main">
                      {activeCell.cell.leaveType}
                    </Typography>
                  </Box>
                  {activeCell.cell.leaveDuration && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Duration:
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {activeCell.cell.leaveDuration.replace('_', ' ')}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {/* Holiday Section */}
              {activeCell.holidayName && (
                <Box sx={{ bgcolor: '#ecfeff', p: 1.25, borderRadius: 1.5, border: '1px solid #a5f3fc' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    HOLIDAY
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#0891b2">
                    {activeCell.holidayName}
                  </Typography>
                </Box>
              )}

              {/* Override Tags */}
              {activeCell.cell?.isAutoPresent && (
                <Chip label="Auto-Present Override" size="small" color="info" sx={{ fontWeight: 600 }} />
              )}
              {activeCell.cell?.isExempt && (
                <Chip label="Attendance Exempt" size="small" color="secondary" sx={{ fontWeight: 600 }} />
              )}
            </Stack>
          )}
        </Popover>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 1.5, px: 3, textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
