// src/store/auth.slice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MeResponse } from '../types/auth.types'

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'

interface AuthState {
  user: MeResponse | null
  status: AuthStatus
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    startLoading(state) {
      state.status = 'loading'
    },
    setUser(state, action: PayloadAction<MeResponse>) {
      state.user = action.payload
      state.status = 'authenticated'
    },
    clearAuth(state) {
      state.user = null
      state.status = 'unauthenticated'
    },
  },
})

export const { startLoading, setUser, clearAuth } = authSlice.actions
export default authSlice.reducer