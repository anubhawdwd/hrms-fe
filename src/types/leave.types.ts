// src/types/leave.types.ts
export type LeaveDurationType =
  | 'FULL_DAY'
  | 'HALF_DAY'
  | 'QUARTER_DAY'
  | 'HOURLY'

export type LeaveRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export interface LeaveType {
  id: string
  name: string
  code: string
  isPaid: boolean
  isActive: boolean
  autoGrantOnOnboarding?: boolean
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leaveTypeId?: string
  year: number
  allocated: number
  used: number
  carriedForward: number
  remaining: number
  leaveType: { id?: string; name: string; code: string; isPaid?: boolean }
}

export interface LeaveRequestDay {
  id: string
  leaveRequestId: string
  date: string
  status: LeaveRequestStatus
  isSandwichDay: boolean
  deductDays: number
  createdAt?: string
  updatedAt?: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  fromDate: string
  toDate: string
  durationType: LeaveDurationType
  durationValue: number
  startTime: string | null
  endTime: string | null
  reason: string | null
  status: LeaveRequestStatus
  approvedById: string | null
  createdAt: string
  updatedAt?: string
  days?: LeaveRequestDay[]
  leaveType: { id?: string; name: string; code: string; isPaid?: boolean }
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee: {
    id: string
    displayName: string
    employeeCode?: number | null
    designation: { name: string }
    team?: { name: string } | null
  }
}

export interface ApplyLeaveRequest {
  leaveTypeId: string
  fromDate: string
  toDate: string
  durationType: LeaveDurationType
  slot?: string       // "FIRST_HALF"|"SECOND_HALF"|"Q1"|"Q2"|"Q3"|"Q4"
  startTime?: string  // "HH:MM" — for HOURLY
  endTime?: string    // "HH:MM" — for HOURLY
  reason?: string
}

export type HolidayType = 'NORMAL' | 'RESTRICTED'

export interface Holiday {
  id: string
  name: string
  date: string
  companyId: string
  type?: HolidayType
}

export interface LeaveTodayEmployee {
  employeeId: string
  displayName: string
  designation: string
  team: string | null
  leaveType: string
  durationType: LeaveDurationType
  startTime: string | null
  endTime: string | null
}

export interface LeaveTodayResponse {
  date: string
  scope: string
  employees: LeaveTodayEmployee[]
}

export interface LeavePolicy {
  id?: string
  companyId?: string
  leaveTypeId: string
  year: number
  yearlyAllocation: number
  allowCarryForward: boolean
  maxCarryForward: number | null
  allowEncashment: boolean
  probationAllowed: boolean
  genderRestriction?: string | null
  monthlyAccrual: boolean
  leaveType?: {
    id: string
    name: string
    code: string
    isPaid: boolean
  }
}

export interface RolloverResult {
  successCount: number
  skippedCount: number
  totalEmployees: number
  errors: { employeeId: string; leaveTypeId: string; error: string }[]
}

export interface BulkAllocatePayload {
  leaveTypeId: string
  year: number
  allocated: number
  scope: 'ALL_ACTIVE' | 'BY_EMPLOYMENT_TYPE' | 'SPECIFIC_EMPLOYEES'
  isProbation?: boolean
  employeeIds?: string[]
  reason?: string
}

export interface BulkAllocateResult {
  successCount: number
  skippedCount: number
  totalMatched: number
  errors: { employeeId: string; reason: string }[]
}

