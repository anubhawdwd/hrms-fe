// src/lib/api/apiClient.ts
import axios from 'axios'
import { setupAuthInterceptor } from './auth.interceptor'
import { setupCompanyInterceptor } from './company.interceptor'
import { setupErrorInterceptor } from './error.interceptor'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined')
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

setupAuthInterceptor(apiClient)
setupCompanyInterceptor(apiClient)
setupErrorInterceptor(apiClient)