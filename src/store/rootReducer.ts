import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '../modules/auth/slice'
import attendanceReducer from '../modules/attendance/slice'
import employeeReducer from '../modules/employee/slice'

export const rootReducer = combineReducers({
  auth: authReducer,
  attendance: attendanceReducer,
  employee: employeeReducer,
  ui: (state = {}) => state,
})

export type RootState = ReturnType<typeof rootReducer>
