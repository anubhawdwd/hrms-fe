// src/types/employee.types.ts
import type { AuthProvider, UserRole } from "./auth.types"

export type Gender = "MALE" | "FEMALE" | "OTHER"

/**
 * Matches backend GET /api/employees/ response shape
 */
export interface EmployeeListItem {
  id: string
  employeeCode: number
  firstName: string
  middleName?: string | null
  lastName: string
  displayName: string
  phone?: string | null
  gender?: Gender | null
  isActive: boolean
  isProbation: boolean
  joiningDate: string
  dateOfBirth: string | null

  userId: string
  companyId: string
  departmentId?: string | null
  designationId: string
  teamId: string | null
  managerId: string | null
  secondaryManagerId?: string | null

  user: {
    id?: string
    email: string
    personalEmail?: string | null
    authProvider?: AuthProvider
    role?: UserRole
    roles?: UserRole[]
    isActive?: boolean
  }
  department?: { id: string; name: string } | null
  team?: { id?: string; name: string } | null
  designation: { id?: string; name: string }
  manager: { id: string; displayName: string; employeeCode?: number } | null
  secondaryManager?: { id: string; displayName: string; employeeCode?: number } | null
}

/**
 * Matches backend GET /api/employees/me and GET /api/employees/:id
 */
export interface EmployeeDetail extends EmployeeListItem {
  subordinates?: { id: string; displayName: string; employeeCode?: number }[]
  secondarySubordinates?: { id: string; displayName: string; employeeCode?: number }[]
}

/**
 * Frontend-derived hierarchy for dashboard rendering
 */
export interface EmployeeHierarchy {
  self: EmployeeDetail
  manager: EmployeeListItem | null
  peers: EmployeeListItem[]
  reportees: EmployeeListItem[]
}

export interface OnboardEmployeePayload {
  email: string
  authProvider?: AuthProvider
  role?: UserRole
  roles?: UserRole[]
  password?: string

  firstName: string
  middleName?: string
  lastName: string
  displayName?: string
  personalEmail?: string
  phone?: string
  gender?: Gender | null
  dateOfBirth?: string
  joiningDate: string

  departmentId?: string
  teamId?: string
  designationId: string
  managerId?: string
  secondaryManagerId?: string

  isProbation?: boolean
  employeeCode?: number
  initialLeaveGrant?: {
    leaveTypeId: string
    allocated: number
  } | null
}

export interface CreateEmployeePayload {
  userId: string
  departmentId?: string
  designationId: string
  teamId?: string
  managerId?: string
  secondaryManagerId?: string
  firstName: string
  middleName?: string
  lastName: string
  displayName?: string
  personalEmail?: string
  phone?: string
  gender?: Gender | null
  dateOfBirth?: string
  joiningDate: string
  isProbation?: boolean
  initialLeaveGrant?: {
    leaveTypeId: string
    allocated: number
  } | null
}

export interface UpdateEmployeeAdminPayload {
  departmentId?: string | null
  teamId?: string | null
  designationId?: string
  firstName?: string
  middleName?: string | null
  lastName?: string
  displayName?: string
  personalEmail?: string | null
  phone?: string | null
  gender?: Gender | null
  dateOfBirth?: string | null
  joiningDate?: string
  isProbation?: boolean
  isActive?: boolean
  managerId?: string | null
  secondaryManagerId?: string | null
}
