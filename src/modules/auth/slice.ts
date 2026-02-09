import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MeResponse } from './types'

interface AuthState {
  accessToken: string | null
  user: MeResponse | null
  role: string | null
  companyId: string | null
  isAuthenticated: boolean
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  role: null,
  companyId: null,
  isAuthenticated: false,
  status: 'idle',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
      state.isAuthenticated = true
      state.status = 'authenticated'
    },

    setUser(state, action: PayloadAction<MeResponse>) {
      state.user = action.payload
      state.role = action.payload.role
      state.companyId = action.payload.companyId ?? null
    },

    logout(state) {
      state.accessToken = null
      state.user = null
      state.role = null
      state.companyId = null
      state.isAuthenticated = false
      state.status = 'unauthenticated'
    },
  },
})

export const { setAccessToken, setUser, logout } = authSlice.actions
export default authSlice.reducer
