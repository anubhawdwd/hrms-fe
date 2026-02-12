import { useCallback, useEffect, useState } from 'react'
import { employeeApi } from './api'
import type { EmployeeMini } from './types'
import type { EmployeeProfile } from './types'

export interface UseAdminEmployeeListResult {
  employees: EmployeeMini[]
  loading: boolean
  error?: string
  showInactive: boolean
  toggleShowInactive: () => void
}

/**
 * Admin/HR employee list hook (read-only)
 * - Default: active employees only
 * - Optional: include inactive employees
 */
export const useAdminEmployeeList = (): UseAdminEmployeeListResult => {
  const [allEmployees, setAllEmployees] = useState<EmployeeMini[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showInactive, setShowInactive] = useState(false)

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setError(undefined)

    try {
      const data = await employeeApi.list()
      setAllEmployees(data)
    } catch {
      setError('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const toggleShowInactive = () => {
    setShowInactive(prev => !prev)
  }

  const employees = showInactive
    ? allEmployees
    : allEmployees.filter(e => e.isActive)

  return {
    employees,
    loading,
    error,
    showInactive,
    toggleShowInactive,
  }
}


export const useAdminEmployeeById = (employeeId?: string) => {
  const [data, setData] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!employeeId) return

    const fetchEmployee = async () => {
      setLoading(true)
      setError(undefined)

      try {
        const response = await employeeApi.getById(employeeId)
        setData(response)
      } catch {
        setError('Failed to load employee profile')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [employeeId])

  return { data, loading, error }
}
