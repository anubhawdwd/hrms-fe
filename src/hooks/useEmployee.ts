// src/hooks/useEmployee.ts
import { useCallback, useEffect, useState, useMemo } from 'react'
import { employeeApi } from '../api/employee.api'
import type {
  EmployeeDetail,
  EmployeeListItem,
  EmployeeHierarchy,
} from '../types/employee.types'

export type EmployeeStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL'

/**
 * Self-profile + hierarchy (Employee Dashboard)
 */
export const useMyProfile = () => {
  const [profile, setProfile] = useState<EmployeeDetail | null>(null)
  const [hierarchy, setHierarchy] = useState<EmployeeHierarchy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const me = await employeeApi.getMe()
      setProfile(me)

      const manager = (me as any).manager ?? null
      const peers = (me as any).peers ?? []
      const reportees = (me as any).subordinates ?? []

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
 * Admin: employee list with 3-state status filtering and local mutation support
 */
export const useEmployeeList = () => {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>('ACTIVE')

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

  const updateEmployeeInList = useCallback((updated: EmployeeListItem) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
    )
  }, [])

  // Derived counts
  const activeCount = useMemo(
    () => employees.filter((e) => e.isActive).length,
    [employees]
  )
  const inactiveCount = useMemo(
    () => employees.filter((e) => !e.isActive).length,
    [employees]
  )
  const totalCount = employees.length

  // Filtered by selected 3-state status
  const filtered = useMemo(() => {
    if (statusFilter === 'ACTIVE') {
      return employees.filter((e) => e.isActive)
    }
    if (statusFilter === 'INACTIVE') {
      return employees.filter((e) => !e.isActive)
    }
    return employees
  }, [employees, statusFilter])

  return {
    rawEmployees: employees,
    employees: filtered,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    activeCount,
    inactiveCount,
    totalCount,
    reload: load,
    updateEmployeeInList,
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
