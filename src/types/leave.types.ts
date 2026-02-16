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
}

export interface LeaveBalance {
  id: string
  employeeId: string
  year: number
  allocated: number
  used: number
  carriedForward: number
  remaining: number
  leaveType: { name: string; code: string }
}

export interface LeaveRequest {
  id: string
  employeeId: string
  fromDate: string
  toDate: string
  durationType: LeaveDurationType
  durationValue: number
  reason: string | null
  status: LeaveRequestStatus
  approvedById: string | null
  createdAt: string
  leaveType: { name: string; code: string }
}

export interface ApplyLeaveRequest {
  leaveTypeId: string
  fromDate: string
  toDate: string
  durationType: LeaveDurationType
  durationValue: number
  reason?: string
}

export interface Holiday {
  id: string
  name: string
  date: string
  companyId: string
}

export interface LeaveTodayEmployee {
  employeeId: string
  displayName: string
  designation: string
  team: string | null
  leaveType: string
  durationType: LeaveDurationType
}

export interface LeaveTodayResponse {
  date: string
  scope: string
  employees: LeaveTodayEmployee[]
}