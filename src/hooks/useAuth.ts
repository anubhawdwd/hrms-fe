// src/hooks/useAuth.ts
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'

export const useAuth = () => {
  return useSelector((state: RootState) => state.auth)
}

export const useUser = () => {
  return useSelector((state: RootState) => state.auth.user)
}

export const useAuthStatus = () => {
  return useSelector((state: RootState) => state.auth.status)
}