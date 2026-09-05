// src/api/error-log.api.ts
import { apiClient, authClient, getToken, getCompanyId } from "./client"
import type {
  ListErrorLogsParams,
  ListErrorLogsResponse,
  FrontendErrorReportPayload,
} from "../types/error-log.types"

export const errorLogApi = {
  list: async (params?: ListErrorLogsParams): Promise<ListErrorLogsResponse> => {
    const { data } = await apiClient.get<ListErrorLogsResponse>("/api/error-logs", {
      params,
    })
    return data
  },

  reportFrontendError: async (
    payload: FrontendErrorReportPayload
  ): Promise<{ message: string; logId?: string }> => {
    // Use authClient to bypass standard axios interceptor loops
    const token = getToken()
    const companyId = getCompanyId()
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = "Bearer " + token
    if (companyId) headers["x-company-id"] = companyId

    const { data } = await authClient.post<{ message: string; logId?: string }>(
      "/api/error-logs/frontend",
      payload,
      { headers }
    )
    return data
  },

  deleteSelected: async (ids: string[]): Promise<{ message?: string; deletedCount: number }> => {
    const { data } = await apiClient.delete<{ message?: string; deletedCount: number }>("/api/error-logs", {
      data: { ids },
    })
    return data
  },

  deleteBulk: async (params?: ListErrorLogsParams): Promise<{ message?: string; deletedCount: number }> => {
    const { data } = await apiClient.delete<{ message?: string; deletedCount: number }>("/api/error-logs/bulk", {
      params,
    })
    return data
  },

  purge: async (days: number = 20): Promise<{ message: string; purgedCount: number }> => {
    const { data } = await apiClient.post<{ message: string; purgedCount: number }>(
      "/api/error-logs/purge",
      { days }
    )
    return data
  },
}
