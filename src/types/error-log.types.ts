// src/types/error-log.types.ts
export interface ErrorLogItem {
  id: string
  source: "BACKEND" | "FRONTEND"
  statusCode: number | null
  message: string
  stackTrace: string | null
  endpoint: string | null
  method: string | null
  requestBody: any
  userId: string | null
  companyId: string | null
  companyName?: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface ListErrorLogsParams {
  page?: number
  limit?: number
  source?: "BACKEND" | "FRONTEND" | "ALL"
  statusCode?: number
  companyId?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface ListErrorLogsResponse {
  items: ErrorLogItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FrontendErrorReportPayload {
  message: string
  stackTrace?: string | null
  endpoint?: string | null
  url?: string | null
  statusCode?: number | null
  requestBody?: any
  userId?: string | null
  companyId?: string | null
}
