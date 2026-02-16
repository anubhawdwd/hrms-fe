// src/hooks/useLeave.ts
import { useCallback, useEffect, useState } from 'react'
import { leaveApi } from '../api/leave.api'
import type {
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  Holiday,
  LeaveTodayResponse,
} from '../types/leave.types'

export const useLeaveBalances = (year: number) => {
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leaveApi.getMyBalances(year)
      setBalances(data)
    } catch {
      setBalances([])
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    load()
  }, [load])

  return { balances, loading, reload: load }
}

export const useMyLeaveRequests = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leaveApi.getMyRequests()
      setRequests(data)
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { requests, loading, reload: load }
}

export const useLeaveTypes = () => {
  const [types, setTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await leaveApi.getTypes()
        setTypes(data)
      } catch {
        setTypes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { types, loading }
}

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leaveApi.getHolidays()
      setHolidays(data)
    } catch {
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { holidays, loading, reload: load }
}

export const useTodayLeaves = (
  scope: 'team' | 'hierarchy' | 'company' = 'team'
) => {
  const [data, setData] = useState<LeaveTodayResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await leaveApi.getToday(scope)
        setData(result)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [scope])

  return { data, loading }
}