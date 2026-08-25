// src/api/user.api.ts
import { apiClient } from './client'
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from '../types/user.types'

export const userApi = {
  create: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await apiClient.post<User>('/api/users/', payload)
    return data
  },

  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/api/users/')
    return data
  },

  update: async (
    userId: string,
    payload: UpdateUserPayload
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/users/${userId}`,
      payload
    )
    return data
  },

  deactivate: async (userId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `/api/users/${userId}`
    )
    return data
  },
}
