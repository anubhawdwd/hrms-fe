// src/api/report.api.ts
import { apiClient } from "./client"
import type { DashboardAttendanceStatus } from "../types/attendance.types"

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
  reportType: "EMPLOYEE"
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
      used: number
      balance: number
      booked?: number
    }
  >
  paidLeavesUsed: number
  paidLeavesBalance: number
  paidLeavesTotal: number
  lwpTotal: number
  absentDays: number
}

export interface LeaveReportPendingWarning {
  warning: "PENDING_LEAVE_APPROVALS"
  hasPending: true
  pendingCount: number
  pendingTotalDays: number
  message: string
}

export interface LeaveReportSuccessResponse {
  reportType: "LEAVE"
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

// ─── ATTENDANCE REPORT TYPES ───

export interface AttendanceReportDayCell {
  date: string
  status: DashboardAttendanceStatus
  checkIn: string | null
  checkOut: string | null
  totalMinutes: number
  leaveType: string | null
  leaveDuration: "FULL_DAY" | "HALF_DAY" | "QUARTER_DAY" | "HOURLY" | null
  holidayName: string | null
  isAutoPresent: boolean
  isExempt: boolean
}

export interface AttendanceReportEmployeeRow {
  employeeId: string
  employeeCode: number | string
  displayName: string
  email: string
  department: string
  designation: string
  team: string
  summary: {
    present: number
    absent: number
    partial: number
    onLeave: number
    pendingLeave: number
    holiday: number
    weekend: number
    unrecorded: number
    totalWorkingDays: number
    totalPresentDays: number
    attendancePercentage: number
  }
  days: Record<string, AttendanceReportDayCell>
}

export interface AttendanceReportHeaderDay {
  date: string
  dayOfWeek: string
  dayNumber: number
  isWeekend: boolean
  holidayName: string | null
}

export interface AttendanceReportResponse {
  reportType: "ATTENDANCE"
  companyName: string
  periodLabel: string
  dateRangeLabel: string
  startDate: string
  endDate: string
  departmentLabel: string
  teamLabel: string
  generatedAt: string
  totalDays: number
  daysHeader: AttendanceReportHeaderDay[]
  totalEmployees: number
  companySummary: {
    totalEmployees: number
    totalWorkingDays: number
    avgAttendancePercentage: number
  }
  dailySummary: Record<
    string,
    {
      present: number
      absent: number
      partial: number
      onLeave: number
      pendingLeave: number
      holiday: number
      weekend: number
      unrecorded: number
    }
  >
  data: AttendanceReportEmployeeRow[]
}

export const reportApi = {
  fetchEmployeeReport: async (params: {
    departmentId?: string
    teamId?: string
    status?: string
    search?: string
  }): Promise<EmployeeReportResponse> => {
    const res = await apiClient.get("/api/reports/employee", { params })
    return res.data
  },

  downloadEmployeeReport: async (
    params: {
      departmentId?: string
      teamId?: string
      status?: string
      search?: string
      format: "excel" | "csv"
    }
  ) => {
    const res = await apiClient.get("/api/reports/employee/export", {
      params,
      responseType: "blob",
    })
    const dateStr = new Date().toISOString().slice(0, 10)
    const ext = params.format === "csv" ? "csv" : "xlsx"
    const fileName = `Employee_Report_${dateStr}.${ext}`

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", fileName)
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
    const res = await apiClient.get("/api/reports/leave", { params })
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
      format: "excel" | "csv"
    }
  ) => {
    const res = await apiClient.get("/api/reports/leave/export", {
      params,
      responseType: "blob",
    })

    // Check if the response returned JSON error/warning instead of blob
    if (res.data.type === "application/json") {
      const text = await res.data.text()
      const json = JSON.parse(text)
      return json
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    const ext = params.format === "csv" ? "csv" : "xlsx"
    const fileName = `Leave_Report_${params.year || dateStr}.${ext}`

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return null
  },

  fetchAttendanceReport: async (params: {
    year?: number
    month?: string
    fromDate?: string
    toDate?: string
    departmentId?: string
    teamId?: string
    employeeId?: string
    search?: string
  }): Promise<AttendanceReportResponse> => {
    const res = await apiClient.get("/api/reports/attendance", { params })
    return res.data
  },

  downloadAttendanceReport: async (
    params: {
      year?: number
      month?: string
      fromDate?: string
      toDate?: string
      departmentId?: string
      teamId?: string
      employeeId?: string
      search?: string
      format: "excel" | "csv"
    }
  ) => {
    const res = await apiClient.get("/api/reports/attendance/export", {
      params,
      responseType: "blob",
    })
    const dateStr = new Date().toISOString().slice(0, 10)
    const ext = params.format === "csv" ? "csv" : "xlsx"
    const fileName = `Attendance_Report_${dateStr}.${ext}`

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
