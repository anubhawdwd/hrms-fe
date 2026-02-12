// src/modules/auth/slice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MeResponse } from './types'

interface AuthState {
  accessToken: string | null
  user: MeResponse | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
}

const initialState: AuthState = {
  accessToken: null,
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

    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },

    setUser(state, action: PayloadAction<MeResponse>) {
      state.user = action.payload
      state.status = 'authenticated'
    },

    setUnauthenticated(state) {
      state.accessToken = null
      state.user = null
      state.status = 'unauthenticated'
    },

    logout(state) {
      state.accessToken = null
      state.user = null
      state.status = 'unauthenticated'
    },
  },
})

export const {
  startLoading,
  setAccessToken,
  setUser,
  setUnauthenticated,
  logout,
} = authSlice.actions

export default authSlice.reducer
