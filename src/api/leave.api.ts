// src/api/leave.api.ts
import { apiClient } from './client'
import type {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestWithEmployee,
  LeaveRequestStatus,
  ApplyLeaveRequest,
  Holiday,
  LeaveTodayResponse,
  LeavePolicy,
  RolloverPreviewResult,
  RunRolloverPayload,
  RunRolloverResponse,
  BulkAllocatePayload,
  BulkAllocateResult,
} from '../types/leave.types'

export const leaveApi = {
  // ─── Types ───
  createType: async (payload: {
    name: string
    code: string
    isPaid?: boolean
    autoGrantOnOnboarding?: boolean
    isActive?: boolean
  }): Promise<LeaveType> => {
    const { data } = await apiClient.post<LeaveType>('/api/leave/types', payload)
    return data
  },

  updateType: async (
    id: string,
    payload: {
      name?: string
      code?: string
      isPaid?: boolean
      autoGrantOnOnboarding?: boolean
      isActive?: boolean
    }
  ): Promise<LeaveType> => {
    const { data } = await apiClient.patch<LeaveType>(`/api/leave/types/${id}`, payload)
    return data
  },

  getTypes: async (): Promise<LeaveType[]> => {
    const { data } = await apiClient.get<LeaveType[]>('/api/leave/types')
    return data
  },

  // ─── Balance ───
  getMyBalances: async (year: number): Promise<LeaveBalance[]> => {
    const { data } = await apiClient.get<LeaveBalance[]>(
      '/api/leave/balances/my',
      { params: { year } }
    )
    return data
  },

  getEmployeeBalances: async (
    employeeId: string,
    year?: number
  ): Promise<LeaveBalance[]> => {
    const { data } = await apiClient.get<LeaveBalance[]>(
      `/api/leave/balances/employee/${employeeId}`,
      { params: year ? { year } : undefined }
    )
    return data
  },

  adjustEmployeeBalance: async (
    employeeId: string,
    payload: {
      leaveTypeId: string
      newBalance?: number
      allocated?: number
      year?: number
      reason?: string
    }
  ): Promise<LeaveBalance> => {
    const { data } = await apiClient.put<LeaveBalance>(
      `/api/leave/balances/employee/${employeeId}`,
      payload
    )
    return data
  },

  markLeaveAdmin: async (payload: {
    employeeId: string
    leaveTypeId: string
    fromDate: string
    toDate: string
    durationType: string
    slot?: string
    startTime?: string
    endTime?: string
    reason?: string
  }): Promise<LeaveRequest> => {
    const { data } = await apiClient.post<LeaveRequest>(
      '/api/leave/requests/admin/mark',
      payload
    )
    return data
  },

  bulkAllocateBalances: async (
    payload: BulkAllocatePayload
  ): Promise<BulkAllocateResult> => {
    const { data } = await apiClient.post<BulkAllocateResult>(
      '/api/leave/balances/bulk-allocate',
      payload
    )
    return data
  },


  // ─── Policies ───
  getPolicies: async (): Promise<LeavePolicy[]> => {
    const { data } = await apiClient.get<LeavePolicy[]>('/api/leave/policies')
    return data
  },

  upsertPolicy: async (payload: {
    leaveTypeId: string
    yearlyAllocation: number
    allowCarryForward: boolean
    maxCarryForward?: number | null
    allowEncashment: boolean
    probationAllowed: boolean
    genderRestriction?: string | null
    monthlyAccrual: boolean
  }): Promise<LeavePolicy> => {
    const { data } = await apiClient.post<LeavePolicy>(
      '/api/leave/policies',
      payload
    )
    return data
  },

  previewRollover: async (payload: {
    fromYear: number
    toYear: number
  }): Promise<RolloverPreviewResult> => {
    const { data } = await apiClient.post<RolloverPreviewResult>(
      '/api/leave/rollover/preview',
      payload
    )
    return data
  },

  runRollover: async (payload: RunRolloverPayload): Promise<RunRolloverResponse> => {
    const { data } = await apiClient.post<RunRolloverResponse>(
      '/api/leave/rollover',
      payload
    )
    return data
  },

  // ─── Requests ───
  apply: async (payload: ApplyLeaveRequest): Promise<LeaveRequest> => {
    const { data } = await apiClient.post<LeaveRequest>(
      '/api/leave/requests',
      payload
    )
    return data
  },

  getMyRequests: async (): Promise<LeaveRequest[]> => {
    const { data } = await apiClient.get<LeaveRequest[]>(
      '/api/leave/requests/my'
    )
    return data
  },

  getPendingRequests: async (): Promise<LeaveRequestWithEmployee[]> => {
    const { data } = await apiClient.get<LeaveRequestWithEmployee[]>(
      '/api/leave/requests/pending'
    )
    return data
  },

  getRecentRequests: async (
    status: LeaveRequestStatus = 'APPROVED',
    days: number = 7
  ): Promise<LeaveRequestWithEmployee[]> => {
    const { data } = await apiClient.get<LeaveRequestWithEmployee[]>(
      '/api/leave/requests/recent',
      { params: { status, days } }
    )
    return data
  },

  getEmployeeRequests: async (
    employeeId: string
  ): Promise<LeaveRequest[]> => {
    const { data } = await apiClient.get<LeaveRequest[]>(
      `/api/leave/requests/employee/${employeeId}`
    )
    return data
  },

  getApprovedRequests: async (
    days: number = 30
  ): Promise<LeaveRequestWithEmployee[]> => {
    const { data } = await apiClient.get<LeaveRequestWithEmployee[]>(
      '/api/leave/requests/recent',
      { params: { status: 'APPROVED', days } }
    )
    return data
  },

  deleteDays: async (requestId: string, dayIds: string[]): Promise<LeaveRequest | { deletedRequestId: string; remainingDaysCount: number }> => {
    const { data } = await apiClient.delete<LeaveRequest | { deletedRequestId: string; remainingDaysCount: number }>(
      `/api/leave/requests/${requestId}/days`,
      { data: { dayIds } }
    )
    return data
  },

  deleteRequest: async (requestId: string): Promise<{ success: boolean; message: string; revertedDays?: number }> => {
    const { data } = await apiClient.delete<{ success: boolean; message: string; revertedDays?: number }>(
      `/api/leave/requests/${requestId}`
    )
    return data
  },

  cancel: async (requestId: string): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/cancel`
    )
    return data
  },

  // ─── Approvals (HR) ───
  updateDayStatus: async (
    requestId: string,
    dayId: string,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/days/${dayId}/status`,
      { status }
    )
    return data
  },
  approve: async (requestId: string): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/approve`
    )
    return data
  },

  reject: async (
    requestId: string,
    reason?: string
  ): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/reject`,
      { reason }
    )
    return data
  },

  hrCancel: async (
    requestId: string,
    reason?: string
  ): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/hr-cancel`,
      { reason }
    )
    return data
  },

  // ─── HR Sandwich Bridge Day Exception ───
  exemptSandwichDay: async (
    requestId: string,
    dayId: string,
    exempt: boolean = true
  ): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/sandwich-days/${dayId}/exempt`,
      { exempt }
    )
    return data
  },

  // ─── Today ───
  getToday: async (
    scope: 'team' | 'hierarchy' | 'company'
  ): Promise<LeaveTodayResponse> => {
    const { data } = await apiClient.get<LeaveTodayResponse>(
      '/api/leave/today',
      { params: { scope } }
    )
    return data
  },

  // ─── Holidays ───
  getHolidays: async (): Promise<Holiday[]> => {
    const { data } = await apiClient.get<Holiday[]>(
      '/api/leave/holidays'
    )
    return data
  },

  createHoliday: async (payload: {
    name: string
    date: string
    type?: "NORMAL" | "RESTRICTED"
  }): Promise<Holiday> => {
    const { data } = await apiClient.post<Holiday>(
      '/api/leave/holidays',
      payload
    )
    return data
  },

  deleteHoliday: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/leave/holidays/${id}`)
  },
  // LWP / Unpaid Leave Report
  nudgeManager: async (requestId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      `/api/leave/requests/${requestId}/nudge`
    )
    return data
  },

  getLwpReport: async (year?: number, month?: number) => {
    const res = await apiClient.get('/api/leave/reports/lwp', {
      params: { year, month },
    })
    return res.data
  },
}
