/**
 * Minimal employee info safe to expose in lists
 * (peers, reportees, hierarchy views)
 */
export interface EmployeeMini {
  id: string
  name: string
  designation?: string
  team?: string
  isOnLeaveToday?: boolean
  isActive: boolean
}

/**
 * Full employee profile (self or admin views)
 */
export interface EmployeeProfile {
  id: string
  email: string
  name: string
  employeeCode?: number

  designation?: string
  department?: string
  team?: string

  isActive: boolean
  
  manager?: EmployeeMini
  reportees?: EmployeeMini[]

  dateOfJoining?: string
}

/**
 * Frontend helper type for hierarchy rendering
 */
export interface EmployeeHierarchy {
  self: EmployeeProfile
  manager?: EmployeeMini
  peers: EmployeeMini[]
  reportees: EmployeeMini[]
}
