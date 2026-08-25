// src/api/employee.api.ts
import { apiClient } from './client'
import type {
  CreateEmployeePayload,
  EmployeeDetail,
  EmployeeListItem,
} from '../types/employee.types'

export const employeeApi = {
  getMe: async (): Promise<EmployeeDetail> => {
    const { data } = await apiClient.get<EmployeeDetail>(
      '/api/employees/me'
    )
    return data
  },

  getById: async (id: string): Promise<EmployeeDetail> => {
    const { data } = await apiClient.get<EmployeeDetail>(
      `/api/employees/${id}`
    )
    return data
  },

  create: async (
    payload: CreateEmployeePayload
  ): Promise<EmployeeListItem> => {
    const { data } = await apiClient.post<EmployeeListItem>(
      '/api/employees/',
      payload
    )
    return data
  },

  list: async (): Promise<EmployeeListItem[]> => {
    const { data } = await apiClient.get<EmployeeListItem[]>(
      '/api/employees/'
    )
    return data
  },
}