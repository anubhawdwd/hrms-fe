// src/utils/attendanceStatusConfig.ts
import type { DashboardAttendanceStatus } from '../types/attendance.types'

export const STATUS_CONFIG: Record<
  DashboardAttendanceStatus,
  { label: string; short: string; bg: string; color: string; border: string }
> = {
  PRESENT: {
    label: 'Present',
    short: 'P',
    bg: '#e8f5e9',
    color: '#2e7d32',
    border: '#a5d6a7',
  },
  PARTIAL: {
    label: 'Partial',
    short: 'PT',
    bg: '#fff8e1',
    color: '#f57f17',
    border: '#ffe082',
  },
  ABSENT: {
    label: 'Absent',
    short: 'A',
    bg: '#ffebee',
    color: '#c62828',
    border: '#ef9a9a',
  },
  ON_LEAVE: {
    label: 'On Leave',
    short: 'L',
    bg: '#e3f2fd',
    color: '#1565c0',
    border: '#90caf9',
  },
  HALF_DAY_LEAVE: {
    label: 'Half Day Leave',
    short: 'HL',
    bg: '#e0f7fa',
    color: '#00838f',
    border: '#80deea',
  },
  PENDING_LEAVE: {
    label: 'Pending Leave',
    short: 'PL',
    bg: '#fff3e0',
    color: '#e65100',
    border: '#ffcc80',
  },
  HOLIDAY: {
    label: 'Holiday',
    short: 'H',
    bg: '#f3e5f5',
    color: '#7b1fa2',
    border: '#ce93d8',
  },
  WEEKEND: {
    label: 'Weekend',
    short: 'W',
    bg: '#f5f5f5',
    color: '#757575',
    border: '#e0e0e0',
  },
  UNRECORDED: {
    label: 'Unrecorded',
    short: '—',
    bg: '#fafafa',
    color: '#9e9e9e',
    border: '#e0e0e0',
  },
}
