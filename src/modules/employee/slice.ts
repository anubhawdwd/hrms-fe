import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  EmployeeProfile,
  EmployeeHierarchy,
} from './types'

interface EmployeeState {
  profile: EmployeeProfile | null
  hierarchy: EmployeeHierarchy | null
  loading: boolean
  error: string | null
}

const initialState: EmployeeState = {
  profile: null,
  hierarchy: null,
  loading: false,
  error: null,
}

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    fetchEmployeeStart(state) {
      state.loading = true
      state.error = null
    },

    fetchEmployeeProfileSuccess(
      state,
      action: PayloadAction<EmployeeProfile>
    ) {
      state.profile = action.payload
      state.loading = false
    },

    fetchEmployeeHierarchySuccess(
      state,
      action: PayloadAction<EmployeeHierarchy>
    ) {
      state.hierarchy = action.payload
      state.loading = false
    },

    employeeError(state, action: PayloadAction<string>) {
      state.loading = false
      state.error = action.payload
    },

    resetEmployeeState() {
      return initialState
    },
  },
})

export const {
  fetchEmployeeStart,
  fetchEmployeeProfileSuccess,
  fetchEmployeeHierarchySuccess,
  employeeError,
  resetEmployeeState,
} = employeeSlice.actions

export default employeeSlice.reducer
