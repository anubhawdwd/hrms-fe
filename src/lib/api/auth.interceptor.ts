import type { AxiosInstance } from 'axios'
import { store } from '../../store/store'

export const setupAuthInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    const state = store.getState() as any
    const accessToken = state.auth?.accessToken

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  })
}
