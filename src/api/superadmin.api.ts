// src/api/superadmin.api.ts
import { apiClient } from "./client"
import type {
  SuperAdminUser,
  CreateSuperAdminPayload,
  CreateSuperAdminResponse,
  ResetPasswordResponse,
} from "../types/superadmin.types"

export const superadminApi = {
  list: async (): Promise<SuperAdminUser[]> => {
    const { data } = await apiClient.get<SuperAdminUser[]>("/api/superadmins")
    return data
  },

  create: async (payload: CreateSuperAdminPayload): Promise<CreateSuperAdminResponse> => {
    const { data } = await apiClient.post<CreateSuperAdminResponse>("/api/superadmins", payload)
    return data
  },

  resetPassword: async (
    userId: string,
    manualPassword?: string
  ): Promise<ResetPasswordResponse> => {
    const { data } = await apiClient.post<ResetPasswordResponse>(
      "/api/superadmins/" + userId + "/reset-password",
      { manualPassword }
    )
    return data
  },

  deactivate: async (userId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>("/api/superadmins/" + userId)
    return data
  },
}
