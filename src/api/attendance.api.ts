// src/api/attendance.api.ts
import { apiClient } from './client'
import type {
  AttendanceCheckRequest,
  AttendanceCheckResponse,
  AttendanceDay,
  AttendanceEvent,
  AttendanceViolation,
  HrUpsertAttendanceDayPayload,
  HrUpdateAttendanceDayPayload,
  HrAddAttendanceEventPayload,
} from '../types/attendance.types'

export const attendanceApi = {
  checkIn: async (
    payload: AttendanceCheckRequest
  ): Promise<AttendanceCheckResponse> => {
    const { data } = await apiClient.post<AttendanceCheckResponse>(
      '/api/attendance/check-in',
      payload
    )
    return data
  },

  checkOut: async (
    payload: AttendanceCheckRequest
  ): Promise<AttendanceCheckResponse> => {
    const { data } = await apiClient.post<AttendanceCheckResponse>(
      '/api/attendance/check-out',
      payload
    )
    return data
  },

  getDay: async (
    date: string,
    employeeId?: string
  ): Promise<AttendanceDay | null> => {
    const { data } = await apiClient.get<AttendanceDay>(
      '/api/attendance/day',
      { params: { date, ...(employeeId ? { employeeId } : {}) } }
    )
    return data
  },

  getRange: async (
    from: string,
    to: string
  ): Promise<AttendanceDay[]> => {
    const { data } = await apiClient.get<AttendanceDay[]>(
      '/api/attendance/range',
      { params: { from, to } }
    )
    return data
  },

  // ─── HR Ops ───
  getViolations: async (params?: {
    employeeId?: string
    from?: string
    to?: string
  }): Promise<AttendanceViolation[]> => {
    const { data } = await apiClient.get<AttendanceViolation[]>(
      '/api/attendance/violations',
      { params }
    )
    return data
  },

  hrUpsertAttendanceDay: async (
    payload: HrUpsertAttendanceDayPayload
  ): Promise<AttendanceDay> => {
    const { data } = await apiClient.post<AttendanceDay>(
      '/api/attendance/hr/attendance-day',
      payload
    )
    return data
  },

  hrUpdateAttendanceDay: async (
    attendanceDayId: string,
    payload: HrUpdateAttendanceDayPayload
  ): Promise<AttendanceDay> => {
    const { data } = await apiClient.patch<AttendanceDay>(
      `/api/attendance/hr/attendance-day/${attendanceDayId}`,
      payload
    )
    return data
  },

  hrAddAttendanceEvent: async (
    payload: HrAddAttendanceEventPayload
  ): Promise<AttendanceEvent> => {
    const { data } = await apiClient.post<AttendanceEvent>(
      '/api/attendance/hr/attendance-event',
      payload
    )
    return data
  },
}
