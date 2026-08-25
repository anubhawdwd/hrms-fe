// src/types/attendance.types.ts
/**
 * Matches backend POST /api/attendance/check-in and check-out
 */
export interface AttendanceCheckRequest {
  source: 'WEB' | 'PWA'
  location: {
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
  status: 'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'
  totalMinutes?: number
  reason: string
}

export interface HrUpdateAttendanceDayPayload {
  status: 'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'
  totalMinutes: number
}

export interface HrAddAttendanceEventPayload {
  employeeId: string
  date: string
  type: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: string
  source: 'WEB' | 'PWA'
  reason: string
}
