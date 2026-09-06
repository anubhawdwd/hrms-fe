// src/types/notification.types.ts

export type NotificationType =
  | 'LEAVE_SUBMITTED'
  | 'LEAVE_STAGE_APPROVED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'HOLIDAY_ADDED'
  | 'MANAGER_NUDGE'

export interface NotificationItem {
  id: string
  companyId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  metadata: Record<string, any> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface ListNotificationsParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

export interface ListNotificationsResponse {
  items: NotificationItem[]
  total: number
  unreadCount: number
  page: number
  limit: number
  totalPages: number
}
