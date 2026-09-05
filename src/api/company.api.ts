// src/api/company.api.ts
import { apiClient } from "./client"
import type { Company, CreateCompanyPayload } from "../types/company.types"
import type { User } from "../types/user.types"

export const companyApi = {
  list: async (): Promise<Company[]> => {
    const { data } = await apiClient.get<Company[]>("/api/company/")
    return data
  },

  create: async (payload: CreateCompanyPayload): Promise<Company> => {
    const { data } = await apiClient.post<Company>("/api/company/", payload)
    return data
  },

  resetAdminPassword: async (
    userId: string,
    manualPassword?: string
  ): Promise<{ message: string; temporaryPassword: string }> => {
    const { data } = await apiClient.post<{ message: string; temporaryPassword: string }>(
      "/api/users/" + userId + "/reset-password",
      { manualPassword }
    )
    return data
  },

  getCompanyUsers: async (companyId: string): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>("/api/company/" + companyId + "/users")
    return data
  },

  resetCompanyUserPassword: async (
    companyId: string,
    userId: string,
    manualPassword?: string
  ): Promise<{ message: string; temporaryPassword?: string }> => {
    const { data } = await apiClient.post<{ message: string; temporaryPassword?: string }>(
      "/api/company/" + companyId + "/users/" + userId + "/reset-password",
      { manualPassword }
    )
    return data
  },
}
