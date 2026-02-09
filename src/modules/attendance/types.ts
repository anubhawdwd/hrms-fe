export type AttendanceSource = 'WEB' | 'MOBILE'
export type AttendanceLocation = 'OFFICE' | 'REMOTE'

export interface AttendanceEventRequest {
  employeeId: string
  source: AttendanceSource
  location: AttendanceLocation
  geo: {
    latitude: number
    longitude: number
    accuracy: number
  }
}

export interface AttendanceEventResponse {
  id: string
  type: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: string
}

export interface AttendanceDay {
  id: string
  employeeId: string
  date: string // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'PARTIAL'
  totalMinutes?: number
  checkInTime?: string
  checkOutTime?: string
}

export interface AttendanceRangeResponse {
  days: AttendanceDay[]
}
