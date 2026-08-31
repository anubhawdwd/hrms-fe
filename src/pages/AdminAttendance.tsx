// src/pages/AdminAttendance.tsx
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Tabs,
  Tab,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EditCalendarIcon from '@mui/icons-material/EditCalendar'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import RefreshIcon from '@mui/icons-material/Refresh'
import SettingsIcon from '@mui/icons-material/Settings'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SearchIcon from '@mui/icons-material/Search'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import EditIcon from '@mui/icons-material/Edit'
import TimerIcon from '@mui/icons-material/Timer'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

import { attendanceApi } from '../api/attendance.api'
import { useEmployeeList } from '../hooks/useEmployee'
import type {
  AttendanceViolation,
  AttendanceDay,
  AttendanceEvent,
} from '../types/attendance.types'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import EmployeeAutocomplete from '../components/EmployeeAutocomplete'

function getTodayDateIST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatDurationHMS(minutes: number): string {
  if (!minutes || minutes <= 0) return '00:00:00'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const s = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDateTimeIST(isoStr?: string | null): string {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    return (
      d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
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

function formatTimeOnly(isoStr?: string | null): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    // Convert to IST HH:mm
    const istStr = d.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return istStr
  } catch {
    return ''
  }
}

function combineDateAndTime(dateStr: string, timeStr: string): string | undefined {
  if (!dateStr || !timeStr) return undefined
  try {
    const [hh, mm] = timeStr.split(':').map(Number)
    const [y, m, d] = dateStr.split('-').map(Number)
    // Interpret as IST (UTC - 5:30)
    const utcMillis = Date.UTC(y!, m! - 1, d!, hh!, mm!, 0, 0) - (5 * 60 + 30) * 60 * 1000
    return new Date(utcMillis).toISOString()
  } catch {
    return undefined
  }
}

function calculateMinutes(timeIn: string, timeOut: string): number {
  if (!timeIn || !timeOut) return 0
  const [h1, m1] = timeIn.split(':').map(Number)
  const [h2, m2] = timeOut.split(':').map(Number)
  const totalIn = h1 * 60 + m1
  const totalOut = h2 * 60 + m2
  return Math.max(totalOut - totalIn, 0)
}

const AdminAttendance = () => {
  const navigate = useNavigate()
  const { employees, loading: employeesLoading } = useEmployeeList()

  // Tab State
  const [currentTab, setCurrentTab] = useState(0)

  // ─── TAB 0: VIOLATIONS STATE ───
  const [violations, setViolations] = useState<AttendanceViolation[]>([])
  const [violationsLoading, setViolationsLoading] = useState(true)
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('')
  const [filterFromDate, setFilterFromDate] = useState<string>('')
  const [filterToDate, setFilterToDate] = useState<string>('')

  // ─── TAB 1: MANUAL ATTENDANCE DAY STATE ───
  const [dayEmployeeId, setDayEmployeeId] = useState<string>('')
  const [dayDate, setDayDate] = useState<string>(getTodayDateIST())
  const [recordLoading, setRecordLoading] = useState<boolean>(false)
  const [loadedRecord, setLoadedRecord] = useState<AttendanceDay | null>(null)
  const [recordChecked, setRecordChecked] = useState<boolean>(false)

  // Form edit/create state (Time-based editing)
  const [checkInTime, setCheckInTime] = useState<string>('09:00')
  const [checkOutTime, setCheckOutTime] = useState<string>('18:00')
  const [dayStatus, setDayStatus] = useState<'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'>('PRESENT')
  const [dayReason, setDayReason] = useState<string>('')
  const [daySaving, setDaySaving] = useState<boolean>(false)
  const [lastDaySaved, setLastDaySaved] = useState<AttendanceDay | null>(null)

  // ─── TAB 2: MANUAL ATTENDANCE EVENT STATE ───
  const [eventEmployeeId, setEventEmployeeId] = useState<string>('')
  const [eventDate, setEventDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [eventType, setEventType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN')
  const [eventTimestamp, setEventTimestamp] = useState<string>(
    dayjs().format('YYYY-MM-DDTHH:mm')
  )
  const [eventSource, setEventSource] = useState<'WEB' | 'PWA'>('WEB')
  const [eventReason, setEventReason] = useState<string>('')
  const [eventSaving, setEventSaving] = useState<boolean>(false)
  const [lastEventSaved, setLastEventSaved] = useState<AttendanceEvent | null>(null)

  // Helper map for employee display names
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e.displayName])), [employees])

  // Calculated presence duration preview for Tab 1
  const calculatedDuration = useMemo(() => {
    if (!checkInTime || !checkOutTime) return { minutes: 0, formatted: '—', isInvalid: false }
    const mins = calculateMinutes(checkInTime, checkOutTime)
    const [h1, m1] = checkInTime.split(':').map(Number)
    const [h2, m2] = checkOutTime.split(':').map(Number)
    const isInvalid = h2 * 60 + m2 < h1 * 60 + m1

    const formatted = formatDurationHMS(mins)
    return { minutes: mins, formatted, isInvalid }
  }, [checkInTime, checkOutTime])

  // Load violations
  const loadViolations = useCallback(async () => {
    setViolationsLoading(true)
    try {
      const data = await attendanceApi.getViolations({
        employeeId: filterEmployeeId || undefined,
        from: filterFromDate || undefined,
        to: filterToDate || undefined,
      })
      setViolations(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load violations')
      setViolations([])
    } finally {
      setViolationsLoading(false)
    }
  }, [filterEmployeeId, filterFromDate, filterToDate])

  useEffect(() => {
    if (currentTab === 0) {
      loadViolations()
    }
  }, [currentTab, loadViolations])

  // Handle Loading Attendance Record for Employee + Date
  const handleLoadAttendanceRecord = async () => {
    if (!dayEmployeeId) {
      toast.error('Please select an employee first')
      return
    }
    if (!dayDate) {
      toast.error('Please select a date')
      return
    }

    setRecordLoading(true)
    setRecordChecked(false)
    setLoadedRecord(null)

    try {
      const record = await attendanceApi.getDay(dayDate, dayEmployeeId)
      setLoadedRecord(record)
      setRecordChecked(true)

      if (record) {
        setDayStatus(record.status)

        // Extract check-in and check-out from events
        const inEvt = record.events?.find((e) => e.type === 'CHECK_IN')
        const outEvt = record.events?.filter((e) => e.type === 'CHECK_OUT').at(-1)

        if (inEvt) {
          setCheckInTime(formatTimeOnly(inEvt.timestamp))
        } else {
          setCheckInTime('09:00')
        }

        if (outEvt) {
          setCheckOutTime(formatTimeOnly(outEvt.timestamp))
        } else {
          setCheckOutTime('18:00')
        }

        toast.success('Existing attendance record found!')
      } else {
        setDayStatus('PRESENT')
        setCheckInTime('09:00')
        setCheckOutTime('18:00')
        toast('No existing attendance record for this date.', { icon: 'ℹ️' })
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to check attendance record')
    } finally {
      setRecordLoading(false)
    }
  }

  // Handle Saving Attendance (PATCH if existing, POST/upsert if new)
  const handleSaveAttendanceRecord = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dayEmployeeId) {
      toast.error('Please select an employee')
      return
    }
    if (!dayDate) {
      toast.error('Please select a date')
      return
    }

    const todayStr = getTodayDateIST()
    if (dayDate > todayStr) {
      toast.error('Cannot create or modify attendance for a future date')
      return
    }

    if (calculatedDuration.isInvalid) {
      toast.error('Check-out time cannot be earlier than check-in time')
      return
    }

    const checkInISO = combineDateAndTime(dayDate, checkInTime)
    const checkOutISO = combineDateAndTime(dayDate, checkOutTime)

    const nowTime = Date.now()
    if (checkInISO && new Date(checkInISO).getTime() > nowTime) {
      toast.error('Check-in time cannot be in the future')
      return
    }
    if (checkOutISO && new Date(checkOutISO).getTime() > nowTime) {
      toast.error('Check-out time cannot be in the future')
      return
    }

    setDaySaving(true)
    try {
      if (loadedRecord && loadedRecord.id) {
        // Update existing record using internal UUID
        const result = await attendanceApi.hrUpdateAttendanceDay(loadedRecord.id, {
          status: dayStatus,
          checkIn: checkInISO,
          checkOut: checkOutISO,
          reason: dayReason.trim() || undefined,
        })
        setLoadedRecord(result)
        setLastDaySaved(result)
        toast.success('Attendance record updated successfully!')
      } else {
        // Create / Upsert new record
        if (!dayReason.trim()) {
          toast.error('Please provide an administrative reason')
          setDaySaving(false)
          return
        }

        const result = await attendanceApi.hrUpsertAttendanceDay({
          employeeId: dayEmployeeId,
          date: dayDate,
          checkIn: checkInISO,
          checkOut: checkOutISO,
          status: dayStatus,
          reason: dayReason.trim(),
        })
        setLoadedRecord(result)
        setLastDaySaved(result)
        toast.success('Attendance record created successfully!')
        setDayReason('')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save attendance record')
    } finally {
      setDaySaving(false)
    }
  }

  // Handle Manual Attendance Event Add
  const handleAddAttendanceEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventEmployeeId) {
      toast.error('Please select an employee')
      return
    }
    if (!eventDate) {
      toast.error('Please select a date')
      return
    }
    if (!eventTimestamp) {
      toast.error('Please specify the event timestamp')
      return
    }
    if (!eventReason.trim()) {
      toast.error('Please provide an audit reason')
      return
    }

    setEventSaving(true)
    try {
      const result = await attendanceApi.hrAddAttendanceEvent({
        employeeId: eventEmployeeId,
        date: eventDate,
        type: eventType,
        timestamp: new Date(eventTimestamp).toISOString(),
        source: eventSource,
        reason: eventReason.trim(),
      })
      setLastEventSaved(result)
      toast.success(
        `${eventType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} event logged successfully!`
      )
      setEventReason('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to log attendance event')
    } finally {
      setEventSaving(false)
    }
  }

  if (employeesLoading) {
    return <LoadingState message="Loading employees and attendance administration..." />
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4 }}>
      <PageHeader
        title="Attendance Administration"
        subtitle="Manage employee attendance violations, manual day adjustments, and audit events"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Attendance Administration' },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/admin/geo-settings')}
          >
            Workplace & Geo Settings
          </Button>
        }
      />

      {/* Tabs Header */}
      <Paper elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<WarningAmberIcon />}
            iconPosition="start"
            label="Geo-Fence Violations"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            icon={<EditCalendarIcon />}
            iconPosition="start"
            label="Manual Day Adjustments"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            icon={<AccessTimeIcon />}
            iconPosition="start"
            label="Log Punch Event"
            sx={{ fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {/* ─── TAB 0: VIOLATIONS ─── */}
      {currentTab === 0 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          {/* Filters Bar */}
          <Grid container spacing={2} alignItems="center" mb={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <EmployeeAutocomplete
                value={filterEmployeeId}
                onChange={(id) => setFilterEmployeeId(id)}
                employees={employees}
                label="Filter by Employee (Optional)"
                placeholder="Type name, code, or email..."
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="From Date"
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="To Date"
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadViolations}
                disabled={violationsLoading}
                fullWidth
                sx={{ height: 56 }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>

          {/* Violations Table */}
          {violationsLoading ? (
            <LoadingState message="Loading attendance violations..." />
          ) : violations.length === 0 ? (
            <EmptyState
              title="No Violations Found"
              subtitle="No attendance geo-fencing violations match the selected filters."
            />
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason / Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Distance Beyond Office</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {violations.map((v) => (
                    <TableRow key={v.id} hover>
                      <TableCell>{formatDateTimeIST(v.createdAt)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {employeeMap.get(v.employeeId) || v.employeeId}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.reason}
                          color={v.reason.includes('OUTSIDE') ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {v.distanceM ? `${Math.round(v.distanceM)} meters` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip label={v.source} variant="outlined" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ─── TAB 1: MANUAL ATTENDANCE DAY ADJUSTMENTS ─── */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          {/* Left Column: Form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                Lookup & Adjust Attendance Record
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2.5}>
                Select an employee and date to inspect existing records, or enter check-in and check-out times to record/adjust attendance.
              </Typography>

              {/* Step 1: Employee & Date Selector */}
              <Grid container spacing={2} mb={2.5}>
                <Grid size={{ xs: 12 }}>
                  <EmployeeAutocomplete
                    value={dayEmployeeId}
                    onChange={(id) => {
                      setDayEmployeeId(id)
                      setRecordChecked(false)
                      setLoadedRecord(null)
                    }}
                    employees={employees}
                    label="Select Employee"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    label="Attendance Date"
                    type="date"
                    value={dayDate}
                    onChange={(e) => {
                      setDayDate(e.target.value)
                      setRecordChecked(false)
                      setLoadedRecord(null)
                    }}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: getTodayDateIST() }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Button
                    variant="outlined"
                    startIcon={recordLoading ? <CircularProgress size={18} /> : <SearchIcon />}
                    onClick={handleLoadAttendanceRecord}
                    disabled={recordLoading || !dayEmployeeId}
                    fullWidth
                    sx={{ height: 56 }}
                  >
                    {recordLoading ? 'Loading...' : 'Load Record'}
                  </Button>
                </Grid>
              </Grid>

              {/* Step 2: Edit Form (Visible after checking or always editable) */}
              {recordChecked && (
                <Box component="form" onSubmit={handleSaveAttendanceRecord}>
                  <Divider sx={{ my: 2.5 }} />

                  <Alert
                    severity={loadedRecord ? 'info' : 'warning'}
                    sx={{ mb: 2.5, borderRadius: 1.5 }}
                  >
                    {loadedRecord
                      ? 'Existing record loaded. Adjust the check-in / check-out times and status below.'
                      : 'No existing attendance record for this date. Enter times below to create one.'}
                  </Alert>

                  <Grid container spacing={2}>
                    {/* Check-In Time */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Check-In Time"
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        fullWidth
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 60 }}
                      />
                    </Grid>

                    {/* Check-Out Time */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Check-Out Time"
                        type="time"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        fullWidth
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 60 }}
                      />
                    </Grid>

                    {/* Presence Duration Preview Box */}
                    <Grid size={{ xs: 12 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: calculatedDuration.isInvalid ? 'error.50' : 'grey.50',
                          borderColor: calculatedDuration.isInvalid ? 'error.main' : 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        <TimerIcon color={calculatedDuration.isInvalid ? 'error' : 'primary'} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Calculated Presence Duration
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={calculatedDuration.isInvalid ? 'error.main' : 'text.primary'}
                          >
                            {calculatedDuration.isInvalid
                              ? 'Invalid times: Check-out must be after Check-in'
                              : calculatedDuration.formatted}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Status Selector */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label="Attendance Status"
                        value={dayStatus}
                        onChange={(e) => setDayStatus(e.target.value as any)}
                        fullWidth
                        required
                      >
                        <MenuItem value="PRESENT">PRESENT (Full Day)</MenuItem>
                        <MenuItem value="PARTIAL">PARTIAL (Short Day)</MenuItem>
                        <MenuItem value="ABSENT">ABSENT</MenuItem>
                        <MenuItem value="LEAVE">LEAVE</MenuItem>
                      </TextField>
                    </Grid>

                    {/* Administrative Reason */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={loadedRecord ? 'Adjustment Reason (Optional)' : 'Creation Reason (Required)'}
                        value={dayReason}
                        onChange={(e) => setDayReason(e.target.value)}
                        fullWidth
                        required={!loadedRecord}
                        placeholder="e.g. Approved manual check-in correction"
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={daySaving || calculatedDuration.isInvalid}
                        startIcon={
                          daySaving ? (
                            <CircularProgress size={18} />
                          ) : loadedRecord ? (
                            <EditIcon />
                          ) : (
                            <AddCircleOutlineIcon />
                          )
                        }
                        sx={{ mt: 1 }}
                      >
                        {daySaving
                          ? 'Saving Attendance...'
                          : loadedRecord
                            ? 'Update Attendance Record'
                            : 'Create Attendance Record'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Column: Preview / Saved Card */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                  Attendance Record Summary
                </Typography>
                {lastDaySaved ? (
                  <Stack spacing={1.5}>
                    <Alert severity="success" sx={{ borderRadius: 1.5 }}>
                      Attendance day successfully saved!
                    </Alert>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Employee</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {employeeMap.get(dayEmployeeId) || dayEmployeeId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Date</Typography>
                      <Typography variant="body2">{dayjs(lastDaySaved.date).format('DD MMM YYYY')}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Check-In</Typography>
                      <Typography variant="body2">
                        {formatTimeOnly(lastDaySaved.events?.find((e) => e.type === 'CHECK_IN')?.timestamp) || checkInTime || '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Check-Out</Typography>
                      <Typography variant="body2">
                        {formatTimeOnly(lastDaySaved.events?.filter((e) => e.type === 'CHECK_OUT').at(-1)?.timestamp) || checkOutTime || '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Box mt={0.5}>
                        <Chip
                          label={lastDaySaved.status}
                          color={
                            lastDaySaved.status === 'PRESENT'
                              ? 'success'
                              : lastDaySaved.status === 'PARTIAL'
                                ? 'warning'
                                : 'error'
                          }
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Presence Duration</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatDurationHMS(lastDaySaved.totalMinutes)}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select an employee and date, click <strong>Load Record</strong>, and enter actual check-in / check-out times. The system will calculate presence duration automatically.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ─── TAB 2: LOG ATTENDANCE EVENT ─── */}
      {currentTab === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                Inject Missing Attendance Event
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2.5}>
                Manually record a missing Check-In or Check-Out event for an employee when device failure or forgotten punch occurred.
              </Typography>

              <Box component="form" onSubmit={handleAddAttendanceEvent}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <EmployeeAutocomplete
                      value={eventEmployeeId}
                      onChange={(id) => setEventEmployeeId(id)}
                      employees={employees}
                      label="Select Employee"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Attendance Date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: getTodayDateIST() }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="Event Type"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as any)}
                      fullWidth
                      required
                    >
                      <MenuItem value="CHECK_IN">CHECK_IN (Punch In)</MenuItem>
                      <MenuItem value="CHECK_OUT">CHECK_OUT (Punch Out)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Punch Timestamp"
                      type="datetime-local"
                      value={eventTimestamp}
                      onChange={(e) => setEventTimestamp(e.target.value)}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="Source"
                      value={eventSource}
                      onChange={(e) => setEventSource(e.target.value as any)}
                      fullWidth
                    >
                      <MenuItem value="WEB">WEB</MenuItem>
                      <MenuItem value="PWA">PWA</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Audit Reason"
                      value={eventReason}
                      onChange={(e) => setEventReason(e.target.value)}
                      fullWidth
                      required
                      placeholder="e.g. Employee forgot to punch out before leaving office premises"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={eventSaving}
                      startIcon={eventSaving ? <CircularProgress size={18} /> : <CheckCircleOutlineIcon />}
                    >
                      {eventSaving ? 'Logging Event...' : 'Log Attendance Event'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Right Preview Card */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                  Last Logged Event
                </Typography>
                {lastEventSaved ? (
                  <Stack spacing={1.5}>
                    <Alert severity="success" sx={{ borderRadius: 1.5 }}>
                      Event logged successfully!
                    </Alert>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Employee</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {employeeMap.get(eventEmployeeId) || eventEmployeeId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Type</Typography>
                      <Box mt={0.5}>
                        <Chip
                          label={lastEventSaved.type}
                          color={lastEventSaved.type === 'CHECK_IN' ? 'success' : 'info'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                      <Typography variant="body2">{formatDateTimeIST(lastEventSaved.timestamp)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Source</Typography>
                      <Typography variant="body2">{lastEventSaved.source}</Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Submit the form to the left to inject and confirm an attendance event log entry.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default AdminAttendance
