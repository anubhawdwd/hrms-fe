// src/api/report.api.ts
import { apiClient } from './client'

export interface EmployeeReportRow {
  employeeCode: number | string
  displayName: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  personalEmail: string
  phone: string
  designation: string
  department: string
  team: string
  primaryReportingManager: string
  joiningDate: string
  dateOfBirth: string
  employmentStatus: string
  employeeType: string
  role: string
  authProvider: string
}

export interface EmployeeReportResponse {
  reportType: 'EMPLOYEE'
  companyName: string
  departmentLabel: string
  teamLabel: string
  statusLabel: string
  generatedAt: string
  totalEmployees: number
  data: EmployeeReportRow[]
}

export interface DynamicLeaveTypeColumn {
  id: string
  name: string
  code: string
  isPaid: boolean
}

export interface LeaveReportEmployeeRow {
  employeeId: string
  employeeCode: number | string
  displayName: string
  email: string
  department: string
  designation: string
  team: string
  leaveTypeMetrics: Record<
    string,
    {
      booked: number
      balance: number
    }
  >
  paidLeavesTotal: number
  lwpTotal: number
  absentDays: number
}

export interface LeaveReportPendingWarning {
  warning: 'PENDING_LEAVE_APPROVALS'
  hasPending: true
  pendingCount: number
  pendingTotalDays: number
  message: string
}

export interface LeaveReportSuccessResponse {
  reportType: 'LEAVE'
  companyName: string
  year: number
  fromDate?: string
  toDate?: string
  periodLabel: string
  dateRangeLabel: string
  departmentLabel: string
  teamLabel: string
  generatedAt: string
  totalEmployees: number
  leaveTypes: DynamicLeaveTypeColumn[]
  hasPendingWarning: boolean
  pendingCount: number
  pendingTotalDays: number
  reportNote?: string
  data: LeaveReportEmployeeRow[]
}

export type LeaveReportResponse = LeaveReportPendingWarning | LeaveReportSuccessResponse

export const reportApi = {
  fetchEmployeeReport: async (params: {
    departmentId?: string
    teamId?: string
    status?: string
    search?: string
  }): Promise<EmployeeReportResponse> => {
    const res = await apiClient.get('/api/reports/employee', { params })
    return res.data
  },

  downloadEmployeeReport: async (
    params: {
      departmentId?: string
      teamId?: string
      status?: string
      search?: string
      format: 'excel' | 'csv'
    }
  ) => {
    const res = await apiClient.get('/api/reports/employee/export', {
      params,
      responseType: 'blob',
    })
    const dateStr = new Date().toISOString().slice(0, 10)
    const ext = params.format === 'csv' ? 'csv' : 'xlsx'
    const fileName = `Employee_Report_${dateStr}.${ext}`

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  fetchLeaveReport: async (params: {
    year?: number
    fromDate?: string
    toDate?: string
    departmentId?: string
    teamId?: string
    employeeId?: string
    confirmPending?: boolean
  }): Promise<LeaveReportResponse> => {
    const res = await apiClient.get('/api/reports/leave', { params })
    return res.data
  },

  downloadLeaveReport: async (
    params: {
      year?: number
      fromDate?: string
      toDate?: string
      departmentId?: string
      teamId?: string
      employeeId?: string
      confirmPending?: boolean
      format: 'excel' | 'csv'
    }
  ) => {
    const res = await apiClient.get('/api/reports/leave/export', {
      params,
      responseType: 'blob',
    })

    // Check if the response returned JSON error/warning instead of blob
    if (res.data.type === 'application/json') {
      const text = await res.data.text()
      const json = JSON.parse(text)
      return json
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    const ext = params.format === 'csv' ? 'csv' : 'xlsx'
    const fileName = `Leave_Report_${params.year || dateStr}.${ext}`

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return null
  },
}
