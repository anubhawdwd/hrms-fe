// src/components/AdminLwpReportDialog.tsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Stack,
  CircularProgress,
  IconButton,
  TextField,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  alpha,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import TableChartIcon from '@mui/icons-material/TableChart'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import AssessmentIcon from '@mui/icons-material/Assessment'
import MoneyOffIcon from '@mui/icons-material/MoneyOff'
import PeopleIcon from '@mui/icons-material/People'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { leaveApi } from '../api/leave.api'

interface Props {
  open: boolean
  onClose: () => void
}

interface LwpReportEmployee {
  id: string
  employeeCode: number
  displayName: string
  designation: string
  department: string
  dailyLwp: Record<string, number>
  totalLwp: number
}

interface LwpDayRecord {
  date: string
  dayOfWeek: string
  employeeId: string
  employeeCode: number
  employeeName: string
  designation: string
  leaveTypeName: string
  durationType: string
  deductDays: number
  status: string
}

export const AdminLwpReportDialog: React.FC<Props> = ({ open, onClose }) => {
  const theme = useTheme()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [year, setYear] = useState<number>(currentYear)
  const [month, setMonth] = useState<number>(currentMonth)
  const [viewMode, setViewMode] = useState<'matrix' | 'daywise'>('matrix')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<{
    year: number
    month: number
    daysInMonth: number
    totalLwpDays: number
    employees: LwpReportEmployee[]
    dayWiseRecords: LwpDayRecord[]
  } | null>(null)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const data = await leaveApi.getLwpReport(year, month)
      setReportData(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch LWP report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchReport()
    }
  }, [open, year, month])

  // Days in selected month
  const daysList = useMemo(() => {
    if (!reportData) return []
    const totalDays = reportData.daysInMonth || new Date(year, month, 0).getDate()
    const list: { dayNum: number; dateStr: string; dayName: string; isWeekend: boolean }[] = []
    const monthStr = String(month).padStart(2, '0')

    for (let d = 1; d <= totalDays; d++) {
      const dStr = String(d).padStart(2, '0')
      const fullDate = `${year}-${monthStr}-${dStr}`
      const dateObj = dayjs(fullDate)
      const dayOfWeek = dateObj.day() // 0 = Sun, 6 = Sat
      list.push({
        dayNum: d,
        dateStr: fullDate,
        dayName: dateObj.format('dd'),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      })
    }
    return list
  }, [reportData, year, month])

  const employeesWithLwpCount = useMemo(() => {
    if (!reportData?.employees) return 0
    return reportData.employees.filter((e) => e.totalLwp > 0).length
  }, [reportData?.employees])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              color: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AssessmentIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              LWP / Unpaid Leave Report (Payroll Support)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Summary of all approved unpaid leave days for salary deduction calculation
            </Typography>
          </Box>
        </Box>

        {/* Filter Controls & Toggle */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {/* Year Selector */}
          <TextField
            select
            size="small"
            label="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ width: 110 }}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          {/* Month Selector */}
          <TextField
            select
            size="small"
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            sx={{ width: 150 }}
          >
            {[
              { m: 1, name: 'January' },
              { m: 2, name: 'February' },
              { m: 3, name: 'March' },
              { m: 4, name: 'April' },
              { m: 5, name: 'May' },
              { m: 6, name: 'June' },
              { m: 7, name: 'July' },
              { m: 8, name: 'August' },
              { m: 9, name: 'September' },
              { m: 10, name: 'October' },
              { m: 11, name: 'November' },
              { m: 12, name: 'December' },
            ].map((mo) => (
              <MenuItem key={mo.m} value={mo.m}>
                {mo.name}
              </MenuItem>
            ))}
          </TextField>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="matrix" sx={{ textTransform: 'none', px: 1.5, gap: 0.5 }}>
              <TableChartIcon fontSize="small" />
              <Typography variant="caption" fontWeight={600}>Monthly Matrix</Typography>
            </ToggleButton>
            <ToggleButton value="daywise" sx={{ textTransform: 'none', px: 1.5, gap: 0.5 }}>
              <FormatListBulletedIcon fontSize="small" />
              <Typography variant="caption" fontWeight={600}>Day-wise</Typography>
            </ToggleButton>
          </ToggleButtonGroup>

          <IconButton onClick={fetchReport} disabled={loading} size="small" color="primary">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Content Body */}
      <DialogContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Metric Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: '12px', bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      TOTAL UNPAID DAYS ({dayjs(`${year}-${month}-01`).format('MMMM YYYY')})
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="warning.dark">
                      {reportData?.totalLwpDays ?? 0} Day{reportData?.totalLwpDays !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <MoneyOffIcon color="warning" sx={{ fontSize: 32, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: '12px', bgcolor: alpha(theme.palette.info.main, 0.04) }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      EMPLOYEES ON LWP
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="info.dark">
                      {employeesWithLwpCount} Employee{employeesWithLwpCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <PeopleIcon color="info" sx={{ fontSize: 32, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: '12px', bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      DATA SOURCE & STATUS
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      Approved Days Only
                    </Typography>
                  </Box>
                  <Chip label="Ready for Payroll" size="small" color="success" sx={{ fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Generating payroll-ready LWP report...
            </Typography>
          </Box>
        ) : viewMode === 'matrix' ? (
          /* =====================================================================
             VIEW A: EXCEL-STYLE MATRIX TABLE (Sticky Employee Left, Sticky Total Right)
             ===================================================================== */
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              flex: 1,
              maxHeight: 'calc(92vh - 280px)',
              borderRadius: '12px',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 1000, borderCollapse: 'separate' }}>
              <TableHead>
                <TableRow>
                  {/* Sticky Left: Employee Header */}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      bgcolor: theme.palette.background.paper,
                      minWidth: 220,
                      maxWidth: 260,
                      fontWeight: 700,
                      borderRight: '2px solid',
                      borderColor: 'divider',
                      boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                    }}
                  >
                    Employee
                  </TableCell>

                  {/* Horizontally Scrollable Middle: Days 1..N */}
                  {daysList.map((d) => (
                    <TableCell
                      key={d.dayNum}
                      align="center"
                      sx={{
                        p: 0.75,
                        minWidth: 42,
                        maxWidth: 48,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: d.isWeekend ? alpha(theme.palette.grey[500], 0.08) : 'background.paper',
                        color: d.isWeekend ? 'text.secondary' : 'text.primary',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box>{d.dayNum}</Box>
                      <Typography variant="caption" sx={{ fontSize: '0.625rem', opacity: 0.75 }}>
                        {d.dayName}
                      </Typography>
                    </TableCell>
                  ))}

                  {/* Sticky Right: Total LWP Header */}
                  <TableCell
                    align="center"
                    sx={{
                      position: 'sticky',
                      right: 0,
                      zIndex: 10,
                      bgcolor: theme.palette.background.paper,
                      minWidth: 110,
                      fontWeight: 800,
                      borderLeft: '2px solid',
                      borderColor: 'divider',
                      boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
                      color: 'warning.dark',
                    }}
                  >
                    Total LWP
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {reportData?.employees && reportData.employees.length > 0 ? (
                  reportData.employees.map((emp) => {
                    const hasLwp = emp.totalLwp > 0

                    return (
                      <TableRow
                        key={emp.id}
                        hover
                        sx={{
                          bgcolor: hasLwp ? alpha(theme.palette.warning.main, 0.02) : 'inherit',
                        }}
                      >
                        {/* Sticky Left: Employee Name & Code */}
                        <TableCell
                          sx={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 5,
                            bgcolor: theme.palette.background.paper,
                            borderRight: '2px solid',
                            borderColor: 'divider',
                            boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {emp.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              #{emp.employeeCode} · {emp.designation}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Middle: Days 1..N Values */}
                        {daysList.map((d) => {
                          const val = emp.dailyLwp[d.dateStr]

                          return (
                            <TableCell
                              key={d.dayNum}
                              align="center"
                              sx={{
                                p: 0.5,
                                fontSize: '0.8125rem',
                                fontWeight: val ? 800 : 400,
                                bgcolor: val
                                  ? alpha(theme.palette.warning.main, 0.15)
                                  : d.isWeekend
                                  ? alpha(theme.palette.grey[500], 0.04)
                                  : 'inherit',
                                color: val ? 'warning.dark' : 'text.disabled',
                                borderRight: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {val ? (
                                <Tooltip title={`${val} day(s) approved LWP on ${d.dateStr}`}>
                                  <span>{val}</span>
                                </Tooltip>
                              ) : (
                                <span>-</span>
                              )}
                            </TableCell>
                          )
                        })}

                        {/* Sticky Right: Total LWP Value */}
                        <TableCell
                          align="center"
                          sx={{
                            position: 'sticky',
                            right: 0,
                            zIndex: 5,
                            bgcolor: theme.palette.background.paper,
                            borderLeft: '2px solid',
                            borderColor: 'divider',
                            boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
                            fontWeight: 800,
                            color: hasLwp ? 'warning.dark' : 'text.secondary',
                          }}
                        >
                          {hasLwp ? (
                            <Chip
                              label={`${emp.totalLwp}d`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: alpha(theme.palette.warning.main, 0.15),
                                color: theme.palette.warning.dark,
                              }}
                            />
                          ) : (
                            <span>0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={daysList.length + 2} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No employees found for this company.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* =====================================================================
             VIEW B: DAY-WISE LIST VIEW
             ===================================================================== */
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              flex: 1,
              maxHeight: 'calc(92vh - 280px)',
              borderRadius: '12px',
              overflow: 'auto',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Day of Week</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Unpaid Days
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.dayWiseRecords && reportData.dayWiseRecords.length > 0 ? (
                  reportData.dayWiseRecords.map((r, idx) => (
                    <TableRow key={`${r.employeeId}-${r.date}-${idx}`} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {dayjs(r.date).format('DD MMM YYYY')}
                      </TableCell>
                      <TableCell>{r.dayOfWeek}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        #{r.employeeCode} · {r.employeeName}
                      </TableCell>
                      <TableCell>{r.designation}</TableCell>
                      <TableCell>
                        <Chip
                          label={r.leaveTypeName}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            bgcolor: alpha(theme.palette.warning.main, 0.12),
                            color: theme.palette.warning.dark,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>
                        {r.deductDays}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={r.status} size="small" color="success" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No approved LWP / unpaid leave records found for {dayjs(`${year}-${month}-01`).format('MMMM YYYY')}.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ borderRadius: '8px', fontWeight: 700 }}>
          Close Report
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AdminLwpReportDialog
