// src/api/employee.api.ts
import { apiClient } from "./client"
import type {
  CreateEmployeePayload,
  EmployeeDetail,
  EmployeeListItem,
  OnboardEmployeePayload,
  UpdateEmployeeAdminPayload,
} from "../types/employee.types"

export const employeeApi = {
  getMe: async (): Promise<EmployeeDetail> => {
    const { data } = await apiClient.get<EmployeeDetail>(
      "/api/employees/me"
    )
    return data
  },

  getById: async (id: string): Promise<EmployeeDetail> => {
    const { data } = await apiClient.get<EmployeeDetail>(
      "/api/employees/" + id
    )
    return data
  },

  onboard: async (
    payload: OnboardEmployeePayload
  ): Promise<EmployeeDetail & { temporaryPassword?: string }> => {
    const { data } = await apiClient.post<EmployeeDetail & { temporaryPassword?: string }>(
      "/api/employees/onboard",
      payload
    )
    return data
  },

  create: async (
    payload: CreateEmployeePayload
  ): Promise<EmployeeListItem> => {
    const { data } = await apiClient.post<EmployeeListItem>(
      "/api/employees/",
      payload
    )
    return data
  },

  list: async (): Promise<EmployeeListItem[]> => {
    const { data } = await apiClient.get<EmployeeListItem[]>(
      "/api/employees/"
    )
    return data
  },

  updateAdmin: async (
    employeeId: string,
    payload: UpdateEmployeeAdminPayload
  ): Promise<EmployeeDetail> => {
    const { data } = await apiClient.patch<EmployeeDetail>(
      "/api/employees/" + employeeId + "/admin",
      payload
    )
    return data
  },

  changeManager: async (
    employeeId: string,
    managerId?: string | null
  ): Promise<EmployeeDetail> => {
    const { data } = await apiClient.patch<EmployeeDetail>(
      "/api/employees/" + employeeId + "/manager",
      { managerId: managerId ?? null }
    )
    return data
  },

  deactivate: async (
    employeeId: string,
    payload?: { effectiveDate?: string; reason?: string }
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      "/api/employees/" + employeeId,
      { data: payload }
    )
    return data
  },

  offboard: async (
    employeeId: string,
    payload?: { effectiveDate?: string; reason?: string }
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(
      "/api/employees/" + employeeId + "/offboard",
      payload
    )
    return data
  },

  reactivate: async (
    employeeId: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(
      "/api/employees/" + employeeId + "/reactivate"
    )
    return data
  },
}
