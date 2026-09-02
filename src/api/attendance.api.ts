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
  AttendanceDashboardResponse,
  MyMonthlyAttendanceResponse,
  EmployeeAttendanceOverride,
  UpsertEmployeeAttendanceOverridePayload,
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

  // ─── Employee Self-Service Monthly Overview ───
  getMyMonthly: async (
    month: string
  ): Promise<MyMonthlyAttendanceResponse> => {
    const { data } = await apiClient.get<MyMonthlyAttendanceResponse>(
      '/api/attendance/my-month',
      { params: { month } }
    )
    return data
  },

  // ─── HR Attendance Dashboard Matrix (Phase 5) ───
  getDashboard: async (
    month: string
  ): Promise<AttendanceDashboardResponse> => {
    const { data } = await apiClient.get<AttendanceDashboardResponse>(
      '/api/attendance/dashboard',
      { params: { month } }
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

  // ─── Employee Attendance Overrides ───
  listEmployeeOverrides: async (): Promise<EmployeeAttendanceOverride[]> => {
    const { data } = await apiClient.get<EmployeeAttendanceOverride[]>(
      '/api/attendance/employee-overrides'
    )
    return data
  },

  upsertEmployeeOverride: async (
    payload: UpsertEmployeeAttendanceOverridePayload
  ): Promise<EmployeeAttendanceOverride> => {
    const { data } = await apiClient.post<EmployeeAttendanceOverride>(
      '/api/attendance/employee-override',
      payload
    )
    return data
  },

  deleteEmployeeOverride: async (
    employeeId: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `/api/attendance/employee-override/${employeeId}`
    )
    return data
  },
}
