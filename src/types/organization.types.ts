// src/types/organization.types.ts
export interface Department {
  id: string
  name: string
  companyId: string
  isActive: boolean
  createdAt?: string
}

export interface Team {
  id: string
  name: string
  departmentId: string
  isActive: boolean
  createdAt?: string
}

export interface Designation {
  id: string
  name: string
  companyId: string
  isActive: boolean
  createdAt?: string
}

export interface DesignationAttendancePolicy {
  id: string
  companyId: string
  designationId: string
  autoPresent: boolean
  attendanceExempt: boolean
  createdAt?: string
  updatedAt?: string
  designation?: { name: string }
}

export interface UpsertDesignationAttendancePolicyPayload {
  designationId: string
  autoPresent: boolean
  attendanceExempt: boolean
}

export interface OfficeLocation {
  id: string
  companyId: string
  latitude: number
  longitude: number
  radiusM: number
  geoFencingEnabled?: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SetOfficeLocationPayload {
  latitude: number
  longitude: number
  radiusM: number
  geoFencingEnabled?: boolean
}

export interface UpdateOfficeLocationPayload {
  latitude?: number
  longitude?: number
  radiusM?: number
  geoFencingEnabled?: boolean
}

export interface WorkingHoursConfig {
  workingMinutes: number
  lunchMinutes: number
  breakMinutes: number
  graceMinutes: number
  workWeekDays?: number
  sandwichRuleEnabled?: boolean
}

export interface UpdateWorkingHoursPayload {
  workingMinutes?: number
  lunchMinutes?: number
  breakMinutes?: number
  graceMinutes?: number
  workWeekDays?: number
  sandwichRuleEnabled?: boolean
}
