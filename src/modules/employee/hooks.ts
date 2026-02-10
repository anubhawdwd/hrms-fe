import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../store/rootReducer'

import { employeeApi } from './api'
import { leaveApi } from '../leave/api'

import {
  fetchEmployeeStart,
  fetchEmployeeProfileSuccess,
  fetchEmployeeHierarchySuccess,
  employeeError,
} from './slice'

import type {
  EmployeeMini,
  EmployeeHierarchy,
} from './types'

/**
 * Build hierarchy from flat employee list
 */
const buildHierarchy = (
  selfId: string,
  employees: EmployeeMini[],
  managerId?: string
): EmployeeHierarchy => {
  const self = employees.find(e => e.id === selfId)

  const manager = managerId
    ? employees.find(e => e.id === managerId)
    : undefined

  const reportees = employees.filter(
    e => (e as any).managerId === selfId
  )

  const peers = employees.filter(
    e =>
      (e as any).managerId === managerId &&
      e.id !== selfId
  )

  return {
    self: self as any,
    manager,
    peers,
    reportees,
  }
}

/**
 * Bootstrap employee profile + hierarchy
 * Called once on Employee Dashboard mount
 */
export const useEmployeeBootstrap = () => {
  const dispatch = useDispatch()

  const profile = useSelector(
    (state: RootState) => state.employee.profile
  )

  const loadEmployeeContext = useCallback(async () => {
    dispatch(fetchEmployeeStart())

    try {
      // 1️⃣ Fetch self profile
      const selfProfile = await employeeApi.getMe()
      dispatch(fetchEmployeeProfileSuccess(selfProfile))

      // 2️⃣ Fetch employees + leave-today in parallel
      const [allEmployees, leaveToday] = await Promise.all([
        employeeApi.list(),
        leaveApi.getToday('team'), // ✅ explicit scope
      ])

      // 3️⃣ Build leave lookup
      const leaveSet = new Set(
        leaveToday.map(l => l.employeeId)
      )

      // 4️⃣ Enrich employees with leave flag
      const enrichedEmployees: EmployeeMini[] = allEmployees.map(emp => ({
        ...emp,
        isOnLeaveToday: leaveSet.has(emp.id),
      }))

      // 5️⃣ Build hierarchy
      const hierarchy = buildHierarchy(
        selfProfile.id,
        enrichedEmployees,
        (selfProfile as any).managerId
      )

      dispatch(fetchEmployeeHierarchySuccess(hierarchy))
    } catch {
      dispatch(employeeError('Failed to load employee data'))
    }
  }, [dispatch])

  useEffect(() => {
    if (!profile) {
      loadEmployeeContext()
    }
  }, [profile, loadEmployeeContext])
}

/* -------------------- Selectors -------------------- */

export const useEmployeeProfile = () =>
  useSelector((state: RootState) => state.employee.profile)

export const useEmployeeHierarchy = () =>
  useSelector((state: RootState) => state.employee.hierarchy)

export const useEmployeeLoading = () =>
  useSelector((state: RootState) => state.employee.loading)

export const useEmployeeError = () =>
  useSelector((state: RootState) => state.employee.error)
