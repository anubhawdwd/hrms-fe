// src/hooks/useEmployee.ts
import { useCallback, useEffect, useState } from 'react'
import { employeeApi } from '../api/employee.api'
import type {
  EmployeeDetail,
  EmployeeListItem,
  EmployeeHierarchy,
} from '../types/employee.types'

/**
 * Self-profile + hierarchy (Employee Dashboard)
 */
export const useMyProfile = () => {
  const [profile, setProfile] = useState<EmployeeDetail | null>(null)
  const [hierarchy, setHierarchy] = useState<EmployeeHierarchy | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [me, allEmployees] = await Promise.all([
        employeeApi.getMe(),
        employeeApi.list(),
      ])

      setProfile(me)

      const manager =
        allEmployees.find((e) => e.id === me.managerId) ?? null

      const peers = me.managerId
        ? allEmployees.filter(
            (e) => e.managerId === me.managerId && e.id !== me.id
          )
        : []

      const reportees = allEmployees.filter(
        (e) => e.managerId === me.id
      )

      setHierarchy({ self: me, manager, peers, reportees })
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { profile, hierarchy, loading, error, reload: load }
}

/**
 * Admin: employee list
 */
export const useEmployeeList = () => {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await employeeApi.list()
      setEmployees(data)
    } catch {
      setError('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = showInactive
    ? employees
    : employees.filter((e) => e.isActive)

  return {
    employees: filtered,
    loading,
    error,
    showInactive,
    toggleInactive: () => setShowInactive((p) => !p),
    reload: load,
  }
}

/**
 * Admin: single employee by ID
 */
export const useEmployeeById = (id?: string) => {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetch = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await employeeApi.getById(id)
        setEmployee(data)
      } catch {
        setError('Failed to load employee')
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [id])

  return { employee, loading, error }
}