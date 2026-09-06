// src/api/notification.api.ts
import { apiClient } from './client'
import type {
  ListNotificationsParams,
  ListNotificationsResponse,
} from '../types/notification.types'

export const notificationApi = {
  listNotifications: async (params?: ListNotificationsParams): Promise<ListNotificationsResponse> => {
    const { data } = await apiClient.get<ListNotificationsResponse>('/api/notifications', {
      params,
    })
    return data
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const { data } = await apiClient.get<{ unreadCount: number }>('/api/notifications/unread-count')
    return data
  },

  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.patch<{ success: boolean }>(`/api/notifications/${id}/read`)
    return data
  },

  markAllAsRead: async (): Promise<{ success: boolean; count: number }> => {
    const { data } = await apiClient.post<{ success: boolean; count: number }>('/api/notifications/mark-all-read')
    return data
  },

  deleteAll: async (): Promise<{ success: boolean; count: number }> => {
    const { data } = await apiClient.delete<{ success: boolean; count: number }>("/api/notifications/all")
    return data
  },

  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/api/notifications/${id}`)
    return data
  },
}
