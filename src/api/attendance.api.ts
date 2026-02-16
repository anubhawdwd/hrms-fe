// src/api/attendance.api.ts
import { apiClient } from './client'
import type {
  AttendanceCheckRequest,
  AttendanceCheckResponse,
  AttendanceDay,
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

  getDay: async (date: string): Promise<AttendanceDay | null> => {
    const { data } = await apiClient.get<AttendanceDay>(
      '/api/attendance/day',
      { params: { date } }
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
}