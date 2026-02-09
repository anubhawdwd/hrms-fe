import { apiClient } from '../../lib/api/apiClient'
import type {
  AttendanceEventRequest,
  AttendanceEventResponse,
  AttendanceDay,
  AttendanceRangeResponse,
} from './types'

export const attendanceApi = {
  checkIn: async (payload: AttendanceEventRequest) => {
    const { data } = await apiClient.post<AttendanceEventResponse>(
      '/api/attendance/check-in',
      payload
    )
    return data
  },

  checkOut: async (payload: AttendanceEventRequest) => {
    const { data } = await apiClient.post<AttendanceEventResponse>(
      '/api/attendance/check-out',
      payload
    )
    return data
  },

  getDay: async (employeeId: string, date: string) => {
    const { data } = await apiClient.get<AttendanceDay>(
      '/api/attendance/day',
      {
        params: { employeeId, date },
      }
    )
    return data
  },

  getRange: async (
    employeeId: string,
    from: string,
    to: string
  ) => {
    const { data } = await apiClient.get<AttendanceRangeResponse>(
      '/api/attendance/range',
      {
        params: { employeeId, from, to },
      }
    )
    return data
  },
}
