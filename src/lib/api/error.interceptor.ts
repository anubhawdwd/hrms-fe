import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { store } from '../../store/store'

let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (error: AxiosError) => void
}[] = []

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

export const setupErrorInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean
      }

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(client(originalRequest))
            },
            reject,
          })
        })
      }

      isRefreshing = true

      try {
        const response = await axios.post(
          `${client.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = response.data?.accessToken

        if (!newAccessToken) {
          throw error
        }

        store.dispatch({
          type: 'auth/setAccessToken',
          payload: newAccessToken,
        })

        client.defaults.headers.Authorization = `Bearer ${newAccessToken}`
        processQueue(null, newAccessToken)

        return client(originalRequest)
      } catch (refreshError: any) {
        processQueue(refreshError, null)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
  )
}
