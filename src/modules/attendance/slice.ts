import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AttendanceDay } from './types'

export type AttendanceStatus =
  | 'idle'
  | 'checking-in'
  | 'checked-in'
  | 'checking-out'
  | 'checked-out'
  | 'error'

interface AttendanceState {
  status: AttendanceStatus
  today: AttendanceDay | null
  lastError: string | null
}

const initialState: AttendanceState = {
  status: 'idle',
  today: null,
  lastError: null,
}

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    startCheckIn(state) {
      state.status = 'checking-in'
      state.lastError = null
    },

    checkInSuccess(state, action: PayloadAction<AttendanceDay>) {
      state.status = 'checked-in'
      state.today = action.payload
    },

    startCheckOut(state) {
      state.status = 'checking-out'
      state.lastError = null
    },

    checkOutSuccess(state, action: PayloadAction<AttendanceDay>) {
      state.status = 'checked-out'
      state.today = action.payload
    },

    attendanceError(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.lastError = action.payload
    },

    resetAttendanceState() {
      return initialState
    },
  },
})

export const {
  startCheckIn,
  checkInSuccess,
  startCheckOut,
  checkOutSuccess,
  attendanceError,
  resetAttendanceState,
} = attendanceSlice.actions

export default attendanceSlice.reducer
