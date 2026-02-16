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
  designationId: string
  teamId: string | null
  managerId: string | null

  user: { email: string }
  team: { name: string } | null
  designation: { name: string }
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