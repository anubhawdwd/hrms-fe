// src/types/organization.types.ts
export interface Department {
  id: string
  name: string
  companyId: string
  isActive: boolean
}

export interface Team {
  id: string
  name: string
  departmentId: string
  isActive: boolean
}

export interface Designation {
  id: string
  name: string
  companyId: string
  isActive: boolean
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
