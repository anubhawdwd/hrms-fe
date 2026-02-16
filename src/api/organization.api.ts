// src/api/organization.api.ts
import { apiClient } from './client'
import type {
  Department,
  Team,
  Designation,
  OfficeLocation,
} from '../types/organization.types'

export const organizationApi = {
  // ─── Departments ───
  listDepartments: async (): Promise<Department[]> => {
    const { data } = await apiClient.get<Department[]>(
      '/api/organization/departments'
    )
    return data
  },

  createDepartment: async (name: string): Promise<Department> => {
    const { data } = await apiClient.post<Department>(
      '/api/organization/departments',
      { name }
    )
    return data
  },

  // ─── Teams ───
  listTeams: async (departmentId: string): Promise<Team[]> => {
    const { data } = await apiClient.get<Team[]>(
      '/api/organization/teams',
      { params: { departmentId } }
    )
    return data
  },

  createTeam: async (
    name: string,
    departmentId: string
  ): Promise<Team> => {
    const { data } = await apiClient.post<Team>(
      '/api/organization/teams',
      { name, departmentId }
    )
    return data
  },

  // ─── Designations ───
  listDesignations: async (): Promise<Designation[]> => {
    const { data } = await apiClient.get<Designation[]>(
      '/api/organization/designations'
    )
    return data
  },

  createDesignation: async (name: string): Promise<Designation> => {
    const { data } = await apiClient.post<Designation>(
      '/api/organization/designations',
      { name }
    )
    return data
  },

  // ─── Office Location ───
  getOfficeLocation: async (): Promise<OfficeLocation | null> => {
    const { data } = await apiClient.get<OfficeLocation>(
      '/api/organization/office-location'
    )
    return data
  },
}