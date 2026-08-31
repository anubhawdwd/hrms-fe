// src/api/organization.api.ts
import { apiClient } from './client'
import type {
  Department,
  Team,
  Designation,
  DesignationAttendancePolicy,
  UpsertDesignationAttendancePolicyPayload,
  OfficeLocation,
  SetOfficeLocationPayload,
  UpdateOfficeLocationPayload,
  WorkingHoursConfig,
  UpdateWorkingHoursPayload,
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

  updateDepartment: async (
    departmentId: string,
    name: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/organization/departments/${departmentId}`,
      { name }
    )
    return data
  },

  deactivateDepartment: async (
    departmentId: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `/api/organization/departments/${departmentId}`
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

  updateTeam: async (
    teamId: string,
    payload: { name?: string; departmentId?: string }
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/organization/teams/${teamId}`,
      payload
    )
    return data
  },

  deactivateTeam: async (
    teamId: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `/api/organization/teams/${teamId}`
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

  updateDesignation: async (
    designationId: string,
    name: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/organization/designations/${designationId}`,
      { name }
    )
    return data
  },

  deactivateDesignation: async (
    designationId: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `/api/organization/designations/${designationId}`
    )
    return data
  },

  // ─── Designation Attendance Policy ───
  listDesignationAttendancePolicies: async (): Promise<
    DesignationAttendancePolicy[]
  > => {
    const { data } = await apiClient.get<DesignationAttendancePolicy[]>(
      '/api/organization/designation-attendance-policy'
    )
    return data
  },

  getDesignationAttendancePolicy: async (
    designationId: string
  ): Promise<DesignationAttendancePolicy | null> => {
    const { data } = await apiClient.get<DesignationAttendancePolicy | null>(
      `/api/organization/designation-attendance-policy/${designationId}`
    )
    return data
  },

  upsertDesignationAttendancePolicy: async (
    payload: UpsertDesignationAttendancePolicyPayload
  ): Promise<DesignationAttendancePolicy> => {
    const { data } = await apiClient.post<DesignationAttendancePolicy>(
      '/api/organization/designation-attendance-policy',
      payload
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

  setOfficeLocation: async (
    payload: SetOfficeLocationPayload
  ): Promise<OfficeLocation> => {
    const { data } = await apiClient.post<OfficeLocation>(
      '/api/organization/office-location',
      payload
    )
    return data
  },

  updateOfficeLocation: async (
    payload: UpdateOfficeLocationPayload
  ): Promise<OfficeLocation> => {
    const { data } = await apiClient.patch<OfficeLocation>(
      '/api/organization/office-location',
      payload
    )
    return data
  },

  // ─── Working Hours Configuration ───
  getWorkingHoursConfig: async (): Promise<WorkingHoursConfig> => {
    const { data } = await apiClient.get<WorkingHoursConfig>(
      '/api/organization/working-hours'
    )
    return data
  },

  updateWorkingHoursConfig: async (
    payload: UpdateWorkingHoursPayload
  ): Promise<WorkingHoursConfig> => {
    const { data } = await apiClient.patch<WorkingHoursConfig>(
      '/api/organization/working-hours',
      payload
    )
    return data
  },

  // ─── Company Teams Setting ───
  getTeamsSetting: async (): Promise<{ usesTeams: boolean }> => {
    const { data } = await apiClient.get<{ usesTeams: boolean }>(
      '/api/organization/teams-setting'
    )
    return data
  },

  updateTeamsSetting: async (
    usesTeams: boolean
  ): Promise<{ usesTeams: boolean }> => {
    const { data } = await apiClient.patch<{ usesTeams: boolean }>(
      '/api/organization/teams-setting',
      { usesTeams }
    )
    return data
  },
}

export const getTeamsSetting = async (): Promise<{ usesTeams: boolean }> => {
  const res = await apiClient.get('/api/organization/teams-setting')
  return res.data
}

export const updateTeamsSetting = async (usesTeams: boolean): Promise<{ usesTeams: boolean }> => {
  const res = await apiClient.patch('/api/organization/teams-setting', { usesTeams })
  return res.data
}
