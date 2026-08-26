// src/pages/AdminAttendance.tsx
import { useCallback, useEffect, useState } from 'react'
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
  const [dayDate, setDayDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [recordLoading, setRecordLoading] = useState<boolean>(false)
  const [loadedRecord, setLoadedRecord] = useState<AttendanceDay | null>(null)
  const [recordChecked, setRecordChecked] = useState<boolean>(false)

  // Form edit/create state
  const [dayStatus, setDayStatus] = useState<'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'>('PRESENT')
  const [dayTotalMinutes, setDayTotalMinutes] = useState<string>('480')
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
  const employeeMap = new Map(employees.map((e) => [e.id, e.displayName]))

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
        setDayTotalMinutes(String(record.totalMinutes ?? 0))
        toast.success('Existing attendance record found!')
      } else {
        setDayStatus('PRESENT')
        setDayTotalMinutes('480')
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

    const minutesNum = parseInt(dayTotalMinutes, 10) || 0

    setDaySaving(true)
    try {
      if (loadedRecord && loadedRecord.id) {
        // Update existing record using internal UUID
        const result = await attendanceApi.hrUpdateAttendanceDay(loadedRecord.id, {
          status: dayStatus,
          totalMinutes: minutesNum,
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
          status: dayStatus,
          totalMinutes: minutesNum,
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
        subtitle="Review location violations, adjust employee daily attendance, and record missing punch events"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Attendance' },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/admin/geo-settings')}
            size="small"
          >
            Geo-Fencing Settings
          </Button>
        }
      />

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newVal) => setCurrentTab(newVal)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<WarningAmberIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Geo-Fence Violations
                {violations.length > 0 && (
                  <Chip
                    label={violations.length}
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            icon={<EditCalendarIcon />}
            iconPosition="start"
            label="Manual Attendance Day"
          />
          <Tab
            icon={<AccessTimeIcon />}
            iconPosition="start"
            label="Log Attendance Event"
          />
        </Tabs>
      </Paper>

      {/* ─── TAB 0: VIOLATIONS ─── */}
      {currentTab === 0 && (
        <Box>
          {/* Filter Bar */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
              Filter Violations
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Employee"
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.displayName} ({emp.employeeCode})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="From Date"
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="To Date"
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={() => loadViolations()}
                  disabled={violationsLoading}
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Violations Table */}
          {violationsLoading ? (
            <LoadingState message="Loading violations log..." />
          ) : violations.length === 0 ? (
            <EmptyState
              title="No Geo-Fence Violations Found"
              subtitle="All check-in and check-out attempts were compliant with company perimeter rules."
            />
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Distance</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>GPS Coordinates</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {violations.map((v) => (
                    <TableRow key={v.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(v.createdAt).format('DD MMM YYYY, hh:mm A')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {employeeMap.get(v.employeeId) || v.employeeId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.reason === 'OUTSIDE_RADIUS' ? 'Outside Perimeter' : v.reason}
                          color={v.reason === 'OUTSIDE_RADIUS' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {v.distanceM ? `${Math.round(v.distanceM).toLocaleString()} m` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.source}
                          variant="outlined"
                          size="small"
                          color={v.source === 'WEB' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ─── TAB 1: MANUAL ATTENDANCE DAY (HR LOOKUP & EDIT) ─── */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            {/* Step 1: Select Employee & Date */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                1. Select Employee & Date
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2.5}>
                Choose the employee and target date to inspect or modify their attendance record.
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    label="Select Employee"
                    value={dayEmployeeId}
                    onChange={(e) => {
                      setDayEmployeeId(e.target.value)
                      setRecordChecked(false)
                      setLoadedRecord(null)
                    }}
                    fullWidth
                    required
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.displayName} (Code: {emp.employeeCode})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Date"
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
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={recordLoading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                    onClick={handleLoadAttendanceRecord}
                    disabled={recordLoading || !dayEmployeeId || !dayDate}
                  >
                    {recordLoading ? 'Checking Attendance...' : 'Load Attendance Record'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Step 2: Edit or Create Form (Shown after checking) */}
            {recordChecked && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                {loadedRecord ? (
                  <Alert severity="info" sx={{ mb: 2.5, borderRadius: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Existing Attendance Record Loaded
                    </Typography>
                    <Typography variant="body2">
                      Current Status: <strong>{loadedRecord.status}</strong> • Total Minutes: <strong>{loadedRecord.totalMinutes} mins</strong> ({Math.floor(loadedRecord.totalMinutes / 60)} hrs {loadedRecord.totalMinutes % 60} mins)
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      No Attendance Record Found
                    </Typography>
                    <Typography variant="body2">
                      No record exists for {employeeMap.get(dayEmployeeId)} on {dayjs(dayDate).format('DD MMM YYYY')}. You can create one below.
                    </Typography>
                  </Alert>
                )}

                <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                  {loadedRecord ? '2. Update Attendance Record' : '2. Create Attendance Record'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {loadedRecord
                    ? 'Adjust the attendance status and total minutes for this day.'
                    : 'Provide the attendance status, total working minutes, and administrative note.'}
                </Typography>

                <Box component="form" onSubmit={handleSaveAttendanceRecord}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label="Attendance Status"
                        value={dayStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value as any
                          setDayStatus(newStatus)
                          if (newStatus === 'PRESENT' && !loadedRecord) setDayTotalMinutes('480')
                          else if (newStatus === 'PARTIAL' && !loadedRecord) setDayTotalMinutes('240')
                          else if ((newStatus === 'ABSENT' || newStatus === 'LEAVE') && !loadedRecord)
                            setDayTotalMinutes('0')
                        }}
                        fullWidth
                        required
                      >
                        <MenuItem value="PRESENT">PRESENT</MenuItem>
                        <MenuItem value="PARTIAL">PARTIAL</MenuItem>
                        <MenuItem value="ABSENT">ABSENT</MenuItem>
                        <MenuItem value="LEAVE">LEAVE</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Total Working Minutes"
                        type="number"
                        value={dayTotalMinutes}
                        onChange={(e) => setDayTotalMinutes(e.target.value)}
                        fullWidth
                        helperText={`Equivalent: ${Math.floor((parseInt(dayTotalMinutes, 10) || 0) / 60)} hrs ${(parseInt(dayTotalMinutes, 10) || 0) % 60} mins`}
                      />
                    </Grid>

                    {!loadedRecord && (
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Administrative Reason / Audit Note"
                          value={dayReason}
                          onChange={(e) => setDayReason(e.target.value)}
                          fullWidth
                          required
                          placeholder="e.g. Approved manual attendance entry for client onsite visit"
                        />
                      </Grid>
                    )}

                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        color={loadedRecord ? 'primary' : 'success'}
                        disabled={daySaving}
                        startIcon={
                          daySaving ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : loadedRecord ? (
                            <EditIcon />
                          ) : (
                            <AddCircleOutlineIcon />
                          )
                        }
                      >
                        {daySaving
                          ? 'Saving...'
                          : loadedRecord
                            ? 'Update Attendance Record'
                            : 'Create Attendance Record'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            )}
          </Grid>

          {/* Right Preview Card */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                  Processed Record Details
                </Typography>
                {lastDaySaved ? (
                  <Stack spacing={1.5}>
                    <Alert severity="success" sx={{ borderRadius: 1.5 }}>
                      Attendance successfully saved!
                    </Alert>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Employee</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {employeeMap.get(lastDaySaved.employeeId) || lastDaySaved.employeeId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Date</Typography>
                      <Typography variant="body2">{dayjs(lastDaySaved.date).format('DD MMMM YYYY')}</Typography>
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
                      <Typography variant="caption" color="text.secondary">Total Working Minutes</Typography>
                      <Typography variant="body2">{lastDaySaved.totalMinutes} mins ({Math.floor(lastDaySaved.totalMinutes / 60)} hrs {lastDaySaved.totalMinutes % 60} mins)</Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select an employee and date, click <strong>Load Attendance Record</strong>, and make adjustments. The updated attendance details will appear here upon saving.
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
                    <TextField
                      select
                      label="Select Employee"
                      value={eventEmployeeId}
                      onChange={(e) => setEventEmployeeId(e.target.value)}
                      fullWidth
                      required
                    >
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.displayName} (Code: {emp.employeeCode}) — {emp.designation?.name}
                        </MenuItem>
                      ))}
                    </TextField>
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
                      <Typography variant="body2">{dayjs(lastEventSaved.timestamp).format('DD MMM YYYY, hh:mm A')}</Typography>
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
