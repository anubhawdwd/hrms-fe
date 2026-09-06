// src/api/manager.api.ts
import { apiClient } from './client'
import type {
  ReporteeSummary,
  ReporteeLeaveItem,
  ReporteeLeaveFilter,
  ReporteeAttendanceFilter,
} from '../types/manager.types'
import type { AttendanceDashboardResponse } from '../types/attendance.types'

export const managerApi = {
  getReportees: async (): Promise<ReporteeSummary[]> => {
    const res = await apiClient.get('/api/manager/reportees')
    return res.data
  },

  getReporteeLeaves: async (filter?: ReporteeLeaveFilter): Promise<ReporteeLeaveItem[]> => {
    const res = await apiClient.get('/api/manager/leaves', { params: filter })
    return res.data
  },

  getReporteeAttendance: async (filter: ReporteeAttendanceFilter): Promise<AttendanceDashboardResponse> => {
    const res = await apiClient.get('/api/manager/attendance', { params: filter })
    return res.data
  },
}
