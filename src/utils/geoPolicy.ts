import type { GeoError, GeoErrorCode } from './geo'

export type GeoAppAction =
  | 'BLOCK'
  | 'REQUEST_PERMISSION'
  | 'RETRY'
  | 'FAIL'

export interface GeoAppError {
  code: GeoErrorCode
  title: string
  message: string
  action: GeoAppAction
}

export const mapGeoErrorToAppError = (error: GeoError): GeoAppError => {
  switch (error.code) {
    case 'UNSUPPORTED':
      return {
        code: error.code,
        title: 'Location Not Supported',
        message:
          'Your device or browser does not support location services.',
        action: 'BLOCK',
      }

    case 'PERMISSION_DENIED':
      return {
        code: error.code,
        title: 'Location Permission Required',
        message:
          'Please enable location permission to mark attendance.',
        action: 'REQUEST_PERMISSION',
      }

    case 'POSITION_UNAVAILABLE':
      return {
        code: error.code,
        title: 'Location Unavailable',
        message:
          'Unable to determine your location. Please try again.',
        action: 'RETRY',
      }

    case 'TIMEOUT':
      return {
        code: error.code,
        title: 'Location Timeout',
        message:
          'Location request timed out. Please try again.',
        action: 'RETRY',
      }

    default:
      return {
        code: 'UNKNOWN',
        title: 'Location Error',
        message:
          'An unexpected location error occurred.',
        action: 'FAIL',
      }
  }
}
