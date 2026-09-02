// src/types/employee.types.ts
/**
 * Matches backend GET /api/employees/ response shape
 */
export interface EmployeeListItem {
  id: string
  employeeCode: number
  firstName: string
  lastName: string
  displayName: string
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

  user: { email: string }
  department?: { id: string; name: string } | null
  team?: { id?: string; name: string } | null
  designation: { id?: string; name: string }
  manager: { id: string; displayName: string } | null
}

/**
 * Matches backend GET /api/employees/me and GET /api/employees/:id
 */
export interface EmployeeDetail extends EmployeeListItem {
  subordinates?: { id: string; displayName: string }[]
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

export interface CreateEmployeePayload {
  userId: string
  departmentId?: string
  designationId: string
  teamId?: string
  managerId?: string
  firstName: string
  middleName?: string
  lastName: string
  displayName?: string
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
  dateOfBirth?: string | null
  joiningDate?: string
  isProbation?: boolean
  isActive?: boolean
}
