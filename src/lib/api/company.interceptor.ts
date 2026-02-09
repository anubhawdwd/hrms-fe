import type { AxiosInstance } from 'axios'
import { store } from '../../store/store'

export const setupCompanyInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    const state = store.getState() as any
    const companyId = state.company?.activeCompanyId

    if (companyId) {
      config.headers['x-company-id'] = companyId
    }

    return config
  })
}
