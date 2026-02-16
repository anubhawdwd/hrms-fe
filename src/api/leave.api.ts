// src/api/leave.api.ts
import { apiClient } from './client'
import type {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  ApplyLeaveRequest,
  Holiday,
  LeaveTodayResponse,
} from '../types/leave.types'

export const leaveApi = {
  // ─── Types ───
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

  cancel: async (requestId: string): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/cancel`
    )
    return data
  },

  // ─── Approvals (HR) ───
  approve: async (requestId: string): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/approve`
    )
    return data
  },

  reject: async (requestId: string): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<LeaveRequest>(
      `/api/leave/requests/${requestId}/reject`
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
}