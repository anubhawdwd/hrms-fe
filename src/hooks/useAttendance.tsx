import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { attendanceApi } from '../api/attendance.api'
import { getCurrentLocation } from '../utils/geo'
import { mapGeoErrorToAppError } from '../utils/geoPolicy'
import type {
  AttendanceCheckResponse,
  AttendanceDay,
} from '../types/attendance.types'

export const useCheckIn = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AttendanceCheckResponse | null>(null)

  const checkIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const coords = await getCurrentLocation()
      const response = await attendanceApi.checkIn({
        source: 'WEB',
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      })
      setResult(response)
      return response
    } catch (err: any) {
      const msg = err?.code
        ? mapGeoErrorToAppError(err).message
        : err?.response?.data?.message || 'Check-in failed'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { checkIn, loading, error, result }
}

export const useCheckOut = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AttendanceCheckResponse | null>(null)

  const checkOut = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const coords = await getCurrentLocation()
      const response = await attendanceApi.checkOut({
        source: 'WEB',
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      })
      setResult(response)
      return response
    } catch (err: any) {
      const msg = err?.code
        ? mapGeoErrorToAppError(err).message
        : err?.response?.data?.message || 'Check-out failed'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { checkOut, loading, error, result }
}

export const useTodayAttendance = () => {
  const [day, setDay] = useState<AttendanceDay | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = dayjs().format('YYYY-MM-DD')
      const data = await attendanceApi.getDay(today)
      setDay(data)
    } catch {
      setDay(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return { day, loading, load }
}

export const useWeeklyAttendance = (weekOffset: number = 0) => {
  const [days, setDays] = useState<AttendanceDay[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const start = dayjs()
          .startOf('week')
          .add(weekOffset * 7, 'day')
        const end = start.add(6, 'day')

        const data = await attendanceApi.getRange(
          start.format('YYYY-MM-DD'),
          end.format('YYYY-MM-DD')
        )
        setDays(data)
      } catch {
        setDays([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [weekOffset])

  return { days, loading }
}