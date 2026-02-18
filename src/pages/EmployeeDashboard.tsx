// src/pages/EmployeeDashboard.tsx
import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Avatar,
  Tooltip,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon from '@mui/icons-material/Add'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import BeachAccessIcon from '@mui/icons-material/BeachAccess'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import EventIcon from '@mui/icons-material/Event'
import WorkIcon from '@mui/icons-material/Work'
import BadgeIcon from '@mui/icons-material/Badge'
import EmailIcon from '@mui/icons-material/Email'
import CelebrationIcon from '@mui/icons-material/Celebration'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

import { useMyProfile } from '../hooks/useEmployee'
import { useLeaveBalances, useMyLeaveRequests, useHolidays } from '../hooks/useLeave'
import { useCheckIn, useCheckOut, useTodayAttendance } from '../hooks/useAttendance'
import { useWeeklyAttendance } from '../hooks/useAttendance'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import ApplyLeaveModal from '../components/ApplyLeaveModal'
import LeaveRequestList from '../components/LeaveRequestList'

/* ─── Section Header Component ─── */
const SectionHeader = ({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2.5,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
        {title}
      </Typography>
    </Box>
    {action}
  </Box>
)

/* ─── Stat Pill Component ─── */
const StatPill = ({
  label,
  value,
  color = 'primary',
}: {
  label: string
  value: string | number
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
}) => {
  const theme = useTheme()
  const colorMap = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  }
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 1.5,
        borderRadius: '12px',
        bgcolor: alpha(colorMap[color], 0.06),
        minWidth: 80,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{ color: colorMap[color], lineHeight: 1.2 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
    </Box>
  )
}

/* ─── Person Card Component ─── */
const PersonCard = ({
  name,
  subtitle,
  highlight = false,
}: {
  name: string
  subtitle: string
  highlight?: boolean
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 1.5,
      borderRadius: '10px',
      bgcolor: highlight
        ? (theme) => alpha(theme.palette.primary.main, 0.04)
        : 'transparent',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
      },
    }}
  >
    <Avatar
      sx={{
        width: 36,
        height: 36,
        fontSize: '0.85rem',
        fontWeight: 700,
        bgcolor: highlight
          ? 'primary.main'
          : (theme) => alpha(theme.palette.primary.main, 0.1),
        color: highlight
          ? 'primary.contrastText'
          : 'primary.main',
      }}
    >
      {name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="body2"
        fontWeight={600}
        noWrap
        color="text.primary"
      >
        {name}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {subtitle}
      </Typography>
    </Box>
  </Box>
)

/* ─── Card Wrapper ─── */
const DashboardCard = ({
  children,
  sx = {},
  hover = false,
}: {
  children: React.ReactNode
  sx?: object
  hover?: boolean
}) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: '16px',
      height: '100%',
      transition: 'all 0.25s ease',
      ...(hover && {
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: (theme: any) =>
            `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
        },
      }),
      ...sx,
    }}
  >
    {children}
  </Paper>
)

/* ═══════════════════════════════════════════════
   ─── MAIN DASHBOARD COMPONENT ───
   ═══════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const theme = useTheme()
  const { profile, hierarchy, loading, error, reload } = useMyProfile()
  const { balances, reload: reloadBalances } = useLeaveBalances(
    new Date().getFullYear()
  )
  const { checkIn, loading: checkingIn } = useCheckIn()
  const { checkOut, loading: checkingOut } = useCheckOut()
  const { day: todayAttendance, load: loadAttendance } = useTodayAttendance()
  const {
    requests,
    loading: requestsLoading,
    reload: reloadRequests,
  } = useMyLeaveRequests()
  const { holidays } = useHolidays()

  // Weekly calendar state
  const [weekOffset, setWeekOffset] = useState(0)
  const { days: weekDays, loading: weekLoading } =
    useWeeklyAttendance(weekOffset)

  // Live timer — now with seconds
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Leave modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  // Live working timer — 1-second updates
  useEffect(() => {
    if (!todayAttendance?.events?.length) return

    const lastEvent = todayAttendance.events[todayAttendance.events.length - 1]
    if (lastEvent.type !== 'CHECK_IN') return

    const checkInTime = new Date(lastEvent.timestamp).getTime()
    const baseSeconds = todayAttendance.totalMinutes * 60

    const calc = () => {
      const now = Date.now()
      const liveSeconds = Math.floor((now - checkInTime) / 1000)
      setElapsedSeconds(baseSeconds + liveSeconds)
    }

    calc() // Immediate
    const interval = setInterval(calc, 1000) // Every second

    return () => clearInterval(interval)
  }, [todayAttendance])

  const isCheckedIn = useMemo(() => {
    if (!todayAttendance?.events?.length) return false
    return (
      todayAttendance.events[todayAttendance.events.length - 1].type ===
      'CHECK_IN'
    )
  }, [todayAttendance])

  const formatTime = useCallback((totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return { h, m, s }
  }, [])

  const formatTimeStr = useCallback(
    (totalSeconds: number, showSeconds = false) => {
      const { h, m, s } = formatTime(totalSeconds)
      if (showSeconds) return `${h}h ${m}m ${s}s`
      return `${h}h ${m}m`
    },
    [formatTime]
  )

  const formatMinutes = useCallback((mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
  }, [])

  const weekStart = useMemo(
    () => dayjs().startOf('week').add(weekOffset * 7, 'day'),
    [weekOffset]
  )

  // Upcoming holidays (next 3)
  const upcomingHolidays = useMemo(
    () =>
      holidays
        .filter((h) => dayjs(h.date).isAfter(dayjs()))
        .slice(0, 3),
    [holidays]
  )

  if (loading)
    return <LoadingState message="Loading your dashboard…" />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!profile || !hierarchy) {
    return (
      <EmptyState
        title="No employee data found"
        subtitle="Please contact HR if this looks incorrect."
      />
    )
  }

  const handleCheckIn = async () => {
    try {
      await checkIn()
      toast.success('Checked in successfully!')
      loadAttendance()
    } catch (err: any) {
      toast.error(err?.message || 'Check-in failed')
    }
  }

  const handleCheckOut = async () => {
    try {
      await checkOut()
      toast.success('Checked out successfully!')
      loadAttendance()
    } catch (err: any) {
      toast.error(err?.message || 'Check-out failed')
    }
  }

  const currentDisplaySeconds = isCheckedIn
    ? elapsedSeconds
    : (todayAttendance?.totalMinutes ?? 0) * 60

  const progressPercent = Math.min(
    (currentDisplaySeconds / (8 * 3600)) * 100,
    100
  )
  const { h, m, s } = formatTime(currentDisplaySeconds)

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  })()

  /* helper: readable leave duration for calendar */
  const getLeaveLabel = (dayData: any) => {
    // Find leave request for this date
    const dateStr = dayData.date?.slice(0, 10)
    const leaveReq = requests.find(
      (r) =>
        (r.status === 'APPROVED' || r.status === 'PENDING') &&
        dateStr >= r.fromDate.slice(0, 10) &&
        dateStr <= r.toDate.slice(0, 10)
    )

    if (!leaveReq) {
      // Fallback: check if totalMinutes > 0 to determine partial
      if (dayData.totalMinutes > 0) return 'Partial'
      return 'Leave'
    }

    switch (leaveReq.durationType) {
      case 'FULL_DAY':
        return 'Full Day'
      case 'HALF_DAY':
        return 'Half Day'
      case 'QUARTER_DAY':
        return 'Quarter Day'
      case 'HOURLY':
        return `${leaveReq.durationValue}h Leave`
      default:
        return 'Leave'
    }
  }

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', pb: 4 }}>
      {/* ─── Greeting Header ─── */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          {greeting}, {profile.firstName || profile.displayName.split(' ')[0]}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {dayjs().format('dddd, DD MMMM YYYY')} &middot;{' '}
          {profile.designation.name}
          {profile.team?.name ? ` · ${profile.team.name}` : ''}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ═══ ATTENDANCE CARD ═══ */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardCard
            sx={{
              background: isCheckedIn
                ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.03)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`
                : undefined,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative dot */}
            {isCheckedIn && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      opacity: 1,
                      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.4)}`,
                    },
                    '50%': {
                      opacity: 0.8,
                      boxShadow: `0 0 0 8px ${alpha(theme.palette.success.main, 0)}`,
                    },
                  },
                }}
              />
            )}

            <SectionHeader
              icon={<AccessTimeIcon fontSize="small" />}
              title="Today's Attendance"
              action={
                todayAttendance && (
                  <Chip
                    label={todayAttendance.status}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor:
                        todayAttendance.status === 'PRESENT'
                          ? alpha(theme.palette.success.main, 0.1)
                          : todayAttendance.status === 'PARTIAL'
                            ? alpha(theme.palette.warning.main, 0.1)
                            : todayAttendance.status === 'LEAVE'
                              ? alpha(theme.palette.info.main, 0.1)
                              : alpha(theme.palette.text.secondary, 0.1),
                      color:
                        todayAttendance.status === 'PRESENT'
                          ? 'success.dark'
                          : todayAttendance.status === 'PARTIAL'
                            ? 'warning.dark'
                            : todayAttendance.status === 'LEAVE'
                              ? 'info.dark'
                              : 'text.secondary',
                    }}
                  />
                )
              }
            />

            {/* Time Display */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 0.5,
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    fontVariantNumeric: 'tabular-nums',
                    color: isCheckedIn ? 'primary.main' : 'text.primary',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {String(h).padStart(2, '0')}
                  <Typography
                    component="span"
                    variant="h4"
                    fontWeight={800}
                    sx={{ opacity: 0.4, mx: 0.3 }}
                  >
                    :
                  </Typography>
                  {String(m).padStart(2, '0')}
                </Typography>

                {/* Seconds — always show when checked in */}
                {isCheckedIn && (
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      fontVariantNumeric: 'tabular-nums',
                      color: alpha(theme.palette.primary.main, 0.5),
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{ opacity: 0.4, mx: 0.3 }}
                    >
                      :
                    </Typography>
                    {String(s).padStart(2, '0')}
                  </Typography>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 1, mb: 0.3 }}
                >
                  / 08:00:00
                </Typography>
              </Box>

              {/* Progress bar */}
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: alpha(
                    progressPercent >= 100
                      ? theme.palette.success.main
                      : theme.palette.primary.main,
                    0.08
                  ),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background:
                      progressPercent >= 100
                        ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                        : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {Math.round(progressPercent)}% of 8-hour target
              </Typography>
            </Box>

            {/* Check-in / Check-out Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={isCheckedIn ? 'outlined' : 'contained'}
                color="success"
                onClick={handleCheckIn}
                disabled={checkingIn || !!isCheckedIn}
                startIcon={<LoginIcon />}
                sx={{
                  flex: 1,
                  py: 1.3,
                  ...(!isCheckedIn && {
                    background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                      boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.3)}`,
                    },
                  }),
                }}
              >
                {checkingIn ? 'Checking in…' : 'Check In'}
              </Button>
              <Button
                variant={isCheckedIn ? 'contained' : 'outlined'}
                color="warning"
                onClick={handleCheckOut}
                disabled={checkingOut || !isCheckedIn}
                startIcon={<LogoutIcon />}
                sx={{
                  flex: 1,
                  py: 1.3,
                  ...(isCheckedIn && {
                    background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                      boxShadow: `0 4px 16px ${alpha(theme.palette.warning.main, 0.3)}`,
                    },
                  }),
                }}
              >
                {checkingOut ? 'Checking out…' : 'Check Out'}
              </Button>
            </Box>
          </DashboardCard>
        </Grid>

        {/* ═══ PROFILE CARD ═══ */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <DashboardCard hover>
            <SectionHeader
              icon={<PersonIcon fontSize="small" />}
              title="My Profile"
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
              >
                {profile.displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {profile.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.employeeCode}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                {
                  icon: <EmailIcon sx={{ fontSize: 16 }} />,
                  label: profile.user.email,
                },
                {
                  icon: <WorkIcon sx={{ fontSize: 16 }} />,
                  label: profile.designation.name,
                },
                {
                  icon: <GroupsIcon sx={{ fontSize: 16 }} />,
                  label: profile.team?.name ?? 'No team assigned',
                },
                {
                  icon: <EventIcon sx={{ fontSize: 16 }} />,
                  label: `Joined ${dayjs(profile.joiningDate).format('DD MMM YYYY')}`,
                },
              ].map((item, i) => (
                <Box
                  key={i}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                >
                  <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                    {item.icon}
                  </Box>
                  <Typography variant="body2" color="text.primary">
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </DashboardCard>
        </Grid>

        {/* ═══ WEEKLY CALENDAR ═══ */}
        <Grid size={{ xs: 12 }}>
          <DashboardCard>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                  }}
                >
                  <CalendarMonthIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Weekly Overview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {weekStart.format('DD MMM')} –{' '}
                    {weekStart.add(6, 'day').format('DD MMM YYYY')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  onClick={() => setWeekOffset((w) => w - 1)}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                  }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => setWeekOffset((w) => w + 1)}
                  disabled={weekOffset >= 0}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                  }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {weekLoading ? (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    height={120}
                    sx={{ flex: 1, borderRadius: '12px' }}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(4, 1fr)',
                    md: 'repeat(7, 1fr)',
                  },
                  gap: 1.5,
                }}
              >
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = weekStart.add(i, 'day')
                  const dateStr = date.format('YYYY-MM-DD')
                  const dayData = weekDays.find(
                    (d) => d.date.slice(0, 10) === dateStr
                  )
                  const holiday = holidays.find(
                    (h) => dayjs(h.date).format('YYYY-MM-DD') === dateStr
                  )
                  const isWeekend = date.day() === 0 || date.day() === 6
                  const isToday = date.isSame(dayjs(), 'day')
                  const isFuture = date.isAfter(dayjs(), 'day')

                  const statusConfig: Record<
                    string,
                    { bg: string; color: string; border: string }
                  > = {
                    PRESENT: {
                      bg: alpha(theme.palette.success.main, 0.06),
                      color: theme.palette.success.dark,
                      border: alpha(theme.palette.success.main, 0.2),
                    },
                    PARTIAL: {
                      bg: alpha(theme.palette.warning.main, 0.06),
                      color: theme.palette.warning.dark,
                      border: alpha(theme.palette.warning.main, 0.2),
                    },
                    LEAVE: {
                      bg: alpha(theme.palette.info.main, 0.06),
                      color: theme.palette.info.dark,
                      border: alpha(theme.palette.info.main, 0.2),
                    },
                    ABSENT: {
                      bg: alpha(theme.palette.error.main, 0.04),
                      color: theme.palette.error.dark,
                      border: alpha(theme.palette.error.main, 0.15),
                    },
                  }

                  const dayStatus = dayData?.status
                    ? statusConfig[dayData.status] || statusConfig.ABSENT
                    : null

                  return (
                    <Paper
                      key={i}
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: '14px',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        cursor: 'default',
                        bgcolor: isToday
                          ? alpha(theme.palette.primary.main, 0.06)
                          : holiday
                            ? alpha(theme.palette.secondary.main, 0.04)
                            : isWeekend
                              ? alpha(theme.palette.text.secondary, 0.03)
                              : dayStatus
                                ? dayStatus.bg
                                : 'background.paper',
                        border: '1.5px solid',
                        borderColor: isToday
                          ? theme.palette.primary.main
                          : holiday
                            ? alpha(theme.palette.secondary.main, 0.3)
                            : dayStatus
                              ? dayStatus.border
                              : theme.palette.divider,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                        },
                      }}
                    >
                      {/* Today indicator dot */}
                      {isToday && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                          }}
                        />
                      )}

                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color={
                          isToday ? 'primary.main' : 'text.secondary'
                        }
                        sx={{
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          display: 'block',
                          mb: 0.3,
                        }}
                      >
                        {date.format('ddd')}
                      </Typography>

                      <Typography
                        variant="h6"
                        fontWeight={isToday ? 800 : 700}
                        color={
                          isToday ? 'primary.main' : 'text.primary'
                        }
                        sx={{ lineHeight: 1.4 }}
                      >
                        {date.format('DD')}
                      </Typography>

                      <Box sx={{ mt: 1, minHeight: 36 }}>
                        {holiday ? (
                          <Tooltip title={holiday.name}>
                            <Box>
                              <CelebrationIcon
                                sx={{
                                  fontSize: 16,
                                  color: 'secondary.main',
                                  mb: 0.3,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: 'secondary.dark',
                                  fontWeight: 600,
                                  fontSize: '0.65rem',
                                  lineHeight: 1.2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {holiday.name}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ) : dayData ? (
                          <>
                            <Chip
                              label={
                                dayData.status === 'LEAVE'
                                  ? getLeaveLabel(dayData)
                                  : dayData.status
                              }
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: dayStatus
                                  ? alpha(
                                      dayStatus.color,
                                      0.1
                                    )
                                  : undefined,
                                color: dayStatus?.color,
                                mb: 0.5,
                              }}
                            />
                            {dayData.totalMinutes > 0 && (
                              <Typography
                                variant="caption"
                                display="block"
                                fontWeight={500}
                                color="text.secondary"
                                sx={{ fontSize: '0.7rem' }}
                              >
                                {formatMinutes(dayData.totalMinutes)}
                              </Typography>
                            )}
                          </>
                        ) : isWeekend ? (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            fontWeight={500}
                          >
                            Weekend
                          </Typography>
                        ) : isFuture ? (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                          >
                            —
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                          >
                            No data
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  )
                })}
              </Box>
            )}

            {/* Legend */}
            <Box
              sx={{
                display: 'flex',
                gap: 2.5,
                mt: 2.5,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {[
                { color: theme.palette.success.main, label: 'Present' },
                { color: theme.palette.warning.main, label: 'Partial' },
                { color: theme.palette.info.main, label: 'Leave' },
                { color: theme.palette.error.main, label: 'Absent' },
                { color: theme.palette.secondary.main, label: 'Holiday' },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '3px',
                      bgcolor: alpha(item.color, 0.2),
                      border: `2px solid ${item.color}`,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </DashboardCard>
        </Grid>

        {/* ═══ LEAVE BALANCES ═══ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard hover>
            <SectionHeader
              icon={<BeachAccessIcon fontSize="small" />}
              title="Leave Balances"
              action={
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setLeaveModalOpen(true)}
                  sx={{
                    borderRadius: '10px',
                    px: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  }}
                >
                  Apply Leave
                </Button>
              }
            />

            {balances.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No leave balances configured
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {balances.map((b) => {
                  const usedPercent =
                    b.allocated > 0
                      ? ((b.allocated - b.remaining) / b.allocated) * 100
                      : 0
                  const isLow =
                    b.allocated > 0 && b.remaining / b.allocated < 0.2

                  return (
                    <Box
                      key={b.id}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: isLow
                          ? alpha(theme.palette.error.main, 0.03)
                          : alpha(theme.palette.primary.main, 0.02),
                        border: '1px solid',
                        borderColor: isLow
                          ? alpha(theme.palette.error.main, 0.12)
                          : theme.palette.divider,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="text.primary"
                          >
                            {b.leaveType.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {b.leaveType.code}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={isLow ? 'error.main' : 'primary.main'}
                          >
                            {b.remaining}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            of {b.allocated} days
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={usedPercent}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(
                            isLow
                              ? theme.palette.error.main
                              : theme.palette.primary.main,
                            0.08
                          ),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            bgcolor: isLow
                              ? 'error.main'
                              : 'primary.main',
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          {b.used} used
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          {b.remaining} remaining
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            )}
          </DashboardCard>
        </Grid>

        {/* ═══ UPCOMING HOLIDAYS ═══ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard hover>
            <SectionHeader
              icon={<CelebrationIcon fontSize="small" />}
              title="Upcoming Holidays"
            />

            {upcomingHolidays.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                }}
              >
                <CelebrationIcon
                  sx={{
                    fontSize: 40,
                    color: alpha(theme.palette.text.secondary, 0.2),
                    mb: 1,
                  }}
                />
                <Typography color="text.secondary">
                  No upcoming holidays
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {upcomingHolidays.map((h) => {
                  const d = dayjs(h.date)
                  const daysUntil = d.diff(dayjs(), 'day')

                  return (
                    <Box
                      key={h.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: alpha(theme.palette.secondary.main, 0.03),
                        border: '1px solid',
                        borderColor: alpha(
                          theme.palette.secondary.main,
                          0.1
                        ),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(
                            theme.palette.secondary.main,
                            0.06
                          ),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(
                            theme.palette.secondary.main,
                            0.1
                          ),
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="secondary.dark"
                          sx={{
                            textTransform: 'uppercase',
                            fontSize: '0.6rem',
                            lineHeight: 1,
                          }}
                        >
                          {d.format('MMM')}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color="secondary.dark"
                          sx={{ lineHeight: 1.2 }}
                        >
                          {d.format('DD')}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                        >
                          {h.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.format('dddd')} ·{' '}
                          {daysUntil === 0
                            ? 'Today!'
                            : daysUntil === 1
                              ? 'Tomorrow'
                              : `in ${daysUntil} days`}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            )}
          </DashboardCard>
        </Grid>

        {/* ═══ HIERARCHY — MANAGER ═══ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard hover>
            <SectionHeader
              icon={<SupervisorAccountIcon fontSize="small" />}
              title="Reporting Manager"
            />
            {hierarchy.manager ? (
              <PersonCard
                name={hierarchy.manager.displayName}
                subtitle={hierarchy.manager.designation.name}
                highlight
              />
            ) : (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No reporting manager
                </Typography>
              </Box>
            )}
          </DashboardCard>
        </Grid>

        {/* ═══ HIERARCHY — PEERS ═══ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard hover>
            <SectionHeader
              icon={<GroupsIcon fontSize="small" />}
              title={`My Team (${hierarchy.peers.length})`}
            />
            {hierarchy.peers.length === 0 ? (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No teammates
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {hierarchy.peers.slice(0, 5).map((p) => (
                  <PersonCard
                    key={p.id}
                    name={p.displayName}
                    subtitle={p.designation.name}
                  />
                ))}
                {hierarchy.peers.length > 5 && (
                  <Typography
                    variant="caption"
                    color="primary.main"
                    fontWeight={600}
                    sx={{
                      textAlign: 'center',
                      mt: 1,
                      cursor: 'pointer',
                    }}
                  >
                    +{hierarchy.peers.length - 5} more
                  </Typography>
                )}
              </Box>
            )}
          </DashboardCard>
        </Grid>

        {/* ═══ HIERARCHY — REPORTEES ═══ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard hover>
            <SectionHeader
              icon={<TrendingUpIcon fontSize="small" />}
              title={`Reportees (${hierarchy.reportees.length})`}
            />
            {hierarchy.reportees.length === 0 ? (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No direct reportees
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {hierarchy.reportees.map((r) => (
                  <PersonCard
                    key={r.id}
                    name={r.displayName}
                    subtitle={r.designation.name}
                  />
                ))}
              </Box>
            )}
          </DashboardCard>
        </Grid>

        {/* ═══ MY LEAVE REQUESTS ═══ */}
        <Grid size={{ xs: 12 }}>
          <DashboardCard>
            <SectionHeader
              icon={<BadgeIcon fontSize="small" />}
              title="My Leave Requests"
            />
            <LeaveRequestList
              requests={requests}
              loading={requestsLoading}
              onCancel={async (id) => {
                try {
                  const { leaveApi } = await import('../api/leave.api')
                  await leaveApi.cancel(id)
                  toast.success('Leave cancelled')
                  reloadRequests()
                  reloadBalances()
                } catch {
                  toast.error('Failed to cancel')
                }
              }}
            />
          </DashboardCard>
        </Grid>
      </Grid>

      {/* ─── Apply Leave Modal ─── */}
      <ApplyLeaveModal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onSuccess={() => {
          setLeaveModalOpen(false)
          reloadRequests()
          reloadBalances()
          toast.success('Leave applied!')
        }}
      />
    </Box>
  )
}

export default EmployeeDashboard

// import { useEffect, useState } from 'react'
// import {
//   Box,
//   Typography,
//   Paper,
//   Grid,
//   Chip,
//   Button,
//   IconButton,
//   LinearProgress,
// } from '@mui/material'
// import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
// import ChevronRightIcon from '@mui/icons-material/ChevronRight'
// import AddIcon from '@mui/icons-material/Add'
// import toast from 'react-hot-toast'
// import dayjs from 'dayjs'

// import { useMyProfile } from '../hooks/useEmployee'
// import { useLeaveBalances, useMyLeaveRequests, useHolidays } from '../hooks/useLeave'
// import { useCheckIn, useCheckOut, useTodayAttendance } from '../hooks/useAttendance'
// import { useWeeklyAttendance } from '../hooks/useAttendance'
// import LoadingState from '../components/LoadingState'
// import ErrorState from '../components/ErrorState'
// import EmptyState from '../components/EmptyState'
// import ApplyLeaveModal from '../components/ApplyLeaveModal'
// import LeaveRequestList from '../components/LeaveRequestList'

// const EmployeeDashboard = () => {
//   const { profile, hierarchy, loading, error, reload } = useMyProfile()
//   const { balances, reload: reloadBalances } = useLeaveBalances(
//     new Date().getFullYear()
//   )
//   const { checkIn, loading: checkingIn } = useCheckIn()
//   const { checkOut, loading: checkingOut } = useCheckOut()
//   const {
//     day: todayAttendance,
//     load: loadAttendance,
//   } = useTodayAttendance()
//   const { requests, loading: requestsLoading, reload: reloadRequests } =
//     useMyLeaveRequests()
//   const { holidays } = useHolidays()

//   // Weekly calendar state
//   const [weekOffset, setWeekOffset] = useState(0)
//   const { days: weekDays, loading: weekLoading } =
//     useWeeklyAttendance(weekOffset)

//   // Live timer
//   const [elapsedMinutes, setElapsedMinutes] = useState(0)

//   // Leave modal
//   const [leaveModalOpen, setLeaveModalOpen] = useState(false)

//   useEffect(() => {
//     loadAttendance()
//   }, [loadAttendance])

//   // Live working hours timer
//   useEffect(() => {
//     if (!todayAttendance?.events?.length) return

//     const lastEvent = todayAttendance.events[todayAttendance.events.length - 1]
//     if (lastEvent.type !== 'CHECK_IN') return

//     const checkInTime = new Date(lastEvent.timestamp).getTime()

//     const interval = setInterval(() => {
//       const now = Date.now()
//       const mins =
//         todayAttendance.totalMinutes +
//         Math.floor((now - checkInTime) / 60000)
//       setElapsedMinutes(mins)
//     }, 30000) // update every 30s

//     // Initial calc
//     const now = Date.now()
//     setElapsedMinutes(
//       todayAttendance.totalMinutes +
//         Math.floor((now - checkInTime) / 60000)
//     )

//     return () => clearInterval(interval)
//   }, [todayAttendance])

//   if (loading) return <LoadingState message="Loading your dashboard…" />
//   if (error) return <ErrorState message={error} onRetry={reload} />
//   if (!profile || !hierarchy) {
//     return (
//       <EmptyState
//         title="No employee data found"
//         subtitle="Please contact HR if this looks incorrect."
//       />
//     )
//   }

//   const handleCheckIn = async () => {
//     try {
//       await checkIn()
//       toast.success('Checked in!')
//       loadAttendance()
//     } catch (err: any) {
//       toast.error(err?.message || 'Check-in failed')
//     }
//   }

//   const handleCheckOut = async () => {
//     try {
//       await checkOut()
//       toast.success('Checked out!')
//       loadAttendance()
//     } catch (err: any) {
//       toast.error(err?.message || 'Check-out failed')
//     }
//   }

//   const isCheckedIn =
//     todayAttendance?.events?.length &&
//     todayAttendance.events[todayAttendance.events.length - 1].type ===
//       'CHECK_IN'

//   const formatHours = (mins: number) => {
//     const h = Math.floor(mins / 60)
//     const m = mins % 60
//     return `${h}h ${m}m`
//   }

//   const weekStart = dayjs()
//     .startOf('week')
//     .add(weekOffset * 7, 'day')

//   // Upcoming holidays (next 3)
//   const upcomingHolidays = holidays
//     .filter((h) => dayjs(h.date).isAfter(dayjs()))
//     .slice(0, 3)

//   return (
//     <Box>
//       <Typography variant="h5" mb={3}>
//         Welcome, {profile.displayName}
//       </Typography>

//       <Grid container spacing={3}>
//         {/* ─── Attendance Card ─── */}
//         <Grid size={{ xs: 12, md: 6 }}>
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} mb={2}>
//               Today's Attendance
//             </Typography>

//             {todayAttendance ? (
//               <Box mb={2}>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: 2,
//                     mb: 1,
//                   }}
//                 >
//                   <Chip
//                     label={todayAttendance.status}
//                     color={
//                       todayAttendance.status === 'PRESENT'
//                         ? 'success'
//                         : todayAttendance.status === 'PARTIAL'
//                           ? 'warning'
//                           : todayAttendance.status === 'LEAVE'
//                             ? 'info'
//                             : 'default'
//                     }
//                   />
//                   {isCheckedIn && (
//                     <Typography variant="h6" color="primary">
//                       {formatHours(elapsedMinutes)}
//                     </Typography>
//                   )}
//                 </Box>

//                 {/* Progress bar: 480 min = 8 hours target */}
//                 <LinearProgress
//                   variant="determinate"
//                   value={Math.min(
//                     ((isCheckedIn ? elapsedMinutes : todayAttendance.totalMinutes) /
//                       480) *
//                       100,
//                     100
//                   )}
//                   sx={{ height: 8, borderRadius: 4, mb: 1 }}
//                 />
//                 <Typography variant="caption" color="text.secondary">
//                   {formatHours(
//                     isCheckedIn
//                       ? elapsedMinutes
//                       : todayAttendance.totalMinutes
//                   )}{' '}
//                   / 8h 0m
//                 </Typography>
//               </Box>
//             ) : (
//               <Typography color="text.secondary" mb={2}>
//                 No attendance recorded today
//               </Typography>
//             )}

//             <Box sx={{ display: 'flex', gap: 2 }}>
//               <Button
//                 variant="contained"
//                 color="success"
//                 onClick={handleCheckIn}
//                 disabled={checkingIn || !!isCheckedIn}
//               >
//                 {checkingIn ? 'Checking in...' : 'Check In'}
//               </Button>
//               <Button
//                 variant="contained"
//                 color="warning"
//                 onClick={handleCheckOut}
//                 disabled={checkingOut || !isCheckedIn}
//               >
//                 {checkingOut ? 'Checking out...' : 'Check Out'}
//               </Button>
//             </Box>
//           </Paper>
//         </Grid>

//         {/* ─── Profile Card ─── */}
//         <Grid size={{ xs: 12, md: 6 }}>
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} mb={2}>
//               My Profile
//             </Typography>
//             <Typography>Email: {profile.user.email}</Typography>
//             <Typography>
//               Designation: {profile.designation.name}
//             </Typography>
//             <Typography>
//               Team: {profile.team?.name ?? 'No team'}
//             </Typography>
//             <Typography>Code: {profile.employeeCode}</Typography>
//             <Typography>
//               Joined:{' '}
//               {dayjs(profile.joiningDate).format('DD MMM YYYY')}
//             </Typography>
//           </Paper>
//         </Grid>

//         {/* ─── Weekly Calendar ─── */}
//         <Grid size={{ xs: 12 }}>
//           <Paper sx={{ p: 3 }}>
//             <Box
//               sx={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//                 mb: 2,
//               }}
//             >
//               <IconButton onClick={() => setWeekOffset((w) => w - 1)}>
//                 <ChevronLeftIcon />
//               </IconButton>
//               <Typography variant="subtitle1" fontWeight={600}>
//                 Week of {weekStart.format('DD MMM')} –{' '}
//                 {weekStart.add(6, 'day').format('DD MMM YYYY')}
//               </Typography>
//               <IconButton
//                 onClick={() => setWeekOffset((w) => w + 1)}
//                 disabled={weekOffset >= 0}
//               >
//                 <ChevronRightIcon />
//               </IconButton>
//             </Box>

//             {weekLoading ? (
//               <LinearProgress />
//             ) : (
//               <Box
//                 sx={{
//                   display: 'grid',
//                   gridTemplateColumns: {
//                     xs: 'repeat(2, 1fr)',
//                     sm: 'repeat(4, 1fr)',
//                     md: 'repeat(7, 1fr)',
//                   },
//                   gap: 1,
//                 }}
//               >
//                 {Array.from({ length: 7 }).map((_, i) => {
//                   const date = weekStart.add(i, 'day')
//                   const dateStr = date.format('YYYY-MM-DD')
//                   const dayData = weekDays.find(
//                     (d) => d.date.slice(0, 10) === dateStr
//                   )
//                   const holiday = holidays.find(
//                     (h) =>
//                       dayjs(h.date).format('YYYY-MM-DD') === dateStr
//                   )
//                   const isWeekend = date.day() === 0 || date.day() === 6
//                   const isToday = date.isSame(dayjs(), 'day')

//                   return (
//                     <Paper
//                       key={i}
//                       elevation={isToday ? 3 : 0}
//                       sx={{
//                         p: 1.5,
//                         textAlign: 'center',
//                         bgcolor: isToday
//                           ? 'primary.main'
//                           : holiday
//                             ? 'info.light'
//                             : isWeekend
//                               ? 'action.hover'
//                               : 'background.paper',
//                         color: isToday ? 'primary.contrastText' : 'text.primary',
//                         border: '1px solid',
//                         borderColor: 'divider',
//                         borderRadius: 1,
//                       }}
//                     >
//                       <Typography variant="caption" display="block">
//                         {date.format('ddd')}
//                       </Typography>
//                       <Typography variant="body2" fontWeight={600}>
//                         {date.format('DD')}
//                       </Typography>

//                       {holiday ? (
//                         <Typography
//                           variant="caption"
//                           color={isToday ? 'inherit' : 'info.main'}
//                         >
//                           🎉 {holiday.name}
//                         </Typography>
//                       ) : dayData ? (
//                         <>
//                           <Chip
//                             label={dayData.status}
//                             size="small"
//                             sx={{ mt: 0.5, fontSize: '0.65rem' }}
//                             color={
//                               dayData.status === 'PRESENT'
//                                 ? 'success'
//                                 : dayData.status === 'LEAVE'
//                                   ? 'info'
//                                   : dayData.status === 'PARTIAL'
//                                     ? 'warning'
//                                     : 'default'
//                             }
//                           />
//                           <Typography variant="caption" display="block">
//                             {formatHours(dayData.totalMinutes)}
//                           </Typography>
//                         </>
//                       ) : isWeekend ? (
//                         <Typography variant="caption" color="text.secondary">
//                           Weekend
//                         </Typography>
//                       ) : (
//                         <Typography variant="caption" color="text.secondary">
//                           —
//                         </Typography>
//                       )}
//                     </Paper>
//                   )
//                 })}
//               </Box>
//             )}
//           </Paper>
//         </Grid>

//         {/* ─── Leave Balances ─── */}
//         <Grid size={{ xs: 12, md: 6 }}>
//           <Paper sx={{ p: 3 }}>
//             <Box
//               sx={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//                 mb: 2,
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight={600}>
//                 Leave Balances
//               </Typography>
//               <Button
//                 size="small"
//                 startIcon={<AddIcon />}
//                 onClick={() => setLeaveModalOpen(true)}
//               >
//                 Apply Leave
//               </Button>
//             </Box>

//             {balances.length === 0 ? (
//               <Typography color="text.secondary">
//                 No leave balances configured
//               </Typography>
//             ) : (
//               balances.map((b) => (
//                 <Box
//                   key={b.id}
//                   sx={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                     mb: 1.5,
//                   }}
//                 >
//                   <Box>
//                     <Typography variant="body2">
//                       {b.leaveType.name}
//                     </Typography>
//                     <Typography variant="caption" color="text.secondary">
//                       {b.leaveType.code}
//                     </Typography>
//                   </Box>
//                   <Box sx={{ textAlign: 'right' }}>
//                     <Typography variant="body2" fontWeight={600}>
//                       {b.remaining} / {b.allocated}
//                     </Typography>
//                     <LinearProgress
//                       variant="determinate"
//                       value={
//                         b.allocated > 0
//                           ? (b.remaining / b.allocated) * 100
//                           : 0
//                       }
//                       sx={{ width: 80, height: 4, borderRadius: 2 }}
//                     />
//                   </Box>
//                 </Box>
//               ))
//             )}
//           </Paper>
//         </Grid>

//         {/* ─── Upcoming Holidays ─── */}
//         <Grid size={{ xs: 12, md: 6 }}>
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} mb={2}>
//               Upcoming Holidays
//             </Typography>
//             {upcomingHolidays.length === 0 ? (
//               <Typography color="text.secondary">
//                 No upcoming holidays
//               </Typography>
//             ) : (
//               upcomingHolidays.map((h) => (
//                 <Box
//                   key={h.id}
//                   sx={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     mb: 1,
//                   }}
//                 >
//                   <Typography variant="body2">{h.name}</Typography>
//                   <Typography variant="body2" color="text.secondary">
//                     {dayjs(h.date).format('DD MMM YYYY')}
//                   </Typography>
//                 </Box>
//               ))
//             )}
//           </Paper>
//         </Grid>

//         {/* ─── Manager & Hierarchy ─── */}
//         <Grid size={{ xs: 12, md: 4 }}>
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} mb={2}>
//               Reporting Manager
//             </Typography>
//             {hierarchy.manager ? (
//               <>
//                 <Typography>{hierarchy.manager.displayName}</Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   {hierarchy.manager.designation.name}
//                 </Typography>
//               </>
//             ) : (
//               <Typography color="text.secondary">
//                 No reporting manager
//               </Typography>
//             )}
//           </Paper>
//         </Grid>

//         <Grid size={{ xs: 12, md: 4 }}>
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} mb={2}>
//               My Team ({hierarchy.peers.length})
//             </Typography>
//             {hierarchy.peers.length === 0 ? (
//               <Typography color="text.secondary">
//                 No teammates
//               </Typography>
//             ) : (
//               hierarchy.peers.slice(0, 5).map((p) => (
//                 <Box key={p.id} mb={1}>
//                   <Typography variant="body2">
//                     {p.displayName}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     {p.designation.name}
//                   </Typography>
//                 </Box>
//               ))
//             )}
//           </Paper>
//         </Grid>

//         <Grid size={{ xs: 12, md: 4 }}>
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} mb={2}>
//               My Reportees ({hierarchy.reportees.length})
//             </Typography>
//             {hierarchy.reportees.length === 0 ? (
//               <Typography color="text.secondary">
//                 No direct reportees
//               </Typography>
//             ) : (
//               hierarchy.reportees.map((r) => (
//                 <Box key={r.id} mb={1}>
//                   <Typography variant="body2">
//                     {r.displayName}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     {r.designation.name}
//                   </Typography>
//                 </Box>
//               ))
//             )}
//           </Paper>
//         </Grid>

//         {/* ─── My Leave Requests ─── */}
//         <Grid size={{ xs: 12 }}>
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="subtitle1" fontWeight={600} mb={2}>
//               My Leave Requests
//             </Typography>
//             <LeaveRequestList
//               requests={requests}
//               loading={requestsLoading}
//               onCancel={async (id) => {
//                 try {
//                   const { leaveApi } = await import('../api/leave.api')
//                   await leaveApi.cancel(id)
//                   toast.success('Leave cancelled')
//                   reloadRequests()
//                   reloadBalances()
//                 } catch {
//                   toast.error('Failed to cancel')
//                 }
//               }}
//             />
//           </Paper>
//         </Grid>
//       </Grid>

//       {/* ─── Apply Leave Modal ─── */}
//       <ApplyLeaveModal
//         open={leaveModalOpen}
//         onClose={() => setLeaveModalOpen(false)}
//         onSuccess={() => {
//           setLeaveModalOpen(false)
//           reloadRequests()
//           reloadBalances()
//           toast.success('Leave applied!')
//         }}
//       />
//     </Box>
//   )
// }

// export default EmployeeDashboard