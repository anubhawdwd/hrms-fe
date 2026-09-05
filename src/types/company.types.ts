// src/types/company.types.ts
export interface CompanyAdminUser {
  id: string
  email: string
  isActive: boolean
  createdAt: string
}

export interface Company {
  id: string
  name: string
  isActive: boolean
  logGeoFenceViolations?: boolean
  createdAt: string
  users?: CompanyAdminUser[]
}

export interface CreateCompanyPayload {
  name: string
  adminEmail?: string
  adminPassword?: string
}
