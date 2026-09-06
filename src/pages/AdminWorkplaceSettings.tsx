// src/pages/AdminWorkplaceSettings.tsx
import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Stack,
  Tabs,
  Tab,
  alpha,
} from '@mui/material'
import type { LeaveApprovalWorkflow } from '../types/organization.types'
import SaveIcon from '@mui/icons-material/Save'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DateRangeIcon from '@mui/icons-material/DateRange'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import toast from 'react-hot-toast'
import { organizationApi } from '../api/organization.api'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'

const RADIUS_PRESETS = [50, 100, 200, 500, 1000]

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h 00m`
  return `${h}h ${m < 10 ? '0' + m : m}m`
}

const AdminWorkplaceSettings = () => {
  const [activeTab, setActiveTab] = useState(0)

  // ─── Loading States ───
  const [loading, setLoading] = useState(true)
  const [savingGeo, setSavingGeo] = useState(false)
  const [savingHours, setSavingHours] = useState(false)
  const [locating, setLocating] = useState(false)

  // ─── Working Hours State ───
  const [workingMinutes, setWorkingMinutes] = useState(480)
  const [lunchMinutes, setLunchMinutes] = useState(30)
  const [breakMinutes, setBreakMinutes] = useState(20)
  const [graceMinutes, setGraceMinutes] = useState(10)

  // ─── Leave & Work Week Rules State ───
  const [workWeekDays, setWorkWeekDays] = useState<number>(5)
  const [sandwichRuleEnabled, setSandwichRuleEnabled] = useState<boolean>(false)
  const [leaveApprovalWorkflow, setLeaveApprovalWorkflow] = useState<LeaveApprovalWorkflow>("DIRECT_TO_HR")
  const [savingLeaveRules, setSavingLeaveRules] = useState<boolean>(false)

  // ─── Geo-Fencing State ───
  const [officeId, setOfficeId] = useState<string | null>(null)
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [radiusM, setRadiusM] = useState<string>('200')
  const [geoFencingEnabled, setGeoFencingEnabled] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const loadAllSettings = async () => {
    setLoading(true)
    try {
      const [officeData, hoursData] = await Promise.all([
        organizationApi.getOfficeLocation().catch(() => null),
        organizationApi.getWorkingHoursConfig().catch(() => null),
      ])

      if (officeData) {
        setOfficeId(officeData.id)
        setLatitude(officeData.latitude?.toString() || '')
        setLongitude(officeData.longitude?.toString() || '')
        setRadiusM(officeData.radiusM?.toString() || '200')
        setGeoFencingEnabled(Boolean(officeData.geoFencingEnabled))
        if (officeData.updatedAt) {
          setLastUpdated(new Date(officeData.updatedAt).toLocaleString())
        }
      }

      if (hoursData) {
        setWorkingMinutes(hoursData.workingMinutes ?? 480)
        setLunchMinutes(hoursData.lunchMinutes ?? 30)
        setBreakMinutes(hoursData.breakMinutes ?? 20)
        setGraceMinutes(hoursData.graceMinutes ?? 10)
        setWorkWeekDays(hoursData.workWeekDays ?? 5)
        setSandwichRuleEnabled(Boolean(hoursData.sandwichRuleEnabled))
        setLeaveApprovalWorkflow(hoursData.leaveApprovalWorkflow || "DIRECT_TO_HR")
      }
    } catch {
      toast.error('Failed to load organization settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllSettings()
  }, [])

  // ─── Leave Rules Save ───
  const handleSaveLeaveRules = async () => {
    try {
      setSavingLeaveRules(true)
      await organizationApi.updateWorkingHoursConfig({
        workWeekDays,
        sandwichRuleEnabled,
        leaveApprovalWorkflow,
      })
      toast.success('Leave & work week rules updated successfully')
    } catch (err: any) {
      console.error('Failed to update leave rules:', err)
      toast.error(err?.response?.data?.message || 'Failed to update leave rules')
    } finally {
      setSavingLeaveRules(false)
    }
  }

  // ─── Working Hours Save ───
  const handleSaveWorkingHours = async (e: React.FormEvent) => {
    e.preventDefault()

    if (workingMinutes < 60 || workingMinutes > 1440) {
      toast.error('Working hours must be between 60 minutes (1h) and 1440 minutes (24h)')
      return
    }

    setSavingHours(true)
    try {
      const updated = await organizationApi.updateWorkingHoursConfig({
        workingMinutes,
        lunchMinutes,
        breakMinutes,
        graceMinutes,
      })

      setWorkingMinutes(updated.workingMinutes)
      setLunchMinutes(updated.lunchMinutes)
      setBreakMinutes(updated.breakMinutes)
      setGraceMinutes(updated.graceMinutes)
      toast.success('Working hours configuration saved successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save working hours')
    } finally {
      setSavingHours(false)
    }
  }

  // ─── Geo-Fencing Save ───
  const handleSaveGeo = async (e: React.FormEvent) => {
    e.preventDefault()

    const latNum = parseFloat(latitude)
    const lngNum = parseFloat(longitude)
    const radNum = parseInt(radiusM, 10)

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.error('Invalid latitude (-90 to 90)')
      return
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.error('Invalid longitude (-180 to 180)')
      return
    }
    if (isNaN(radNum) || radNum <= 0) {
      toast.error('Radius must be greater than 0 meters')
      return
    }

    setSavingGeo(true)
    try {
      const payload = {
        latitude: latNum,
        longitude: lngNum,
        radiusM: radNum,
        geoFencingEnabled,
      }

      let result
      if (officeId) {
        result = await organizationApi.updateOfficeLocation(payload)
      } else {
        result = await organizationApi.setOfficeLocation(payload)
        setOfficeId(result.id)
      }

      setGeoFencingEnabled(Boolean(result.geoFencingEnabled))
      toast.success('Geo-fencing settings saved successfully!')
      setLastUpdated(new Date().toLocaleString())
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save location settings')
    } finally {
      setSavingGeo(false)
    }
  }

  // ─── Auto-Detect GPS Location ───
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
        setLocating(false)
        toast.success('Current location detected successfully!')
      },
      (error) => {
        setLocating(false)
        toast.error(`Unable to retrieve location: ${error.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  if (loading) {
    return <LoadingState message="Loading workplace settings..." />
  }

  const totalPresenceMinutes = workingMinutes + lunchMinutes + breakMinutes

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4 }}>
      <PageHeader
        title="Workplace & Attendance Settings"
        subtitle="Manage daily working hours, break schedules, and office geo-fencing premises"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Workplace Settings' },
        ]}
      />

      {/* ─── TABS HEADER (Scrollable & Responsive) ─── */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: '16px',
          mb: 3.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, sm: 2 },
            bgcolor: 'background.paper',
            '& .MuiTabs-scroller': {
              overflowX: 'auto !important',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              py: 2,
              minHeight: 56,
              gap: 1.25,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'action.hover',
              },
              '&.Mui-selected': {
                fontWeight: 700,
                color: 'primary.main',
              },
            },
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': { opacity: 0.25 },
              width: 40,
            },
          }}
        >
          <Tab icon={<AccessTimeIcon fontSize="small" />} iconPosition="start" label="Working Hours & Breaks" />
          <Tab icon={<DateRangeIcon fontSize="small" />} iconPosition="start" label="Leave & Attendance Policies" />
          <Tab icon={<LocationOnIcon fontSize="small" />} iconPosition="start" label="Office Geo-Fencing" />
        </Tabs>
      </Paper>

      {/* ─── TAB 0: Working Hours & Schedule ─── */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                Daily Working Hours & Break Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Set the company-wide standard actual work target, scheduled lunch/break allowances, and grace periods.
              </Typography>

              <Box component="form" onSubmit={handleSaveWorkingHours}>
                <Grid container spacing={2.5}>
                  {/* Working Hours */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Required Working Time (minutes)"
                      value={workingMinutes}
                      onChange={(e) => setWorkingMinutes(parseInt(e.target.value, 10) || 0)}
                      fullWidth
                      required
                      type="number"
                      inputProps={{ min: 60, max: 1440, step: 15 }}
                      helperText={`Actual work target: ${formatMinutes(workingMinutes)}`}
                      disabled={savingHours}
                    />
                  </Grid>

                  {/* Grace Period */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Grace Period (minutes)"
                      value={graceMinutes}
                      onChange={(e) => setGraceMinutes(parseInt(e.target.value, 10) || 0)}
                      fullWidth
                      required
                      type="number"
                      inputProps={{ min: 0, max: 120, step: 5 }}
                      helperText={`Allowed grace allowance: ${formatMinutes(graceMinutes)}`}
                      disabled={savingHours}
                    />
                  </Grid>

                  {/* Lunch Duration */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Lunch Duration (minutes)"
                      value={lunchMinutes}
                      onChange={(e) => setLunchMinutes(parseInt(e.target.value, 10) || 0)}
                      fullWidth
                      required
                      type="number"
                      inputProps={{ min: 0, max: 240, step: 5 }}
                      helperText={`Scheduled lunch: ${formatMinutes(lunchMinutes)} (non-working)`}
                      disabled={savingHours}
                    />
                  </Grid>

                  {/* Break Duration */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Break Duration (minutes)"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10) || 0)}
                      fullWidth
                      required
                      type="number"
                      inputProps={{ min: 0, max: 240, step: 5 }}
                      helperText={`Scheduled break: ${formatMinutes(breakMinutes)} (non-working)`}
                      disabled={savingHours}
                    />
                  </Grid>

                  {/* Quick Working Hours Presets */}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                      Standard Presets:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {[
                        { label: '8 Hours (Standard)', mins: 480 },
                        { label: '8.5 Hours', mins: 510 },
                        { label: '9 Hours', mins: 540 },
                        { label: '7.5 Hours', mins: 450 },
                      ].map((preset) => (
                        <Chip
                          key={preset.mins}
                          label={preset.label}
                          clickable
                          color={workingMinutes === preset.mins ? 'primary' : 'default'}
                          variant={workingMinutes === preset.mins ? 'filled' : 'outlined'}
                          onClick={() => setWorkingMinutes(preset.mins)}
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button variant="outlined" onClick={() => loadAllSettings()} disabled={savingHours}>
                        Reset Defaults
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={savingHours ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                        disabled={savingHours}
                      >
                        {savingHours ? 'Saving...' : 'Save Working Hours'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Schedule Breakdown Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Schedule Breakdown
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Actual Required Work
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="primary">
                    {formatMinutes(workingMinutes)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Scheduled Non-Working Time
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatMinutes(lunchMinutes)} (Lunch) + {formatMinutes(breakMinutes)} (Break) = {formatMinutes(lunchMinutes + breakMinutes)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Scheduled Office Presence
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {formatMinutes(totalPresenceMinutes)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Grace Period Allowance
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatMinutes(graceMinutes)}
                  </Typography>
                </Box>

                <Divider />

                <Alert severity="info" variant="outlined" sx={{ borderRadius: 1.5 }}>
                  <strong>Attendance Rule:</strong> An employee is marked <strong>PRESENT</strong> when total logged presence duration reaches <strong>{formatMinutes(Math.max(workingMinutes + lunchMinutes + breakMinutes - graceMinutes, 0))}</strong> (scheduled presence minus grace period, adjusted for partial leaves).
                </Alert>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

            {/* ─── TAB 1: Leave & Work Week Rules ─── */}
      {activeTab === 1 && (
        <Stack spacing={3}>
          {/* Work Week & Sandwich Policy Card */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <DateRangeIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Company Work Week & Sandwich Leave Policy
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure company-wide standard working days and whether sandwich rules apply when leaves bridge weekends or holidays.
            </Typography>

            <Grid container spacing={3}>
              {/* Working Week Setting */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: '10px',
                    height: '100%',
                    bgcolor: 'background.default',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    1. Standard Working Week
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Determines which days count as non-working weekends across attendance tracking and leave calculations.
                  </Typography>

                  <FormControl component="fieldset">
                    <RadioGroup
                      value={workWeekDays}
                      onChange={(e) => setWorkWeekDays(Number(e.target.value))}
                    >
                      <FormControlLabel
                        value={5}
                        control={<Radio size="small" />}
                        label={
                          <Box sx={{ ml: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              5-Day Work Week (Mon – Fri)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Saturday and Sunday are treated as weekends.
                            </Typography>
                          </Box>
                        }
                        sx={{ mb: 1.5 }}
                      />
                      <FormControlLabel
                        value={6}
                        control={<Radio size="small" />}
                        label={
                          <Box sx={{ ml: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              6-Day Work Week (Mon – Sat)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Saturday is a working day; only Sunday is a weekend.
                            </Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Paper>
              </Grid>

              {/* Sandwich Policy Setting */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: '10px',
                    height: '100%',
                    bgcolor: 'background.default',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    2. Company Sandwich Leave Rule
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    When enabled, any non-working days (weekends or public holidays) that fall between leave days are included in the total leave deduction.
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={sandwichRuleEnabled}
                        onChange={(e) => setSandwichRuleEnabled(e.target.checked)}
                        color="warning"
                      />
                    }
                    label={
                      <Box sx={{ ml: 0.5 }}>
                        <Typography variant="body2" fontWeight={700} color={sandwichRuleEnabled ? 'warning.dark' : 'text.primary'}>
                          {sandwichRuleEnabled ? 'Sandwich Rule Enabled' : 'Sandwich Rule Disabled'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sandwichRuleEnabled
                            ? 'Applies continuous span calculation across single ranges or separate adjacent requests (e.g. Fri + Mon).'
                            : 'Only actual working days in the leave range are deducted.'}
                        </Typography>
                      </Box>
                    }
                  />

                  {sandwichRuleEnabled && (
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: '8px', fontSize: '0.8125rem' }}>
                      <strong>Sandwich Rule Active:</strong> HR can still remove or exempt specific weekend bridge days on a per-request basis in the Leave Approvals dashboard.
                    </Alert>
                  )}
                </Paper>
              </Grid>
              {/* 3. Leave Approval Workflow Policy */}
              <Grid size={{ xs: 12 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: '10px',
                    bgcolor: 'background.default',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    3. Leave Approval Workflow Policy
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Configure whether leave applications require primary/secondary manager review prior to HR authorization.
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper
                        variant="outlined"
                        onClick={() => setLeaveApprovalWorkflow("DIRECT_TO_HR")}
                        sx={{
                          p: 2,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          borderColor: leaveApprovalWorkflow === "DIRECT_TO_HR" ? 'primary.main' : 'divider',
                          bgcolor: leaveApprovalWorkflow === "DIRECT_TO_HR" ? alpha('#2563eb', 0.04) : 'background.paper',
                          borderWidth: leaveApprovalWorkflow === "DIRECT_TO_HR" ? 2 : 1,
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: 'primary.main' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label="Direct to HR"
                            size="small"
                            color={leaveApprovalWorkflow === "DIRECT_TO_HR" ? 'primary' : 'default'}
                            sx={{ fontWeight: 700, height: 20, fontSize: '0.6875rem' }}
                          />
                          <Typography variant="body2" fontWeight={700}>
                            Single-Step Approval
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          All leave applications route directly to HR / Company Admin for review and final balance deduction.
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper
                        variant="outlined"
                        onClick={() => setLeaveApprovalWorkflow("TWO_STEP")}
                        sx={{
                          p: 2,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          borderColor: leaveApprovalWorkflow === "TWO_STEP" ? 'secondary.main' : 'divider',
                          bgcolor: leaveApprovalWorkflow === "TWO_STEP" ? alpha('#9333ea', 0.04) : 'background.paper',
                          borderWidth: leaveApprovalWorkflow === "TWO_STEP" ? 2 : 1,
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: 'secondary.main' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label="2-Step Workflow"
                            size="small"
                            color={leaveApprovalWorkflow === "TWO_STEP" ? 'secondary' : 'default'}
                            sx={{ fontWeight: 700, height: 20, fontSize: '0.6875rem' }}
                          />
                          <Typography variant="body2" fontWeight={700}>
                            Manager → HR Approval
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Employees with an assigned manager require Manager review first (Stage 1), then HR final approval (Stage 2).
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  <Alert
                    severity={leaveApprovalWorkflow === "TWO_STEP" ? 'info' : 'success'}
                    sx={{ mt: 2, borderRadius: '8px', fontSize: '0.8125rem' }}
                  >
                    {leaveApprovalWorkflow === "TWO_STEP" ? (
                      <>
                        <strong>2-Step Approval Active:</strong> Leave requests from employees with an assigned reporting manager will start in <code>PENDING_MANAGER</code> status. Once approved by the manager, requests advance to <code>PENDING_HR</code> for HR completion. If an employee has no manager assigned, the request automatically routes directly to HR.
                      </>
                    ) : (
                      <>
                        <strong>Single-Step Active:</strong> All employee leave requests route directly to HR / Company Admin without requiring intermediate manager sign-off.
                      </>
                    )}
                  </Alert>
                </Paper>
              </Grid>
            </Grid>

            {/* Save Action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  savingLeaveRules ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
                }
                disabled={savingLeaveRules}
                onClick={handleSaveLeaveRules}
                sx={{ px: 4, py: 1, fontWeight: 700, borderRadius: '8px' }}
              >
                {savingLeaveRules ? 'Saving Rules...' : 'Save Leave Rules'}
              </Button>
            </Box>
          </Paper>
        </Stack>
      )}

      {/* ─── TAB 2: Office Geo-Fencing ─── */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Geo-Fencing Master Switch */}
          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Enforce Geo-Fencing Restrictions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    When enabled, employees must be physically within the office perimeter boundary to punch in or out.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={geoFencingEnabled}
                      onChange={(e) => setGeoFencingEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert
                severity={geoFencingEnabled ? 'info' : 'warning'}
                variant="outlined"
                sx={{ borderRadius: 1.5 }}
              >
                {geoFencingEnabled ? (
                  <>
                    <strong>Enforcement Active:</strong> Any employee checking in via Web or Mobile must have their GPS coordinates within <strong>{radiusM || 200} meters</strong> of the office coordinates below.
                  </>
                ) : (
                  <>
                    <strong>Enforcement Bypassed:</strong> Attendance timestamps and GPS coordinates are logged for auditing, but distance checks are bypassed and check-in will succeed from any location.
                  </>
                )}
              </Alert>
            </Paper>
          </Grid>

          {/* Office Coordinates & Radius Form */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Office Premises Coordinates
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={locating ? <CircularProgress size={16} /> : <MyLocationIcon />}
                  onClick={handleDetectLocation}
                  disabled={locating || savingGeo}
                >
                  Detect My Location
                </Button>
              </Box>

              <Box component="form" onSubmit={handleSaveGeo}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      fullWidth
                      required
                      type="number"
                      inputProps={{ step: 'any' }}
                      placeholder="e.g. 23.052228"
                      helperText="Range: -90.0 to 90.0"
                      disabled={savingGeo}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      fullWidth
                      required
                      type="number"
                      inputProps={{ step: 'any' }}
                      placeholder="e.g. 72.493801"
                      helperText="Range: -180.0 to 180.0"
                      disabled={savingGeo}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Allowed Radius (meters)"
                      value={radiusM}
                      onChange={(e) => setRadiusM(e.target.value)}
                      fullWidth
                      required
                      type="number"
                      inputProps={{ min: 1, step: 10 }}
                      placeholder="e.g. 200"
                      helperText="Distance in meters around office coordinates where check-in is permitted"
                      disabled={savingGeo}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                      Quick Radius Presets:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {RADIUS_PRESETS.map((preset) => (
                        <Chip
                          key={preset}
                          label={`${preset} m`}
                          clickable
                          color={radiusM === preset.toString() ? 'primary' : 'default'}
                          variant={radiusM === preset.toString() ? 'filled' : 'outlined'}
                          onClick={() => setRadiusM(preset.toString())}
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button variant="outlined" onClick={() => loadAllSettings()} disabled={savingGeo}>
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={savingGeo ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                        disabled={savingGeo}
                      >
                        {savingGeo ? 'Saving...' : 'Save Geo Settings'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Configuration Summary Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Summary & Status
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Geo-Fence Enforcement
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {geoFencingEnabled ? 'Active (Strict Radius)' : 'Disabled (Allow Anywhere)'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Target Coordinates
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {latitude || '—'}, {longitude || '—'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Perimeter Boundary
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {radiusM ? `${radiusM} meters` : '—'}
                  </Typography>
                </Box>

                {lastUpdated && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lastUpdated}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default AdminWorkplaceSettings
