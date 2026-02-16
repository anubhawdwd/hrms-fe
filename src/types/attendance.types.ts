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
  type: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: string
  source: 'WEB' | 'PWA'
}

export interface AttendanceDay {
  id: string
  employeeId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'PARTIAL' | 'LEAVE'
  totalMinutes: number
  events: AttendanceEvent[]
}