// src/types/attendance.types.ts
/**
 * Matches backend POST /api/attendance/check-in and check-out
 */
export interface AttendanceCheckRequest {
  source: 'WEB' | 'PWA'
  location?: {
    latitude: number
    longitude: number
  }
}

export interface AttendanceCheckResponse {
  message: string
  totalMinutes?: number
  status?: 'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'
}

export interface AttendanceEvent {
  id: string
  attendanceDayId?: string
  type: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: string
  source: 'WEB' | 'PWA'
  createdAt?: string
}

export interface AttendanceDay {
  id: string
  employeeId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'
  totalMinutes: number
  events?: AttendanceEvent[]
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceViolation {
  id: string
  employeeId: string
  companyId: string
  latitude: number
  longitude: number
  distanceM: number
  reason: string
  source: 'WEB' | 'PWA'
  createdAt: string
}

export interface HrUpsertAttendanceDayPayload {
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  status?: 'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'
  totalMinutes?: number
  reason: string
}

export interface HrUpdateAttendanceDayPayload {
  status?: 'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'
  totalMinutes?: number
  checkIn?: string
  checkOut?: string
  reason?: string
}

export interface HrAddAttendanceEventPayload {
  employeeId: string
  date: string
  type: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: string
  source: 'WEB' | 'PWA'
  reason: string
}

// ─── Dashboard Matrix Types (Phase 5) ───

export type DashboardAttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'PARTIAL'
  | 'ON_LEAVE'
  | 'HALF_DAY_LEAVE'
  | 'PENDING_LEAVE'
  | 'HOLIDAY'
  | 'WEEKEND'
  | 'UNRECORDED'

export interface AttendanceDashboardCell {
  date: string
  status: DashboardAttendanceStatus
  checkIn: string | null
  checkOut: string | null
  totalMinutes: number
  leaveType: string | null
  leaveDuration: string | null
  holidayName: string | null
  isAutoPresent: boolean
  isExempt: boolean
}

export interface AttendanceDashboardEmployeeRow {
  employeeId: string
  employeeCode: number | null
  displayName: string
  firstName: string
  lastName: string
  departmentName: string | null
  designationName: string | null
  days: Record<string, AttendanceDashboardCell>
  summary: {
    present: number
    absent: number
    partial: number
    onLeave: number
    pendingLeave: number
    holiday: number
    weekend: number
    unrecorded: number
  }
}

export interface AttendanceDashboardDayMeta {
  date: string
  dayOfWeek: string
  dayNumber: number
  isWeekend: boolean
  holidayName: string | null
}

export interface AttendanceDashboardDailySummary {
  present: number
  absent: number
  partial: number
  onLeave: number
  pendingLeave: number
  holiday: number
  weekend: number
  unrecorded: number
}

export interface AttendanceDashboardResponse {
  month: string
  startDate: string
  endDate: string
  totalDays: number
  days: AttendanceDashboardDayMeta[]
  employees: AttendanceDashboardEmployeeRow[]
  dailySummary: Record<string, AttendanceDashboardDailySummary>
  companySummary: {
    totalEmployees: number
    totalWorkingDays: number
  }
}

export interface EmployeeAttendanceOverride {
  id: string
  employeeId: string
  autoPresent: boolean
  attendanceExempt: boolean
  reason?: string | null
  validFrom: string
  validTo?: string | null
  createdAt?: string
  updatedAt?: string
  employee?: {
    id: string
    displayName: string
    employeeCode: number
    designation: {
      id: string
      name: string
      attendancePolicy?: {
        autoPresent: boolean
        attendanceExempt: boolean
      } | null
    }
  }
}

export interface UpsertEmployeeAttendanceOverridePayload {
  employeeId: string
  autoPresent: boolean
  attendanceExempt: boolean
  reason?: string
  validFrom?: string
  validTo?: string
}
