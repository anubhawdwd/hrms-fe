import { STATUS_CONFIG } from '../utils/attendanceStatusConfig'
// src/components/DaySessionDetail.tsx
import React from 'react'
import { Box, Typography, Chip, Divider, Stack, Paper } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import dayjs from 'dayjs'
import type {
  DashboardAttendanceStatus,
  AttendanceDashboardSession,
} from '../types/attendance.types'

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = dayjs(iso)
  return d.isValid() ? d.format('hh:mm A') : '—'
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatDurationHMS(minutes: number): string {
  if (!minutes || minutes <= 0) return '00:00:00'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:00`
}

function formatDatePretty(dateStr: string): string {
  const d = dayjs(dateStr)
  return d.isValid() ? d.format('DD MMMM YYYY') : dateStr
}

export interface DaySessionDetailProps {
  date: string
  dayOfWeek?: string
  status: DashboardAttendanceStatus
  employeeName?: string
  employeeCode?: number | null
  designationOrDept?: string | null
  totalMinutes?: number
  sessions?: AttendanceDashboardSession[]
  checkIn?: string | null
  checkOut?: string | null
  leaveType?: string | null
  leaveDuration?: string | null
  holidayName?: string | null
  isAutoPresent?: boolean
  isExempt?: boolean
  themeMode?: 'dark' | 'light'
  showEmployeeHeader?: boolean
}

export const DaySessionDetail: React.FC<DaySessionDetailProps> = ({
  date,
  dayOfWeek,
  status,
  employeeName,
  employeeCode,
  designationOrDept,
  totalMinutes = 0,
  sessions = [],
  checkIn,
  checkOut,
  leaveType,
  leaveDuration,
  holidayName,
  isAutoPresent,
  isExempt,
  themeMode = 'dark',
  showEmployeeHeader = true,
}) => {
  const isDark = themeMode === 'dark'
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNRECORDED

  const textColorPrimary = isDark ? '#f8fafc' : '#0f172a'
  const textColorSecondary = isDark ? '#94a3b8' : '#64748b'
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'
  const sessionCardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'
  const sessionCardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'
  const totalPresenceColor = isDark ? '#38bdf8' : '#0284c7'

  const hasMultipleSessions = Boolean(sessions && sessions.length > 0)

  return (
    <Box sx={{ minWidth: 260, maxWidth: 340, width: '100%', boxSizing: 'border-box' }}>
      {/* Header: Employee & Date Info + Status Badge */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {showEmployeeHeader && employeeName && (
            <Typography
              variant="subtitle2"
              fontWeight={700}
              noWrap
              sx={{ fontSize: '0.8125rem', color: textColorPrimary }}
            >
              {employeeName}
            </Typography>
          )}
          <Typography
            variant="caption"
            sx={{ color: textColorSecondary, fontSize: '0.6875rem', display: 'block' }}
          >
            {formatDatePretty(date)} {dayOfWeek ? `• ${dayOfWeek}` : `• ${dayjs(date).format('dddd')}`}
          </Typography>
          {showEmployeeHeader && (employeeCode || designationOrDept) && (
            <Typography
              variant="caption"
              sx={{ color: textColorSecondary, fontSize: '0.625rem', display: 'block', opacity: 0.8 }}
            >
              {employeeCode ? `#${employeeCode} • ` : ''}
              {designationOrDept || ''}
            </Typography>
          )}
        </Box>
        <Chip
          label={config.label}
          size="small"
          sx={{
            bgcolor: config.bg,
            color: config.color,
            border: '1px solid',
            borderColor: config.border,
            fontWeight: 700,
            fontSize: '0.625rem',
            height: 20,
          }}
        />
      </Box>

      <Divider sx={{ my: 1, borderColor: dividerColor }} />

      {/* Body Content */}
      {status === 'HOLIDAY' ? (
        <Typography variant="caption" sx={{ color: textColorPrimary, display: 'block', fontSize: '0.75rem' }}>
          <strong>Holiday:</strong> {holidayName || 'Official Holiday'}
        </Typography>
      ) : status === 'WEEKEND' ? (
        <Typography variant="caption" sx={{ color: textColorSecondary, display: 'block', fontSize: '0.75rem' }}>
          Weekly Off / Weekend
        </Typography>
      ) : status === 'ON_LEAVE' || status === 'HALF_DAY_LEAVE' || status === 'PENDING_LEAVE' ? (
        <Stack spacing={0.75}>
          <Typography variant="caption" sx={{ color: textColorPrimary, fontSize: '0.75rem' }}>
            <strong>Leave:</strong> {leaveType || 'General Leave'}
          </Typography>
          {leaveDuration && (
            <Typography variant="caption" sx={{ color: textColorSecondary, fontSize: '0.75rem' }}>
              <strong>Duration:</strong> {leaveDuration}
            </Typography>
          )}
          {hasMultipleSessions ? (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: textColorPrimary, mb: 0.5, display: 'block', fontSize: '0.6875rem' }}>
                Worked Sessions ({sessions.length})
              </Typography>
              <Stack spacing={0.5}>
                {sessions.map((s, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 0.75,
                      borderRadius: 1,
                      bgcolor: sessionCardBg,
                      borderColor: sessionCardBorder,
                      fontSize: '0.6875rem',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: textColorSecondary, fontSize: '0.6875rem' }}>
                        Session #{idx + 1}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: s.isOngoing ? 'warning.main' : textColorPrimary, fontSize: '0.6875rem' }}>
                        {formatTime(s.checkIn)} → {s.isOngoing ? 'In Progress' : formatTime(s.checkOut)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ) : checkIn ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: textColorSecondary }}>Check-In / Out:</Typography>
              <Typography variant="caption" sx={{ color: textColorPrimary, fontWeight: 600 }}>
                {formatTime(checkIn)} → {checkOut ? formatTime(checkOut) : 'In Progress'}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      ) : status === 'PRESENT' || status === 'PARTIAL' || status === 'ABSENT' ? (
        <Stack spacing={0.75}>
          {hasMultipleSessions ? (
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: textColorPrimary, mb: 0.5, display: 'block', fontSize: '0.6875rem' }}>
                Attendance Sessions ({sessions.length})
              </Typography>
              <Stack spacing={0.5}>
                {sessions.map((s, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 0.75,
                      borderRadius: 1,
                      bgcolor: sessionCardBg,
                      borderColor: sessionCardBorder,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ color: textColorSecondary, fontSize: '0.6875rem', display: 'block' }}>
                        Session #{idx + 1}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: textColorPrimary, fontSize: '0.75rem' }}>
                        {formatTime(s.checkIn)} → {s.isOngoing ? (
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}>In Progress</span>
                        ) : (
                          formatTime(s.checkOut)
                        )}
                      </Typography>
                    </Box>
                    <Chip
                      label={s.isOngoing ? 'Active' : formatDuration(s.durationMinutes)}
                      size="small"
                      color={s.isOngoing ? 'warning' : 'default'}
                      sx={{ height: 18, fontSize: '0.625rem', fontWeight: 600 }}
                    />
                  </Paper>
                ))}
              </Stack>
            </Box>
          ) : (
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: textColorSecondary }}>Check-In:</Typography>
                <Typography variant="caption" sx={{ color: textColorPrimary, fontWeight: 600 }}>{formatTime(checkIn)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: textColorSecondary }}>Check-Out:</Typography>
                <Typography variant="caption" sx={{ color: textColorPrimary, fontWeight: 600 }}>
                  {checkOut ? formatTime(checkOut) : checkIn ? 'In progress' : '—'}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* Total Presence Footer */}
          <Divider sx={{ my: 0.5, borderColor: dividerColor }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: textColorSecondary }} />
              <Typography variant="caption" fontWeight={600} sx={{ color: textColorSecondary }}>
                Total Presence:
              </Typography>
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: totalPresenceColor, fontSize: '0.8125rem' }}>
              {formatDuration(totalMinutes)} ({formatDurationHMS(totalMinutes)})
            </Typography>
          </Box>

          {isAutoPresent && (
            <Typography variant="caption" sx={{ color: '#a5d6a7', mt: 0.5, display: 'block', fontSize: '0.6875rem' }}>
              • Auto-Present Policy Applied
            </Typography>
          )}
          {isExempt && (
            <Typography variant="caption" sx={{ color: '#90caf9', mt: 0.5, display: 'block', fontSize: '0.6875rem' }}>
              • Attendance Exempt
            </Typography>
          )}
        </Stack>
      ) : (
        <Typography variant="caption" sx={{ color: textColorSecondary, fontSize: '0.75rem' }}>
          No attendance recorded
        </Typography>
      )}
    </Box>
  )
}

export default DaySessionDetail
