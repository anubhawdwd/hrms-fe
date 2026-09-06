// src/pages/AdminReports.tsx
import React, { useState, useEffect, useMemo, useRef } from "react"
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
  Popper,
  Fade,
} from "@mui/material"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import dayjs from "dayjs"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import SummarizeIcon from "@mui/icons-material/Summarize"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import TableViewIcon from "@mui/icons-material/TableView"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import BadgeIcon from "@mui/icons-material/Badge"
import EventNoteIcon from "@mui/icons-material/EventNote"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import GroupsIcon from "@mui/icons-material/Groups"
import toast from "react-hot-toast"

import { reportApi } from "../api/report.api"
import type {
  EmployeeReportResponse,
  LeaveReportSuccessResponse,
  LeaveReportPendingWarning,
  AttendanceReportResponse,
  AttendanceReportEmployeeRow,
  AttendanceReportHeaderDay,
  AttendanceReportDayCell,
} from "../api/report.api"
import { organizationApi } from "../api/organization.api"
import { attendanceApi } from "../api/attendance.api"
import type { Department, Team } from "../types/organization.types"
import type {
  DashboardAttendanceStatus,
  AttendanceDashboardSession,
} from "../types/attendance.types"
import { DaySessionDetail } from "../components/DaySessionDetail"
import { STATUS_CONFIG } from "../utils/attendanceStatusConfig"

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export const AdminReports: React.FC = () => {
  const theme = useTheme()
  const now = dayjs()
  const currentYear = now.year()

  const [activeTab, setActiveTab] = useState<"EMPLOYEE" | "LEAVE" | "ATTENDANCE">("EMPLOYEE")

  // Organization Filters
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  // Shared / Common Filters
  const [selectedDept, setSelectedDept] = useState<string>("ALL")
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Period / Date Filters (used by Leave & Attendance)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(now.month())
  const [fromDate, setFromDate] = useState<string>(now.startOf("month").format("YYYY-MM-DD"))
  const [toDate, setToDate] = useState<string>(now.endOf("month").format("YYYY-MM-DD"))

  // Check if current fromDate and toDate exactly match a full calendar month
  const matchedMonthInfo = useMemo(() => {
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
    setFromDate(targetDate.startOf("month").format("YYYY-MM-DD"))
    setToDate(targetDate.endOf("month").format("YYYY-MM-DD"))
  }

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear)
    const targetDate = dayjs().year(newYear).month(selectedMonth).date(1)
    setFromDate(targetDate.startOf("month").format("YYYY-MM-DD"))
    setToDate(targetDate.endOf("month").format("YYYY-MM-DD"))
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
  const [exporting, setExporting] = useState<"excel" | "csv" | null>(null)

  // Report Results
  const [employeeReport, setEmployeeReport] = useState<EmployeeReportResponse | null>(null)
  const [leaveReport, setLeaveReport] = useState<LeaveReportSuccessResponse | null>(null)
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportResponse | null>(null)

  // Pending Warning Dialog State for Leaves
  const [pendingWarning, setPendingWarning] = useState<LeaveReportPendingWarning | null>(null)
  const [pendingDialogOpen, setPendingDialogOpen] = useState<boolean>(false)

  // Cell Popover / Drilldown State for Attendance
  const [activeCellDetail, setActiveCellDetail] = useState<{
    emp: AttendanceReportEmployeeRow
    day: AttendanceReportHeaderDay
    cell: AttendanceReportDayCell
    anchorEl: HTMLElement
    sessions?: AttendanceDashboardSession[]
    loadingSessions?: boolean
  } | null>(null)

  // Session Cache to avoid duplicate fetch on hover
  const sessionCacheRef = useRef<Map<string, AttendanceDashboardSession[]>>(new Map())

  // Fetch departments for filters
  useEffect(() => {
    organizationApi
      .listDepartments()
      .then((data: Department[]) => setDepartments(data || []))
      .catch(() => {})
  }, [])

  // Fetch teams whenever selected department changes
  useEffect(() => {
    if (selectedDept && selectedDept !== "ALL") {
      organizationApi
        .listTeams(selectedDept)
        .then((data: Team[]) => setTeams(data || []))
        .catch(() => setTeams([]))
    } else {
      setTeams([])
    }
  }, [selectedDept])

  const filteredTeams = selectedDept !== "ALL"
    ? teams.filter((t) => t.departmentId === selectedDept)
    : teams

  // 1. Generate Employee Report
  const handleGenerateEmployeeReport = async () => {
    setGenerating(true)
    try {
      const data = await reportApi.fetchEmployeeReport({
        departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
        teamId: selectedTeam !== "ALL" ? selectedTeam : undefined,
        status: selectedStatus,
        search: searchQuery.trim() || undefined,
      })
      setEmployeeReport(data)
      toast.success(`Generated Employee Report with ${data.totalEmployees} records`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to generate employee report")
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
        departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
        teamId: selectedTeam !== "ALL" ? selectedTeam : undefined,
        confirmPending,
      })

      if ("warning" in res && res.warning === "PENDING_LEAVE_APPROVALS") {
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
      toast.error(err?.response?.data?.message || err?.message || "Failed to generate leave report")
    } finally {
      setGenerating(false)
    }
  }

  // 3. Generate Attendance Report
  const handleGenerateAttendanceReport = async () => {
    setGenerating(true)
    try {
      const isMonthScoped = !isCustomRange && matchedMonthInfo !== null
      const data = await reportApi.fetchAttendanceReport({
        year: isMonthScoped ? matchedMonthInfo.year : undefined,
        month: isMonthScoped ? String(matchedMonthInfo.month + 1).padStart(2, "0") : undefined,
        fromDate: !isMonthScoped ? fromDate : undefined,
        toDate: !isMonthScoped ? toDate : undefined,
        departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
        teamId: selectedTeam !== "ALL" ? selectedTeam : undefined,
        search: searchQuery.trim() || undefined,
      })
      setAttendanceReport(data)
      toast.success(`Generated Attendance Report for ${data.totalEmployees} employees`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to generate attendance report")
    } finally {
      setGenerating(false)
    }
  }

  // Handle Export
  const handleExport = async (format: "excel" | "csv") => {
    setExporting(format)
    try {
      if (activeTab === "EMPLOYEE") {
        await reportApi.downloadEmployeeReport({
          departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
          teamId: selectedTeam !== "ALL" ? selectedTeam : undefined,
          status: selectedStatus,
          search: searchQuery.trim() || undefined,
          format,
        })
        toast.success(`Exported Employee Report as ${format.toUpperCase()}`)
      } else if (activeTab === "LEAVE") {
        const warning = await reportApi.downloadLeaveReport({
          year: selectedYear,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
          teamId: selectedTeam !== "ALL" ? selectedTeam : undefined,
          confirmPending: true,
          format,
        })
        if (warning && warning.warning === "PENDING_LEAVE_APPROVALS") {
          setPendingWarning(warning)
          setPendingDialogOpen(true)
        } else {
          toast.success(`Exported Leave Report as ${format.toUpperCase()}`)
        }
      } else if (activeTab === "ATTENDANCE") {
        const isMonthScoped = !isCustomRange && matchedMonthInfo !== null
        await reportApi.downloadAttendanceReport({
          year: isMonthScoped ? matchedMonthInfo.year : undefined,
          month: isMonthScoped ? String(matchedMonthInfo.month + 1).padStart(2, "0") : undefined,
          fromDate: !isMonthScoped ? fromDate : undefined,
          toDate: !isMonthScoped ? toDate : undefined,
          departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
          teamId: selectedTeam !== "ALL" ? selectedTeam : undefined,
          search: searchQuery.trim() || undefined,
          format,
        })
        toast.success(`Exported Attendance Report as ${format.toUpperCase()}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to export report")
    } finally {
      setExporting(null)
    }
  }

  // On-demand cell session fetch handler for drilldown
  const handleCellHover = async (
    emp: AttendanceReportEmployeeRow,
    day: AttendanceReportHeaderDay,
    anchorEl: HTMLElement
  ) => {
    const cell = emp.days[day.date] || {
      date: day.date,
      status: "UNRECORDED",
      checkIn: null,
      checkOut: null,
      totalMinutes: 0,
      leaveType: null,
      leaveDuration: null,
      holidayName: day.holidayName,
      isAutoPresent: false,
      isExempt: false,
    }

    const cacheKey = `${emp.employeeId}_${day.date}`
    const cachedSessions = sessionCacheRef.current.get(cacheKey)

    setActiveCellDetail({
      emp,
      day,
      cell,
      anchorEl,
      sessions: cachedSessions || [],
      loadingSessions: !cachedSessions && cell.totalMinutes > 0,
    })

    if (!cachedSessions && cell.totalMinutes > 0) {
      try {
        const dayRecord = await attendanceApi.getDay(day.date, emp.employeeId)
        const sessions: AttendanceDashboardSession[] = (dayRecord?.sessions || []).map((s: any) => ({
          checkIn: s.checkIn,
          checkOut: s.checkOut,
          durationMinutes: s.durationMinutes || 0,
          isOngoing: !s.checkOut,
        }))
        sessionCacheRef.current.set(cacheKey, sessions)
        setActiveCellDetail((prev) => {
          if (prev && prev.emp.employeeId === emp.employeeId && prev.day.date === day.date) {
            return { ...prev, sessions, loadingSessions: false }
          }
          return prev
        })
      } catch {
        setActiveCellDetail((prev) => (prev ? { ...prev, loadingSessions: false } : null))
      }
    }
  }

  const handleCellLeave = () => {
    setActiveCellDetail(null)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: "auto" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SummarizeIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Reports Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate, preview, and export company-scoped directory, leave, and attendance reports
            </Typography>
          </Box>
        </Box>

        {/* Export Actions */}
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={exporting === "csv" ? <CircularProgress size={16} /> : <TableViewIcon />}
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={exporting === "excel" ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}
            onClick={() => handleExport("excel")}
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
            sx={{ fontWeight: 600, textTransform: "none", minHeight: 48 }}
          />
          <Tab
            value="LEAVE"
            icon={<CalendarTodayIcon />}
            iconPosition="start"
            label="Leave Report"
            sx={{ fontWeight: 600, textTransform: "none", minHeight: 48 }}
          />
          <Tab
            value="ATTENDANCE"
            icon={<EventNoteIcon />}
            iconPosition="start"
            label="Attendance Report"
            sx={{ fontWeight: 600, textTransform: "none", minHeight: 48 }}
          />
        </Tabs>
        <Divider />

        {/* Filters Container */}
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
            {activeTab === "EMPLOYEE" ? (
              <>
                <TextField
                  size="small"
                  label="Department"
                  select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value)
                    setSelectedTeam("ALL")
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
                  disabled={selectedDept === "ALL"}
                  sx={{ minWidth: 180 }}
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
                  {generating ? "Generating..." : "Generate Report"}
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
                    display: "inline-flex",
                    alignItems: "center",
                    height: 40,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: isCustomRange ? "divider" : alpha(theme.palette.primary.main, 0.35),
                    bgcolor: isCustomRange ? "background.paper" : alpha(theme.palette.primary.main, 0.04),
                    p: "2px",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: isCustomRange ? "text.secondary" : theme.palette.primary.main,
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
                          color: "text.secondary",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
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
                      textAlign: "center",
                      userSelect: "none",
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={isCustomRange ? "text.secondary" : "primary.main"}
                      sx={{
                        whiteSpace: "nowrap",
                        fontSize: "0.8125rem",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {isCustomRange ? "Custom Range" : MONTH_NAMES[displayMonthIndex]}
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
                          color: "text.secondary",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
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
                  onChange={(newValue) => setFromDate(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { minWidth: 160 },
                    },
                  }}
                />

                <DatePicker
                  label="To Date (Optional)"
                  value={toDate ? dayjs(toDate) : null}
                  minDate={fromDate ? dayjs(fromDate) : undefined}
                  onChange={(newValue) => setToDate(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")}
                  slotProps={{
                    textField: {
                      size: "small",
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
                    setSelectedTeam("ALL")
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
                  disabled={selectedDept === "ALL"}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="ALL">All Teams</MenuItem>
                  {filteredTeams.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>

                {activeTab === "ATTENDANCE" && (
                  <TextField
                    size="small"
                    label="Search Employee"
                    placeholder="Search by name / code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 180, flexGrow: 1 }}
                  />
                )}

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  onClick={() => {
                    if (activeTab === "LEAVE") {
                      handleGenerateLeaveReport(false)
                    } else {
                      handleGenerateAttendanceReport()
                    }
                  }}
                  disabled={generating}
                  sx={{ borderRadius: 2, fontWeight: 700, px: 3, height: 40 }}
                >
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Report Preview Section */}
      {activeTab === "EMPLOYEE" ? (
        employeeReport ? (
          <Paper sx={{ borderRadius: 2.5, overflow: "hidden" }}>
            {/* Header info bar */}
            <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {employeeReport.companyName} — Employee Master Directory
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {employeeReport.departmentLabel} • {employeeReport.teamLabel} • {employeeReport.statusLabel}
                  </Typography>
                </Box>
                <Chip
                  label={`${employeeReport.totalEmployees} Employees`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Box>

            {/* Table */}
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 80 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Work Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 130 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 130 }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Team</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Primary Manager</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Joining Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeReport.data.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>#{row.employeeCode}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.displayName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell>{row.team}</TableCell>
                      <TableCell>{row.primaryReportingManager}</TableCell>
                      <TableCell>{row.joiningDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.employmentStatus}
                          size="small"
                          color={row.employmentStatus === "Active" ? "success" : "default"}
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell>{row.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Paper sx={{ p: 6, textAlign: "center", borderRadius: 2.5 }}>
            <BadgeIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No Employee Report Generated Yet
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Choose your filter criteria above and click "Generate Report" to preview employee records.
            </Typography>
          </Paper>
        )
      ) : activeTab === "LEAVE" ? (
        leaveReport ? (
          <Paper sx={{ borderRadius: 2.5, overflow: "hidden" }}>
            {/* Header info bar */}
            <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {leaveReport.companyName} — Leave Report ({leaveReport.periodLabel})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {leaveReport.departmentLabel} • {leaveReport.teamLabel} • {leaveReport.dateRangeLabel}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`${leaveReport.totalEmployees} Employees`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  {leaveReport.hasPendingWarning && (
                    <Chip
                      icon={<WarningAmberIcon />}
                      label={`${leaveReport.pendingCount} Pending Requests (${leaveReport.pendingTotalDays}d)`}
                      color="warning"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                </Stack>
              </Stack>
            </Box>

            {/* Matrix Table */}
            <TableContainer sx={{ maxHeight: 650 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  {/* Top Header Row */}
                  <TableRow>
                    <TableCell
                      rowSpan={2}
                      sx={{
                        fontWeight: 700,
                        minWidth: 80,
                        position: "sticky",
                        left: 0,
                        zIndex: 3,
                        bgcolor: "background.paper",
                        borderRight: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      ID
                    </TableCell>
                    <TableCell
                      rowSpan={2}
                      sx={{
                        fontWeight: 700,
                        minWidth: 160,
                        position: "sticky",
                        left: 80,
                        zIndex: 3,
                        bgcolor: "background.paper",
                        borderRight: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      Employee Name
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, minWidth: 160, borderRight: "1px solid", borderColor: "divider" }}>
                      Work Email
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, minWidth: 120, borderRight: "1px solid", borderColor: "divider" }}>
                      Department
                    </TableCell>

                    {/* Dynamic Leave Types Group Headers */}
                    {leaveReport.leaveTypes.map((lt) => (
                      <TableCell
                        key={lt.id}
                        colSpan={2}
                        align="center"
                        sx={{
                          fontWeight: 700,
                          borderLeft: "1px solid",
                          borderRight: "1px solid",
                          borderColor: "divider",
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        }}
                      >
                        {lt.name}
                      </TableCell>
                    ))}

                    {/* Total Paid Leaves Group Header */}
                    <TableCell
                      colSpan={2}
                      align="center"
                      sx={{
                        fontWeight: 700,
                        borderLeft: "1px solid",
                        borderRight: "1px solid",
                        borderColor: "divider",
                        bgcolor: alpha(theme.palette.success.main, 0.08),
                      }}
                    >
                      Total Paid Leaves
                    </TableCell>

                    {/* LWP & Absent */}
                    <TableCell
                      rowSpan={2}
                      align="center"
                      sx={{
                        fontWeight: 700,
                        minWidth: 80,
                        bgcolor: alpha(theme.palette.warning.main, 0.08),
                        borderRight: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      LWP
                    </TableCell>
                    <TableCell
                      rowSpan={2}
                      align="center"
                      sx={{
                        fontWeight: 700,
                        minWidth: 90,
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                      }}
                    >
                      Absent Days
                    </TableCell>
                  </TableRow>

                  {/* Sub-Header Row */}
                  <TableRow>
                    {/* Dynamic Leave Types Sub-Headers */}
                    {leaveReport.leaveTypes.map((lt) => (
                      <React.Fragment key={lt.id}>
                        <TableCell
                          sx={{
                            minWidth: 75,
                            borderLeft: "1px solid",
                            borderColor: "divider",
                            bgcolor: "grey.100",
                          }}
                        >
                          Balance
                        </TableCell>
                        <TableCell
                          sx={{
                            minWidth: 75,
                            borderRight: "1px solid",
                            borderColor: "divider",
                            bgcolor: "grey.100",
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
                        borderLeft: "1px solid",
                        borderColor: "divider",
                        bgcolor: "grey.100",
                      }}
                    >
                      Balance
                    </TableCell>
                    <TableCell
                      sx={{
                        minWidth: 80,
                        borderRight: "1px solid",
                        borderColor: "divider",
                        bgcolor: "grey.100",
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
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          bgcolor: "background.paper",
                          borderRight: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        #{row.employeeCode}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          position: "sticky",
                          left: 80,
                          zIndex: 2,
                          bgcolor: "background.paper",
                          borderRight: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        {row.displayName}
                      </TableCell>
                      <TableCell sx={{ borderRight: "1px solid", borderColor: "divider" }}>{row.email}</TableCell>
                      <TableCell sx={{ borderRight: "1px solid", borderColor: "divider" }}>{row.department}</TableCell>

                      {/* Dynamic Leave Types */}
                      {leaveReport.leaveTypes.map((lt) => {
                        const m = row.leaveTypeMetrics[lt.id] || { used: 0, balance: 0, booked: 0 }
                        const usedVal = m.used ?? m.booked ?? 0
                        return (
                          <React.Fragment key={lt.id}>
                            <TableCell
                              align="center"
                              sx={{
                                borderLeft: "1px solid",
                                borderColor: "divider",
                                fontWeight: 600,
                                color: m.balance > 0 ? "primary.main" : "text.disabled",
                              }}
                            >
                              {m.balance}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                borderRight: "1px solid",
                                borderColor: "divider",
                                color: usedVal > 0 ? "text.primary" : "text.disabled",
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
                          borderLeft: "1px solid",
                          borderColor: "divider",
                          fontWeight: 600,
                          color: (row.paidLeavesBalance ?? 0) > 0 ? "primary.main" : "text.disabled",
                        }}
                      >
                        {row.paidLeavesBalance ?? 0}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          borderRight: "1px solid",
                          borderColor: "divider",
                          fontWeight: 600,
                          color: (row.paidLeavesUsed ?? row.paidLeavesTotal ?? 0) > 0 ? "text.primary" : "text.disabled",
                        }}
                      >
                        {row.paidLeavesUsed ?? row.paidLeavesTotal ?? 0}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: row.lwpTotal > 0 ? "warning.main" : "text.disabled" }}>
                        {row.lwpTotal}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: row.absentDays > 0 ? "error.main" : "text.disabled" }}>
                        {row.absentDays}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Paper sx={{ p: 6, textAlign: "center", borderRadius: 2.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No Leave Report Generated Yet
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Choose your year/filters above and click "Generate Report" to view dynamic leave balances and used leaves.
            </Typography>
          </Paper>
        )
      ) : (
        /* =================== ATTENDANCE REPORT TAB =================== */
        attendanceReport ? (
          <Paper sx={{ borderRadius: 2.5, overflow: "hidden" }}>
            {/* Header info & company metrics bar */}
            <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: "1px solid", borderColor: "divider" }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {attendanceReport.companyName} — Attendance Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {attendanceReport.periodLabel} ({attendanceReport.dateRangeLabel}) • {attendanceReport.departmentLabel} • {attendanceReport.teamLabel}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<GroupsIcon />}
                    label={`${attendanceReport.totalEmployees} Employees`}
                    color="default"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    icon={<EventNoteIcon />}
                    label={`${attendanceReport.companySummary.totalWorkingDays} Working Days`}
                    color="default"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    icon={<CheckCircleOutlineIcon />}
                    label={`Avg Attendance: ${attendanceReport.companySummary.avgAttendancePercentage}%`}
                    color={
                      attendanceReport.companySummary.avgAttendancePercentage >= 90
                        ? "success"
                        : attendanceReport.companySummary.avgAttendancePercentage >= 75
                        ? "warning"
                        : "error"
                    }
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Attendance Matrix Table */}
            <TableContainer sx={{ maxHeight: 700 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {/* Sticky Employee Identity */}
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        minWidth: 70,
                        position: "sticky",
                        left: 0,
                        zIndex: 3,
                        bgcolor: "background.paper",
                        borderRight: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      ID
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        minWidth: 150,
                        position: "sticky",
                        left: 70,
                        zIndex: 3,
                        bgcolor: "background.paper",
                        borderRight: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      Employee Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 120, borderRight: "1px solid", borderColor: "divider" }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 120, borderRight: "1px solid", borderColor: "divider" }}>
                      Designation
                    </TableCell>

                    {/* Summary Metrics */}
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 70, bgcolor: "grey.100", borderRight: "1px solid", borderColor: "divider" }}>
                      Working Days
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 65, bgcolor: alpha(theme.palette.success.main, 0.08), color: "success.dark" }}>
                      Present
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 65, bgcolor: alpha(theme.palette.error.main, 0.08), color: "error.dark" }}>
                      Absent
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 65, bgcolor: alpha(theme.palette.warning.main, 0.08), color: "warning.dark" }}>
                      Partial
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 65, bgcolor: alpha(theme.palette.info.main, 0.08), color: "info.dark" }}>
                      Leave
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 65, bgcolor: alpha(theme.palette.secondary.main, 0.08), color: "secondary.dark" }}>
                      Holiday
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 85, bgcolor: "grey.100", borderRight: "2px solid", borderColor: "divider" }}>
                      Attendance %
                    </TableCell>

                    {/* Timeline Day Headers */}
                    {attendanceReport.daysHeader.map((d) => {
                      const isWeekend = d.isWeekend
                      const isHoliday = !!d.holidayName
                      return (
                        <TableCell
                          key={d.date}
                          align="center"
                          sx={{
                            minWidth: 38,
                            maxWidth: 38,
                            p: 0.5,
                            borderRight: "1px solid",
                            borderColor: "divider",
                            bgcolor: isHoliday
                              ? alpha(theme.palette.secondary.main, 0.12)
                              : isWeekend
                              ? "grey.100"
                              : "background.paper",
                          }}
                        >
                          <Typography variant="caption" display="block" fontWeight={700} sx={{ fontSize: "0.6875rem", lineHeight: 1.1 }}>
                            {d.dayNumber}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color={isWeekend || isHoliday ? "text.secondary" : "text.disabled"}
                            sx={{ fontSize: "0.625rem", lineHeight: 1.1 }}
                          >
                            {d.dayOfWeek.slice(0, 2)}
                          </Typography>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {attendanceReport.data.map((row) => (
                    <TableRow key={row.employeeId} hover>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          bgcolor: "background.paper",
                          borderRight: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        #{row.employeeCode}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          position: "sticky",
                          left: 70,
                          zIndex: 2,
                          bgcolor: "background.paper",
                          borderRight: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        {row.displayName}
                      </TableCell>
                      <TableCell sx={{ borderRight: "1px solid", borderColor: "divider" }}>{row.department}</TableCell>
                      <TableCell sx={{ borderRight: "1px solid", borderColor: "divider" }}>{row.designation}</TableCell>

                      {/* Summary Numbers */}
                      <TableCell align="center" sx={{ fontWeight: 600, borderRight: "1px solid", borderColor: "divider" }}>
                        {row.summary.totalWorkingDays}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: row.summary.present > 0 ? "success.main" : "text.disabled" }}>
                        {row.summary.present}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: row.summary.absent > 0 ? "error.main" : "text.disabled" }}>
                        {row.summary.absent}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: row.summary.partial > 0 ? "warning.main" : "text.disabled" }}>
                        {row.summary.partial}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: row.summary.onLeave > 0 ? "info.main" : "text.disabled" }}>
                        {row.summary.onLeave}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: row.summary.holiday > 0 ? "secondary.main" : "text.disabled" }}>
                        {row.summary.holiday}
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: "2px solid", borderColor: "divider" }}>
                        <Chip
                          label={`${row.summary.attendancePercentage}%`}
                          size="small"
                          color={
                            row.summary.attendancePercentage >= 90
                              ? "success"
                              : row.summary.attendancePercentage >= 75
                              ? "warning"
                              : "error"
                          }
                          sx={{ fontWeight: 700, fontSize: "0.75rem", height: 22 }}
                        />
                      </TableCell>

                      {/* Daily Status Cells */}
                      {attendanceReport.daysHeader.map((day) => {
                        const cell = row.days[day.date]
                        const status: DashboardAttendanceStatus = cell ? cell.status : "UNRECORDED"
                        const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNRECORDED

                        return (
                          <TableCell
                            key={day.date}
                            align="center"
                            sx={{
                              p: 0.5,
                              minWidth: 38,
                              maxWidth: 38,
                              borderRight: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Box
                              onMouseEnter={(e) => handleCellHover(row, day, e.currentTarget)}
                              onMouseLeave={handleCellLeave}
                              onClick={(e) => handleCellHover(row, day, e.currentTarget)}
                              sx={{
                                width: 30,
                                height: 24,
                                mx: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 1,
                                bgcolor: config.bg,
                                color: config.color,
                                border: "1px solid",
                                borderColor: config.border,
                                fontWeight: 700,
                                fontSize: "0.6875rem",
                                cursor: "pointer",
                                transition: "all 0.15s ease-in-out",
                                userSelect: "none",
                                "&:hover": {
                                  transform: "scale(1.18)",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                                  zIndex: 2,
                                },
                              }}
                            >
                              {config.short}
                            </Box>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Paper sx={{ p: 6, textAlign: "center", borderRadius: 2.5 }}>
            <EventNoteIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No Attendance Report Generated Yet
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Choose your period or date range above and click "Generate Report" to view employee attendance metrics and day-by-day logs.
            </Typography>
          </Paper>
        )
      )}

      {/* Shared Floating Detail Card for Attendance Cell Drilldown */}
      <Popper
        open={Boolean(activeCellDetail?.anchorEl)}
        anchorEl={activeCellDetail?.anchorEl}
        placement="bottom"
        transition
        sx={{ zIndex: 1400, pointerEvents: "none" }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Paper
              elevation={8}
              sx={{
                bgcolor: "#1e293b",
                color: "#ffffff",
                borderRadius: 2,
                p: 1.5,
                border: "1px solid rgba(255,255,255,0.12)",
                minWidth: 260,
                maxWidth: 340,
                pointerEvents: "auto",
                mt: 0.5,
              }}
            >
              {activeCellDetail && (
                <DaySessionDetail
                  date={activeCellDetail.day.date}
                  dayOfWeek={activeCellDetail.day.dayOfWeek}
                  status={activeCellDetail.cell.status}
                  employeeName={activeCellDetail.emp.displayName}
                  employeeCode={
                    typeof activeCellDetail.emp.employeeCode === "number"
                      ? activeCellDetail.emp.employeeCode
                      : Number(activeCellDetail.emp.employeeCode) || null
                  }
                  designationOrDept={activeCellDetail.emp.designation || activeCellDetail.emp.department}
                  totalMinutes={activeCellDetail.cell.totalMinutes}
                  sessions={activeCellDetail.sessions || []}
                  checkIn={activeCellDetail.cell.checkIn}
                  checkOut={activeCellDetail.cell.checkOut}
                  leaveType={activeCellDetail.cell.leaveType}
                  leaveDuration={activeCellDetail.cell.leaveDuration}
                  holidayName={activeCellDetail.cell.holidayName || activeCellDetail.day.holidayName}
                  isAutoPresent={activeCellDetail.cell.isAutoPresent}
                  isExempt={activeCellDetail.cell.isExempt}
                  themeMode="dark"
                />
              )}
            </Paper>
          </Fade>
        )}
      </Popper>

      {/* Pending Leave Approvals Warning Confirmation Dialog */}
      <Dialog
        open={pendingDialogOpen}
        onClose={() => setPendingDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              color: "warning.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
            There {pendingWarning?.pendingCount === 1 ? "is" : "are"}{" "}
            <strong>{pendingWarning?.pendingCount}</strong> pending leave{" "}
            {pendingWarning?.pendingCount === 1 ? "request" : "requests"} totaling{" "}
            <strong>{pendingWarning?.pendingTotalDays}</strong> days/hours.
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Pending leave will <strong>not</strong> be counted as Used in this report unless it is approved.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
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
