import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../store/rootReducer'
import { getCurrentLocation } from '../../utils/geo'
import { mapGeoErrorToAppError } from '../../utils/geoPolicy'
import { attendanceApi } from './api'
import {
  startCheckIn,
  checkInSuccess,
  startCheckOut,
  checkOutSuccess,
  attendanceError,
} from './slice'

/**
 * Check-in orchestration hook
 */
export const useCheckIn = () => {
  const dispatch = useDispatch()

  const employeeId = useSelector(
    (state: RootState) => state.auth.user?.id
  )

  const status = useSelector(
    (state: RootState) => state.attendance.status
  )

  const checkIn = useCallback(async () => {
    if (status === 'checking-in' || status === 'checked-in') {
      return
    }

    if (!employeeId) {
      dispatch(attendanceError('Employee context not found'))
      return
    }

    dispatch(startCheckIn())

    try {
      const coords = await getCurrentLocation()

      const event = await attendanceApi.checkIn({
        employeeId,
        source: 'WEB',
        location: 'OFFICE',
        geo: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        },
      })

      dispatch(
        checkInSuccess({
          id: event.id,
          employeeId,
          date: new Date().toISOString().slice(0, 10),
          status: 'PRESENT',
          checkInTime: event.timestamp,
        })
      )
    } catch (err: any) {
      if (err?.code) {
        const appError = mapGeoErrorToAppError(err)
        dispatch(attendanceError(appError.message))
      } else {
        dispatch(attendanceError('Check-in failed'))
      }
    }
  }, [dispatch, employeeId, status])

  return { checkIn }
}

/**
 * Check-out orchestration hook
 */
export const useCheckOut = () => {
  const dispatch = useDispatch()

  const employeeId = useSelector(
    (state: RootState) => state.auth.user?.id
  )

  const status = useSelector(
    (state: RootState) => state.attendance.status
  )

  const checkOut = useCallback(async () => {
    if (status !== 'checked-in') {
      dispatch(attendanceError('You must check in before checking out'))
      return
    }

    if (!employeeId) {
      dispatch(attendanceError('Employee context not found'))
      return
    }

    dispatch(startCheckOut())

    try {
      const coords = await getCurrentLocation()

      const event = await attendanceApi.checkOut({
        employeeId,
        source: 'WEB',
        location: 'OFFICE',
        geo: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        },
      })

      dispatch(
        checkOutSuccess({
          id: event.id,
          employeeId,
          date: new Date().toISOString().slice(0, 10),
          status: 'PRESENT',
          checkOutTime: event.timestamp,
        })
      )
    } catch (err: any) {
      if (err?.code) {
        const appError = mapGeoErrorToAppError(err)
        dispatch(attendanceError(appError.message))
      } else {
        dispatch(attendanceError('Check-out failed'))
      }
    }
  }, [dispatch, employeeId, status])

  return { checkOut }
}

/**
 * Selector helper
 */
export const useTodayAttendance = () => {
  return useSelector((state: RootState) => state.attendance)
}
