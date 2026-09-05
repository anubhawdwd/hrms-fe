// src/pages/AdminReports.tsx
import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import SummarizeIcon from '@mui/icons-material/Summarize'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TableViewIcon from '@mui/icons-material/TableView'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import BadgeIcon from '@mui/icons-material/Badge'
import EventNoteIcon from '@mui/icons-material/EventNote'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DomainIcon from '@mui/icons-material/Domain'
import GroupsIcon from '@mui/icons-material/Groups'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import toast from 'react-hot-toast'

import { reportApi } from '../api/report.api'
import type {
  EmployeeReportResponse,
  LeaveReportSuccessResponse,
  LeaveReportPendingWarning,
} from '../api/report.api'
import { organizationApi } from '../api/organization.api'
import type { Department, Team } from '../types/organization.types'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const AdminReports: React.FC = () => {
  const theme = useTheme()
  const now = dayjs()
  const currentYear = now.year()

  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'LEAVE'>('EMPLOYEE')

  // Organization Filters
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  // Employee Filters (Defaults to 'ALL')
  const [selectedDept, setSelectedDept] = useState<string>('ALL')
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Leave Filters
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(now.month())
  const [fromDate, setFromDate] = useState<string>(now.startOf('month').format('YYYY-MM-DD'))
  const [toDate, setToDate] = useState<string>(now.endOf('month').format('YYYY-MM-DD'))

  // Check if current fromDate and toDate exactly match a full calendar month
  const matchedMonthInfo = React.useMemo(() => {
    if (!fromDate || !toDate) return null
    const dFrom = dayjs(fromDate)
    const dTo = dayjs(toDate)
    if (!dFrom.isValid() || !dTo.isValid()) return null
    if (dFrom.year() !== dTo.year() || dFrom.month() !== dTo.month()) return null
    if (dFrom.date() !== 1) return null
    if (dTo.date() !== dFrom.daysInMonth()) return null
    return {
      year: dFrom.year(),
      month: dFrom.month(),
    }
  }, [fromDate, toDate])

  const isCustomRange = matchedMonthInfo === null
  const displayMonthIndex = matchedMonthInfo ? matchedMonthInfo.month : selectedMonth

  const handleStepMonth = (direction: -1 | 1) => {
    let baseYear = selectedYear
    let baseMonth = selectedMonth

    if (matchedMonthInfo) {
      baseYear = matchedMonthInfo.year
      baseMonth = matchedMonthInfo.month
    }

    let newMonth = baseMonth + direction
    let newYear = baseYear

    if (newMonth < 0) {
      newMonth = 11
      newYear -= 1
    } else if (newMonth > 11) {
      newMonth = 0
      newYear += 1
    }

    setSelectedYear(newYear)
    setSelectedMonth(newMonth)

    const targetDate = dayjs().year(newYear).month(newMonth).date(1)
    setFromDate(targetDate.startOf('month').format('YYYY-MM-DD'))
    setToDate(targetDate.endOf('month').format('YYYY-MM-DD'))
  }

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear)
    const targetDate = dayjs().year(newYear).month(selectedMonth).date(1)
    setFromDate(targetDate.startOf('month').format('YYYY-MM-DD'))
    setToDate(targetDate.endOf('month').format('YYYY-MM-DD'))
  }

  const availableYears = Array.from(
    new Set([
      selectedYear,
      matchedMonthInfo?.year || selectedYear,
      currentYear + 1,
      currentYear,
      currentYear - 1,
      currentYear - 2,
    ])
  ).sort((a, b) => b - a)

  // Loading & State
  const [generating, setGenerating] = useState<boolean>(false)
  const [exporting, setExporting] = useState<'excel' | 'csv' | null>(null)

  // Report Results
  const [employeeReport, setEmployeeReport] = useState<EmployeeReportResponse | null>(null)
  const [leaveReport, setLeaveReport] = useState<LeaveReportSuccessResponse | null>(null)

  // Pending Warning Dialog State
  const [pendingWarning, setPendingWarning] = useState<LeaveReportPendingWarning | null>(null)
  const [pendingDialogOpen, setPendingDialogOpen] = useState<boolean>(false)

  // Fetch departments for filters
  useEffect(() => {
    organizationApi
      .listDepartments()
      .then((data: Department[]) => setDepartments(data || []))
      .catch(() => {})
  }, [])

  // Fetch teams whenever selected department changes
  useEffect(() => {
    if (selectedDept && selectedDept !== 'ALL') {
      organizationApi
        .listTeams(selectedDept)
        .then((data: Team[]) => setTeams(data || []))
        .catch(() => setTeams([]))
    } else {
      setTeams([])
    }
  }, [selectedDept])

  // Filter teams by selected department
  const filteredTeams = selectedDept !== 'ALL'
    ? teams.filter((t) => t.departmentId === selectedDept)
    : teams

  // 1. Generate Employee Report
  const handleGenerateEmployeeReport = async () => {
    setGenerating(true)
    try {
      const data = await reportApi.fetchEmployeeReport({
        departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
        teamId: selectedTeam !== 'ALL' ? selectedTeam : undefined,
        status: selectedStatus,
        search: searchQuery.trim() || undefined,
      })
      setEmployeeReport(data)
      toast.success(`Generated Employee Report with ${data.totalEmployees} records`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to generate employee report')
    } finally {
      setGenerating(false)
    }
  }

  // 2. Generate Leave Report
  const handleGenerateLeaveReport = async (confirmPending = false) => {
    setGenerating(true)
    try {
      const res = await reportApi.fetchLeaveReport({
        year: selectedYear,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
        teamId: selectedTeam !== 'ALL' ? selectedTeam : undefined,
        confirmPending,
      })

      if ('warning' in res && res.warning === 'PENDING_LEAVE_APPROVALS') {
        setPendingWarning(res)
        setPendingDialogOpen(true)
      } else {
        const successRes = res as LeaveReportSuccessResponse
        setLeaveReport(successRes)
        setPendingDialogOpen(false)
        setPendingWarning(null)
        toast.success(`Generated Leave Report for ${successRes.totalEmployees} employees`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to generate leave report')
    } finally {
      setGenerating(false)
    }
  }

  // Handle Export
  const handleExport = async (format: 'excel' | 'csv') => {
    setExporting(format)
    try {
      if (activeTab === 'EMPLOYEE') {
        await reportApi.downloadEmployeeReport({
          departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
          teamId: selectedTeam !== 'ALL' ? selectedTeam : undefined,
          status: selectedStatus,
          search: searchQuery.trim() || undefined,
          format,
        })
        toast.success(`Exported Employee Report as ${format.toUpperCase()}`)
      } else {
        const warning = await reportApi.downloadLeaveReport({
          year: selectedYear,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
          teamId: selectedTeam !== 'ALL' ? selectedTeam : undefined,
          confirmPending: true,
          format,
        })
        if (warning && warning.warning === 'PENDING_LEAVE_APPROVALS') {
          setPendingWarning(warning)
          setPendingDialogOpen(true)
        } else {
          toast.success(`Exported Leave Report as ${format.toUpperCase()}`)
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to export report')
    } finally {
      setExporting(null)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SummarizeIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Reports Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate, preview, and export company-scoped directory and leave reports
            </Typography>
          </Box>
        </Box>

        {/* Export Actions */}
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={exporting === 'csv' ? <CircularProgress size={16} /> : <TableViewIcon />}
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={exporting === 'excel' ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}
            onClick={() => handleExport('excel')}
            disabled={exporting !== null}
            sx={{ borderRadius: 2, fontWeight: 600, px: 2.5 }}
          >
            Export Excel (.xlsx)
          </Button>
        </Stack>
      </Box>

      {/* Tabs & Filters */}
      <Paper sx={{ mb: 3, borderRadius: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ px: 2, pt: 1 }}
        >
          <Tab
            value="EMPLOYEE"
            icon={<BadgeIcon />}
            iconPosition="start"
            label="Employee Report"
            sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            value="LEAVE"
            icon={<EventNoteIcon />}
            iconPosition="start"
            label="Leave Report"
            sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
          />
        </Tabs>
        <Divider />

        {/* Filters Panel */}
        <Box sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
            {activeTab === 'EMPLOYEE' ? (
              <>
                <TextField
                  size="small"
                  label="Department"
                  select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value)
                    setSelectedTeam('ALL')
                  }}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="ALL">All Departments</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Team"
                  select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  sx={{ minWidth: 160 }}
                  disabled={selectedDept === 'ALL' && teams.length === 0}
                >
                  <MenuItem value="ALL">All Teams</MenuItem>
                  {filteredTeams.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Status"
                  select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active Only</MenuItem>
                  <MenuItem value="INACTIVE">Inactive Only</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  label="Search Name / Email"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ minWidth: 200, flexGrow: 1 }}
                />

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  onClick={handleGenerateEmployeeReport}
                  disabled={generating}
                  sx={{ borderRadius: 2, fontWeight: 700, px: 3, height: 40 }}
                >
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
              </>
            ) : (
              <>
                <TextField
                  size="small"
                  label="Year"
                  select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  sx={{ minWidth: 110 }}
                >
                  {availableYears.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Month Stepper Pill Control */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 40,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isCustomRange ? 'divider' : alpha(theme.palette.primary.main, 0.35),
                    bgcolor: isCustomRange ? 'background.paper' : alpha(theme.palette.primary.main, 0.04),
                    p: '2px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: isCustomRange ? 'text.secondary' : theme.palette.primary.main,
                    },
                  }}
                >
                  <Tooltip title="Previous Month">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleStepMonth(-1)}
                        aria-label="Previous Month"
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          color: 'text.secondary',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                          },
                        }}
                      >
                        <ChevronLeftIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Box
                    sx={{
                      px: 1.5,
                      minWidth: 95,
                      textAlign: 'center',
                      userSelect: 'none',
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={isCustomRange ? 'text.secondary' : 'primary.main'}
                      sx={{
                        whiteSpace: 'nowrap',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {isCustomRange ? 'Custom Range' : MONTH_NAMES[displayMonthIndex]}
                    </Typography>
                  </Box>

                  <Tooltip title="Next Month">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleStepMonth(1)}
                        aria-label="Next Month"
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          color: 'text.secondary',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                          },
                        }}
                      >
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                <DatePicker
                  label="From Date (Optional)"
                  value={fromDate ? dayjs(fromDate) : null}
                  onChange={(newValue) => setFromDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 160 },
                    },
                  }}
                />

                <DatePicker
                  label="To Date (Optional)"
                  value={toDate ? dayjs(toDate) : null}
                  minDate={fromDate ? dayjs(fromDate) : undefined}
                  onChange={(newValue) => setToDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 160 },
                    },
                  }}
                />

                <TextField
                  size="small"
                  label="Department"
                  select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value)
                    setSelectedTeam('ALL')
                  }}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="ALL">All Departments</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  onClick={() => handleGenerateLeaveReport(false)}
                  disabled={generating}
                  sx={{ borderRadius: 2, fontWeight: 700, px: 3, height: 40 }}
                >
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Report Preview Section */}
      {activeTab === 'EMPLOYEE' ? (
        employeeReport ? (
          <Paper sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            {/* Report Metadata Header Banner */}
            <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="primary">
                    {employeeReport.companyName} · Employee Directory
                  </Typography>
                </Box>
                <Chip
                  icon={<CheckCircleOutlineIcon />}
                  label={`Generated: ${new Date(employeeReport.generatedAt).toLocaleString()}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              {/* Metadata Badges */}
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
                <Chip
                  icon={<DomainIcon />}
                  label={`Department: ${employeeReport.departmentLabel || 'All Departments'}`}
                  size="small"
                  sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
                />
                <Chip
                  icon={<GroupsIcon />}
                  label={`Team: ${employeeReport.teamLabel || 'All Teams'}`}
                  size="small"
                  sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
                />
                <Chip
                  label={`Status: ${employeeReport.statusLabel || 'All Status'}`}
                  size="small"
                  sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
                />
                <Chip
                  label={`Total: ${employeeReport.totalEmployees} Employees`}
                  size="small"
                  color="secondary"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Box>

            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: 'grey.100', fontWeight: 700 } }}>
                    <TableCell sx={{ minWidth: 80, position: 'sticky', left: 0, zIndex: 3, bgcolor: 'grey.100' }}>
                      ID
                    </TableCell>
                    <TableCell sx={{ minWidth: 160, position: 'sticky', left: 80, zIndex: 3, bgcolor: 'grey.100' }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Work Email</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Designation</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Department</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>Team</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Primary Manager</TableCell>
                    <TableCell sx={{ minWidth: 110 }}>Joining Date</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Type</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeReport.data.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: 'background.paper' }}>
                        #{row.employeeCode}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 80, bgcolor: 'background.paper' }}>
                        {row.displayName}
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.team}</TableCell>
                      <TableCell>{row.primaryReportingManager}</TableCell>
                      <TableCell>{row.joiningDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.employmentStatus}
                          size="small"
                          color={row.employmentStatus === 'Active' ? 'success' : 'default'}
                          sx={{ fontWeight: 600, height: 22 }}
                        />
                      </TableCell>
                      <TableCell>{row.employeeType}</TableCell>
                      <TableCell>{row.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2.5 }}>
            <BadgeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No Employee Report Generated Yet
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Choose your filters above and click "Generate Report" to view the live company directory.
            </Typography>
          </Paper>
        )
      ) : leaveReport ? (
        <Paper sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          {/* Leave Report Metadata Header Banner */}
          <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="primary">
                  {leaveReport.companyName} · Leave & Attendance Matrix
                </Typography>
              </Box>
              <Chip
                icon={<CheckCircleOutlineIcon />}
                label={`Generated: ${new Date(leaveReport.generatedAt).toLocaleString()}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {/* Metadata Badges */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
              <Chip
                icon={<CalendarTodayIcon />}
                label={`Period: ${leaveReport.periodLabel || `Year ${leaveReport.year}`}`}
                size="small"
                sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
              />
              <Chip
                label={`Date Range: ${leaveReport.dateRangeLabel || `01-Jan-${leaveReport.year} → 31-Dec-${leaveReport.year}`}`}
                size="small"
                sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
              />
              <Chip
                icon={<DomainIcon />}
                label={`Department: ${leaveReport.departmentLabel || 'All Departments'}`}
                size="small"
                sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
              />
              <Chip
                icon={<GroupsIcon />}
                label={`Team: ${leaveReport.teamLabel || 'All Teams'}`}
                size="small"
                sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
              />
              <Chip
                label={`Total: ${leaveReport.totalEmployees} Employees`}
                size="small"
                color="secondary"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`${leaveReport.leaveTypes.length} Dynamic Leave Types`}
                size="small"
                sx={{ bgcolor: 'background.paper', fontWeight: 600 }}
              />
            </Stack>
          </Box>

          {leaveReport.reportNote && (
            <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: 0 }}>
              {leaveReport.reportNote} ({leaveReport.pendingCount} pending requests totaling {leaveReport.pendingTotalDays} days/hours).
            </Alert>
          )}

          <TableContainer sx={{ maxHeight: 600, bgcolor: 'background.paper' }}>
            <Table stickyHeader size="small">
              <TableHead>
                {/* Top Grouped Header Row */}
                <TableRow
                  sx={{
                    height: 32,
                    '& th': {
                      top: 0,
                      height: 32,
                      py: '4px !important',
                      px: '8px !important',
                      boxSizing: 'border-box',
                      lineHeight: '22px',
                      fontSize: '0.8125rem',
                      bgcolor: 'grey.100',
                      color: 'text.primary',
                      fontWeight: 700,
                      textAlign: 'center',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      zIndex: 3,
                    },
                  }}
                >
                  <TableCell
                    rowSpan={2}
                    sx={{
                      minWidth: 80,
                      position: 'sticky',
                      left: 0,
                      zIndex: '6 !important',
                      bgcolor: 'grey.100 !important',
                      textAlign: 'left',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      minWidth: 160,
                      position: 'sticky',
                      left: 80,
                      zIndex: '6 !important',
                      bgcolor: 'grey.100 !important',
                      textAlign: 'left',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    Employee
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 170, textAlign: 'left', borderRight: '1px solid', borderColor: 'divider' }}>
                    Work Email
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 130, textAlign: 'left', borderRight: '1px solid', borderColor: 'divider' }}>
                    Department
                  </TableCell>

                  {/* Dynamic Leave Types */}
                  {leaveReport.leaveTypes.map((lt) => (
                    <TableCell
                      key={lt.id}
                      colSpan={2}
                      sx={{
                        borderLeft: '1px solid',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.100',
                      }}
                    >
                      {lt.name} ({lt.code})
                    </TableCell>
                  ))}

                  {/* Total Paid Leaves (Grouped Merged Header) */}
                  <TableCell
                    colSpan={2}
                    sx={{
                      borderLeft: '1px solid',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.100',
                    }}
                  >
                    Total Paid Leaves
                  </TableCell>

                  {/* Aggregates */}
                  <TableCell rowSpan={2} sx={{ minWidth: 95 }}>
                    LWP Total
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 95 }}>
                    Absent Days
                  </TableCell>
                </TableRow>

                {/* Sub-Header Row */}
                <TableRow
                  sx={{
                    height: 28,
                    '& th': {
                      top: '32px !important',
                      height: 28,
                      py: '3px !important',
                      px: '8px !important',
                      boxSizing: 'border-box',
                      lineHeight: '20px',
                      fontSize: '0.75rem',
                      bgcolor: 'grey.100',
                      color: 'text.secondary',
                      fontWeight: 700,
                      textAlign: 'center',
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      zIndex: 3,
                    },
                  }}
                >
                  {leaveReport.leaveTypes.map((lt) => (
                    <React.Fragment key={lt.id}>
                      <TableCell
                        sx={{
                          minWidth: 75,
                          borderLeft: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'grey.100',
                        }}
                      >
                        Balance
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 75,
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'grey.100',
                        }}
                      >
                        Used
                      </TableCell>
                    </React.Fragment>
                  ))}

                  {/* Total Paid Leaves Sub-Headers */}
                  <TableCell
                    sx={{
                      minWidth: 80,
                      borderLeft: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.100',
                    }}
                  >
                    Balance
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: 80,
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.100',
                    }}
                  >
                    Used
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {leaveReport.data.map((row, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        bgcolor: 'background.paper',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      #{row.employeeCode}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        position: 'sticky',
                        left: 80,
                        zIndex: 2,
                        bgcolor: 'background.paper',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {row.displayName}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider' }}>{row.email}</TableCell>
                    <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider' }}>{row.department}</TableCell>

                    {/* Dynamic Leave Types */}
                    {leaveReport.leaveTypes.map((lt) => {
                      const m = row.leaveTypeMetrics[lt.id] || { used: 0, balance: 0, booked: 0 }
                      const usedVal = m.used ?? m.booked ?? 0
                      return (
                        <React.Fragment key={lt.id}>
                          <TableCell
                            align="center"
                            sx={{
                              borderLeft: '1px solid',
                              borderColor: 'divider',
                              fontWeight: 600,
                              color: m.balance > 0 ? 'primary.main' : 'text.disabled',
                            }}
                          >
                            {m.balance}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              borderRight: '1px solid',
                              borderColor: 'divider',
                              color: usedVal > 0 ? 'text.primary' : 'text.disabled',
                            }}
                          >
                            {usedVal}
                          </TableCell>
                        </React.Fragment>
                      )
                    })}

                    {/* Total Paid Leaves */}
                    <TableCell
                      align="center"
                      sx={{
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        fontWeight: 600,
                        color: (row.paidLeavesBalance ?? 0) > 0 ? 'primary.main' : 'text.disabled',
                      }}
                    >
                      {row.paidLeavesBalance ?? 0}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        fontWeight: 600,
                        color: (row.paidLeavesUsed ?? row.paidLeavesTotal ?? 0) > 0 ? 'text.primary' : 'text.disabled',
                      }}
                    >
                      {row.paidLeavesUsed ?? row.paidLeavesTotal ?? 0}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: row.lwpTotal > 0 ? 'warning.main' : 'text.disabled' }}>
                      {row.lwpTotal}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: row.absentDays > 0 ? 'error.main' : 'text.disabled' }}>
                      {row.absentDays}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2.5 }}>
          <EventNoteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No Leave Report Generated Yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Choose your year/filters above and click "Generate Report" to view dynamic leave balances and used leaves.
          </Typography>
        </Paper>
      )}

      {/* Pending Leave Approvals Warning Confirmation Dialog */}
      <Dialog
        open={pendingDialogOpen}
        onClose={() => setPendingDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              color: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningAmberIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Pending Leave Approvals Found
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
            There {pendingWarning?.pendingCount === 1 ? 'is' : 'are'}{' '}
            <strong>{pendingWarning?.pendingCount}</strong> pending leave{' '}
            {pendingWarning?.pendingCount === 1 ? 'request' : 'requests'} totaling{' '}
            <strong>{pendingWarning?.pendingTotalDays}</strong> days/hours.
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Pending leave will <strong>not</strong> be counted as Used in this report unless it is approved.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setPendingDialogOpen(false)}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleGenerateLeaveReport(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Continue & Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminReports
