// src/utils/geo.ts
export type GeoCoords = {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export type GeoErrorCode =
  | 'UNSUPPORTED'
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN'

export interface GeoError {
  code: GeoErrorCode
  message: string
}

interface GetLocationOptions {
  enableHighAccuracy?: boolean
  timeoutMs?: number
  maximumAgeMs?: number
}

/**
 * Normalize browser GeolocationPositionError into app-friendly error.
 */
const normalizeGeoError = (error: GeolocationPositionError): GeoError => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        code: 'PERMISSION_DENIED',
        message: 'Location permission denied by user.',
      }
    case error.POSITION_UNAVAILABLE:
      return {
        code: 'POSITION_UNAVAILABLE',
        message: 'Location information is unavailable.',
      }
    case error.TIMEOUT:
      return {
        code: 'TIMEOUT',
        message: 'Location request timed out.',
      }
    default:
      return {
        code: 'UNKNOWN',
        message: 'Unknown location error.',
      }
  }
}

/**
 * Get current device location.
 * This is the ONLY function components/hooks should use.
 */
export const getCurrentLocation = (
  options: GetLocationOptions = {}
): Promise<GeoCoords> => {
  if (!('geolocation' in navigator)) {
    return Promise.reject({
      code: 'UNSUPPORTED',
      message: 'Geolocation is not supported by this browser.',
    })
  }

  const {
    enableHighAccuracy = true,
    timeoutMs = 10000,
    maximumAgeMs = 0,
  } = options

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords

        resolve({
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp,
        })
      },
      (error) => {
        reject(normalizeGeoError(error))
      },
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: maximumAgeMs,
      }
    )
  })
}
