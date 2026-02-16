import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  LinearProgress,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon from '@mui/icons-material/Add'
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

const EmployeeDashboard = () => {
  const { profile, hierarchy, loading, error, reload } = useMyProfile()
  const { balances, reload: reloadBalances } = useLeaveBalances(
    new Date().getFullYear()
  )
  const { checkIn, loading: checkingIn } = useCheckIn()
  const { checkOut, loading: checkingOut } = useCheckOut()
  const {
    day: todayAttendance,
    load: loadAttendance,
  } = useTodayAttendance()
  const { requests, loading: requestsLoading, reload: reloadRequests } =
    useMyLeaveRequests()
  const { holidays } = useHolidays()

  // Weekly calendar state
  const [weekOffset, setWeekOffset] = useState(0)
  const { days: weekDays, loading: weekLoading } =
    useWeeklyAttendance(weekOffset)

  // Live timer
  const [elapsedMinutes, setElapsedMinutes] = useState(0)

  // Leave modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  // Live working hours timer
  useEffect(() => {
    if (!todayAttendance?.events?.length) return

    const lastEvent = todayAttendance.events[todayAttendance.events.length - 1]
    if (lastEvent.type !== 'CHECK_IN') return

    const checkInTime = new Date(lastEvent.timestamp).getTime()

    const interval = setInterval(() => {
      const now = Date.now()
      const mins =
        todayAttendance.totalMinutes +
        Math.floor((now - checkInTime) / 60000)
      setElapsedMinutes(mins)
    }, 30000) // update every 30s

    // Initial calc
    const now = Date.now()
    setElapsedMinutes(
      todayAttendance.totalMinutes +
        Math.floor((now - checkInTime) / 60000)
    )

    return () => clearInterval(interval)
  }, [todayAttendance])

  if (loading) return <LoadingState message="Loading your dashboard…" />
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
      toast.success('Checked in!')
      loadAttendance()
    } catch (err: any) {
      toast.error(err?.message || 'Check-in failed')
    }
  }

  const handleCheckOut = async () => {
    try {
      await checkOut()
      toast.success('Checked out!')
      loadAttendance()
    } catch (err: any) {
      toast.error(err?.message || 'Check-out failed')
    }
  }

  const isCheckedIn =
    todayAttendance?.events?.length &&
    todayAttendance.events[todayAttendance.events.length - 1].type ===
      'CHECK_IN'

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
  }

  const weekStart = dayjs()
    .startOf('week')
    .add(weekOffset * 7, 'day')

  // Upcoming holidays (next 3)
  const upcomingHolidays = holidays
    .filter((h) => dayjs(h.date).isAfter(dayjs()))
    .slice(0, 3)

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Welcome, {profile.displayName}
      </Typography>

      <Grid container spacing={3}>
        {/* ─── Attendance Card ─── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Today's Attendance
            </Typography>

            {todayAttendance ? (
              <Box mb={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Chip
                    label={todayAttendance.status}
                    color={
                      todayAttendance.status === 'PRESENT'
                        ? 'success'
                        : todayAttendance.status === 'PARTIAL'
                          ? 'warning'
                          : todayAttendance.status === 'LEAVE'
                            ? 'info'
                            : 'default'
                    }
                  />
                  {isCheckedIn && (
                    <Typography variant="h6" color="primary">
                      {formatHours(elapsedMinutes)}
                    </Typography>
                  )}
                </Box>

                {/* Progress bar: 480 min = 8 hours target */}
                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    ((isCheckedIn ? elapsedMinutes : todayAttendance.totalMinutes) /
                      480) *
                      100,
                    100
                  )}
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatHours(
                    isCheckedIn
                      ? elapsedMinutes
                      : todayAttendance.totalMinutes
                  )}{' '}
                  / 8h 0m
                </Typography>
              </Box>
            ) : (
              <Typography color="text.secondary" mb={2}>
                No attendance recorded today
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleCheckIn}
                disabled={checkingIn || !!isCheckedIn}
              >
                {checkingIn ? 'Checking in...' : 'Check In'}
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={handleCheckOut}
                disabled={checkingOut || !isCheckedIn}
              >
                {checkingOut ? 'Checking out...' : 'Check Out'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* ─── Profile Card ─── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              My Profile
            </Typography>
            <Typography>Email: {profile.user.email}</Typography>
            <Typography>
              Designation: {profile.designation.name}
            </Typography>
            <Typography>
              Team: {profile.team?.name ?? 'No team'}
            </Typography>
            <Typography>Code: {profile.employeeCode}</Typography>
            <Typography>
              Joined:{' '}
              {dayjs(profile.joiningDate).format('DD MMM YYYY')}
            </Typography>
          </Paper>
        </Grid>

        {/* ─── Weekly Calendar ─── */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <IconButton onClick={() => setWeekOffset((w) => w - 1)}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="subtitle1" fontWeight={600}>
                Week of {weekStart.format('DD MMM')} –{' '}
                {weekStart.add(6, 'day').format('DD MMM YYYY')}
              </Typography>
              <IconButton
                onClick={() => setWeekOffset((w) => w + 1)}
                disabled={weekOffset >= 0}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>

            {weekLoading ? (
              <LinearProgress />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(4, 1fr)',
                    md: 'repeat(7, 1fr)',
                  },
                  gap: 1,
                }}
              >
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = weekStart.add(i, 'day')
                  const dateStr = date.format('YYYY-MM-DD')
                  const dayData = weekDays.find(
                    (d) => d.date.slice(0, 10) === dateStr
                  )
                  const holiday = holidays.find(
                    (h) =>
                      dayjs(h.date).format('YYYY-MM-DD') === dateStr
                  )
                  const isWeekend = date.day() === 0 || date.day() === 6
                  const isToday = date.isSame(dayjs(), 'day')

                  return (
                    <Paper
                      key={i}
                      elevation={isToday ? 3 : 0}
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        bgcolor: isToday
                          ? 'primary.main'
                          : holiday
                            ? 'info.light'
                            : isWeekend
                              ? 'action.hover'
                              : 'background.paper',
                        color: isToday ? 'primary.contrastText' : 'text.primary',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" display="block">
                        {date.format('ddd')}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {date.format('DD')}
                      </Typography>

                      {holiday ? (
                        <Typography
                          variant="caption"
                          color={isToday ? 'inherit' : 'info.main'}
                        >
                          🎉 {holiday.name}
                        </Typography>
                      ) : dayData ? (
                        <>
                          <Chip
                            label={dayData.status}
                            size="small"
                            sx={{ mt: 0.5, fontSize: '0.65rem' }}
                            color={
                              dayData.status === 'PRESENT'
                                ? 'success'
                                : dayData.status === 'LEAVE'
                                  ? 'info'
                                  : dayData.status === 'PARTIAL'
                                    ? 'warning'
                                    : 'default'
                            }
                          />
                          <Typography variant="caption" display="block">
                            {formatHours(dayData.totalMinutes)}
                          </Typography>
                        </>
                      ) : isWeekend ? (
                        <Typography variant="caption" color="text.secondary">
                          Weekend
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </Paper>
                  )
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ─── Leave Balances ─── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Leave Balances
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setLeaveModalOpen(true)}
              >
                Apply Leave
              </Button>
            </Box>

            {balances.length === 0 ? (
              <Typography color="text.secondary">
                No leave balances configured
              </Typography>
            ) : (
              balances.map((b) => (
                <Box
                  key={b.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      {b.leaveType.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {b.leaveType.code}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>
                      {b.remaining} / {b.allocated}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        b.allocated > 0
                          ? (b.remaining / b.allocated) * 100
                          : 0
                      }
                      sx={{ width: 80, height: 4, borderRadius: 2 }}
                    />
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* ─── Upcoming Holidays ─── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Upcoming Holidays
            </Typography>
            {upcomingHolidays.length === 0 ? (
              <Typography color="text.secondary">
                No upcoming holidays
              </Typography>
            ) : (
              upcomingHolidays.map((h) => (
                <Box
                  key={h.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">{h.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dayjs(h.date).format('DD MMM YYYY')}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* ─── Manager & Hierarchy ─── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Reporting Manager
            </Typography>
            {hierarchy.manager ? (
              <>
                <Typography>{hierarchy.manager.displayName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {hierarchy.manager.designation.name}
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                No reporting manager
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              My Team ({hierarchy.peers.length})
            </Typography>
            {hierarchy.peers.length === 0 ? (
              <Typography color="text.secondary">
                No teammates
              </Typography>
            ) : (
              hierarchy.peers.slice(0, 5).map((p) => (
                <Box key={p.id} mb={1}>
                  <Typography variant="body2">
                    {p.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.designation.name}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              My Reportees ({hierarchy.reportees.length})
            </Typography>
            {hierarchy.reportees.length === 0 ? (
              <Typography color="text.secondary">
                No direct reportees
              </Typography>
            ) : (
              hierarchy.reportees.map((r) => (
                <Box key={r.id} mb={1}>
                  <Typography variant="body2">
                    {r.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.designation.name}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* ─── My Leave Requests ─── */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              My Leave Requests
            </Typography>
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
          </Paper>
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