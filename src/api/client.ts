// src/api/client.ts
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL

if (!API_BASE) {
  throw new Error('VITE_API_BASE_URL is not defined')
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Separate axios instance for auth calls — NO interceptors
export const authClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── In-memory token + company store ───
let accessToken: string | null = null
let companyId: string | null = null

export const setToken = (token: string | null) => {
  accessToken = token
}
export const getToken = (): string | null => accessToken

export const setCompanyId = (id: string | null) => {
  companyId = id
}
export const getCompanyId = (): string | null => companyId

// ─── Request interceptor: attach token + companyId ───
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (companyId) {
    config.headers['x-company-id'] = companyId
  }
  return config
})

// ─── Response interceptor: 401 → refresh → retry ───
// ONLY for apiClient, NOT authClient
let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}[] = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else if (token) p.resolve(token)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Don't intercept non-401 or already-retried requests
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Don't intercept auth endpoints — they handle their own errors
    const url = original.url || ''
    if (
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/logout')
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(original))
          },
          reject,
        })
      })
    }

    isRefreshing = true

    try {
      // Use authClient (no interceptors) to avoid recursive loop
      const { data } = await authClient.post('/api/auth/refresh')
      const newToken = data.accessToken
      setToken(newToken)
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      setToken(null)
      setCompanyId(null)
      // Do NOT reload the page — let Redux handle it
      // The component tree will react to clearAuth()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)