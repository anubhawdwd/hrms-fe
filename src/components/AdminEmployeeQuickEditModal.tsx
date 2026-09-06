// src/components/AdminEmployeeQuickEditModal.tsx
import { formatLeaveDays } from '../utils/format.utils'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Autocomplete,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Paper,
  alpha,
  useTheme,
  MenuItem,
  Checkbox,
  FormGroup,
} from '@mui/material'
import type { UserRole } from '../types/auth.types'
import PersonIcon from '@mui/icons-material/Person'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import EventNoteIcon from '@mui/icons-material/EventNote'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb'
import RefreshIcon from '@mui/icons-material/Refresh'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import toast from 'react-hot-toast'

import { employeeApi } from '../api/employee.api'
import { userApi } from '../api/user.api'
import { organizationApi } from '../api/organization.api'
import { attendanceApi } from '../api/attendance.api'
import { leaveApi } from '../api/leave.api'
import EmployeeAutocomplete from './EmployeeAutocomplete'
import { ResetPasswordDialog } from './ResetPasswordDialog'
import { OffboardEmployeeModal } from './OffboardEmployeeModal'
import { ReactivateEmployeeDialog } from './ReactivateEmployeeDialog'
import { AdminMarkLeaveDialog } from './AdminMarkLeaveDialog'
import { AdminEditLeaveAllocationDialog } from './AdminEditLeaveAllocationDialog'
import { AdminLeaveDayBreakdownDialog } from './AdminLeaveDayBreakdownDialog'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddIcon from '@mui/icons-material/Add'
import TuneIcon from '@mui/icons-material/Tune'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import RestoreIcon from '@mui/icons-material/Restore'
import LockResetIcon from '@mui/icons-material/LockReset'
import { useUser } from '../hooks/useAuth'
import type { EmployeeListItem, Gender } from '../types/employee.types'
import type { Department, Team, Designation } from '../types/organization.types'
import type { AttendanceDay } from '../types/attendance.types'
import type { LeaveRequest, LeaveType, LeaveBalance } from '../types/leave.types'

/* ─── Levenshtein Distance for Typo-Tolerant Search + Select ─── */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const d: number[][] = []
  for (let i = 0; i <= m; i++) d[i] = [i]
  for (let j = 0; j <= n; j++) d[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      )
    }
  }
  return d[m][n]
}

function isFuzzyMatch(word: string, token: string): boolean {
  if (word.includes(token)) return true
  if (token.length >= 4) {
    const dist = levenshteinDistance(word, token)
    if (dist <= 1 && token.length <= 6) return true
    if (dist <= 2 && token.length > 6) return true
  }
  return false
}

interface Props {
  open: boolean
  onClose: () => void
  employee: EmployeeListItem | null
  onEmployeeUpdated: (updated: EmployeeListItem) => void
  usesTeams: boolean
  allEmployees?: EmployeeListItem[]
}

const AdminEmployeeQuickEditModal: React.FC<Props> = ({
  open,
  onClose,
  employee,
  onEmployeeUpdated,
  usesTeams,
  allEmployees = [],
}) => {
  const theme = useTheme()
  const currentUser = useUser()
  const isHrOrAdmin = currentUser?.role === 'HR' || currentUser?.role === 'COMPANY_ADMIN'
  const [activeTab, setActiveTab] = useState<number>(0)
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false)
  const [offboardModalOpen, setOffboardModalOpen] = useState<boolean>(false)
  const [reactivateModalOpen, setReactivateModalOpen] = useState<boolean>(false)

  // ─── Profile Tab Form State ───
  const [firstName, setFirstName] = useState<string>('')
  const [middleName, setMiddleName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [personalEmail, setPersonalEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [dateOfBirth, setDateOfBirth] = useState<string>('')
  const [joiningDate, setJoiningDate] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [teamId, setTeamId] = useState<string>('')
  const [designationId, setDesignationId] = useState<string>('')
  const [managerId, setManagerId] = useState<string>('')
  const [secondaryManagerId, setSecondaryManagerId] = useState<string>('')
  const [companyEmail, setCompanyEmail] = useState<string>('')
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['EMPLOYEE'])
  const [emailError, setEmailError] = useState<string>('')
  const [emailConfirmOpen, setEmailConfirmOpen] = useState<boolean>(false)
  const [isActive, setIsActive] = useState<boolean>(true)
  const [isProbation, setIsProbation] = useState<boolean>(false)
  const [profileSaving, setProfileSaving] = useState<boolean>(false)

  // ─── Organization Metadata State ───
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])

  // ─── Attendance Tab State ───
  const todayStr = dayjs().format('YYYY-MM-DD')
  const [attendanceDate, setAttendanceDate] = useState<string>(todayStr)
  const [attendanceDay, setAttendanceDay] = useState<AttendanceDay | null>(null)
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false)
  const [checkInTime, setCheckInTime] = useState<string>('')
  const [checkOutTime, setCheckOutTime] = useState<string>('')
  const [attendanceReason, setAttendanceReason] = useState<string>('')
  const [attendanceSaving, setAttendanceSaving] = useState<boolean>(false)

  // ─── Leave Tab State ───
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveLoading, setLeaveLoading] = useState<boolean>(false)
  const [employeeLeaveBalances, setEmployeeLeaveBalances] = useState<LeaveBalance[]>([])
  const [leaveTypesList, setLeaveTypesList] = useState<LeaveType[]>([])
  const [markLeaveOpen, setMarkLeaveOpen] = useState<boolean>(false)
  const [allocationDialogOpen, setAllocationDialogOpen] = useState<boolean>(false)
  const [selectedBalanceToEdit, setSelectedBalanceToEdit] = useState<LeaveBalance | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false)
  const [targetCancelRequest, setTargetCancelRequest] = useState<LeaveRequest | null>(null)
  const [selectedRequestForBreakdown, setSelectedRequestForBreakdown] = useState<LeaveRequest | null>(null)
  const [cancelReason, setCancelReason] = useState<string>('')
  const [cancelSubmitting, setCancelSubmitting] = useState<boolean>(false)

  // ─── Load Organization Metadata ───
  useEffect(() => {
    if (!open) return
    const loadMetadata = async () => {
      try {
        const [deptList, desigList] = await Promise.all([
          organizationApi.listDepartments(),
          organizationApi.listDesignations(),
        ])
        setDepartments(deptList || [])
        setDesignations(desigList || [])
      } catch {
        toast.error('Failed to load organization metadata')
      }
    }
    loadMetadata()
  }, [open])

  // ─── Initialize Profile Form on Employee Change ───
  useEffect(() => {
    if (employee) {
      setCompanyEmail(employee.user?.email || '')
      const initialRoles: UserRole[] =
        employee.user?.roles && employee.user.roles.length > 0
          ? employee.user.roles
          : (employee.user?.role ? [employee.user.role] : ['EMPLOYEE'])
      setSelectedRoles(initialRoles)
      setEmailError('')
      setFirstName(employee.firstName || '')
      setMiddleName(employee.middleName || '')
      setLastName(employee.lastName || '')
      setDisplayName(employee.displayName || '')
      setPersonalEmail(employee.user?.personalEmail || '')
      setPhone(employee.phone || '')
      setGender(employee.gender || '')
      setDateOfBirth(employee.dateOfBirth ? dayjs(employee.dateOfBirth).format('YYYY-MM-DD') : '')
      setJoiningDate(employee.joiningDate ? dayjs(employee.joiningDate).format('YYYY-MM-DD') : '')
      setDepartmentId(employee.departmentId || employee.department?.id || '')
      setTeamId(employee.teamId || employee.team?.id || '')
      setDesignationId(employee.designationId || '')
      setManagerId(employee.managerId || '')
      setSecondaryManagerId(employee.secondaryManagerId || '')
      setIsActive(employee.isActive ?? true)
      setIsProbation(employee.isProbation ?? false)
    }
  }, [employee])

  // ─── Load Teams for Selected Department ───
  useEffect(() => {
    if (!usesTeams || !departmentId) {
      setTeams([])
      return
    }
    organizationApi
      .listTeams(departmentId)
      .then((t) => setTeams(t || []))
      .catch(() => setTeams([]))
  }, [departmentId, usesTeams])

  // ─── Fetch Attendance for Selected Date ───
  const loadAttendanceForDate = useCallback(async () => {
    if (!employee || !attendanceDate) return
    setAttendanceLoading(true)
    try {
      const day = await attendanceApi.getDay(attendanceDate, employee.id)
      setAttendanceDay(day)

      if (day?.events && day.events.length > 0) {
        const inEvt = day.events.find((e) => e.type === 'CHECK_IN')
        const outEvt = day.events.filter((e) => e.type === 'CHECK_OUT').at(-1)
        setCheckInTime(inEvt ? dayjs(inEvt.timestamp).format('HH:mm') : '')
        setCheckOutTime(outEvt ? dayjs(outEvt.timestamp).format('HH:mm') : '')
      } else {
        setCheckInTime('')
        setCheckOutTime('')
      }
      setAttendanceReason('')
    } catch {
      setAttendanceDay(null)
      setCheckInTime('')
      setCheckOutTime('')
    } finally {
      setAttendanceLoading(false)
    }
  }, [employee, attendanceDate])

  useEffect(() => {
    if (open && activeTab === 1 && employee) {
      loadAttendanceForDate()
    }
  }, [open, activeTab, employee, loadAttendanceForDate])

  // ─── Fetch Leave Requests & Balances for Employee ───
  const loadLeaveData = useCallback(async () => {
    if (!employee) return
    setLeaveLoading(true)
    try {
      const [requests, balances, types] = await Promise.all([
        leaveApi.getEmployeeRequests(employee.id),
        leaveApi.getEmployeeBalances(employee.id, new Date().getFullYear()),
        leaveApi.getTypes(),
      ])
      setLeaveRequests(requests || [])
      setEmployeeLeaveBalances(balances || [])
      setLeaveTypesList(types || [])
    } catch {
      setLeaveRequests([])
      setEmployeeLeaveBalances([])
    } finally {
      setLeaveLoading(false)
    }
  }, [employee])

  useEffect(() => {
    if (open && activeTab === 2 && employee) {
      loadLeaveData()
    }
  }, [open, activeTab, employee, loadLeaveData])

  // ─── Memoized Selected Objects for Autocomplete ───
  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d.id === departmentId) || null
  }, [departments, departmentId])

  const selectedDesignation = useMemo(() => {
    return designations.find((d) => d.id === designationId) || null
  }, [designations, designationId])

  const selectedTeam = useMemo(() => {
    return teams.find((t) => t.id === teamId) || null
  }, [teams, teamId])

  // Eligible Primary Managers (exclude current employee)
  const eligibleManagers = useMemo(() => {
    if (!employee) return []
    return allEmployees.filter((e) => e.id !== employee.id && (e.isActive || e.id === managerId))
  }, [allEmployees, employee, managerId])

  // Eligible Secondary Managers (exclude current employee)
  const eligibleSecondaryManagers = useMemo(() => {
    if (!employee) return []
    return allEmployees.filter((e) => e.id !== employee.id && (e.isActive || e.id === secondaryManagerId))
  }, [allEmployees, employee, secondaryManagerId])

  // Typo-tolerant generic filter options generator
  const createTypoFilterOptions = useCallback(<T extends { name: string }>() => {
    return (options: T[], state: { inputValue: string }) => {
      const query = state.inputValue.trim().toLowerCase()
      if (!query) return options

      const tokens = query.split(/\s+/).filter(Boolean)

      return options.filter((opt) => {
        const text = opt.name.toLowerCase()
        const words = opt.name.split(/\s+/)

        return tokens.every((token) => {
          if (text.includes(token)) return true
          return words.some((word) => isFuzzyMatch(word.toLowerCase(), token))
        })
      })
    }
  }, [])

  const filterDepartments = useMemo(() => createTypoFilterOptions<Department>(), [createTypoFilterOptions])
  const filterDesignations = useMemo(() => createTypoFilterOptions<Designation>(), [createTypoFilterOptions])
  const filterTeams = useMemo(() => createTypoFilterOptions<Team>(), [createTypoFilterOptions])

  if (!employee) return null

  const isLocalAuth = !employee?.user?.authProvider || employee.user?.authProvider === 'LOCAL'
  const hasEmailChanged =
    isLocalAuth &&
    companyEmail.trim().toLowerCase() !== (employee?.user?.email || '').trim().toLowerCase()

  const handleRoleToggle = (targetRole: UserRole) => {
    setSelectedRoles((prev) => {
      if (prev.includes(targetRole)) {
        if (prev.length === 1) {
          toast.error("An employee must have at least one role");
          return prev;
        }
        return prev.filter((r) => r !== targetRole);
      } else {
        return [...prev, targetRole];
      }
    });
  };

  // ─── Save Profile Edits ───
  const handleSaveProfile = () => {
    if (profileSaving) return

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required')
      return
    }
    if (!companyEmail.trim()) {
      setEmailError('Company email is required')
      return
    }
    if (!selectedRoles || selectedRoles.length === 0) {
      toast.error('An employee must have at least one role')
      return
    }
    if (!designationId) {
      toast.error('Designation is required')
      return
    }
    if (secondaryManagerId && managerId && secondaryManagerId === managerId) {
      toast.error('Secondary manager cannot be the same as primary manager')
      return
    }
    if (dateOfBirth && dayjs(dateOfBirth).isAfter(dayjs())) {
      toast.error('Date of birth cannot be in the future')
      return
    }

    if (hasEmailChanged) {
      setEmailConfirmOpen(true)
    } else {
      executeSaveProfile()
    }
  }

  const executeSaveProfile = async () => {
    setEmailConfirmOpen(false)
    setEmailError('')
    setProfileSaving(true)
    try {
      const normalizedEmail = companyEmail.trim().toLowerCase()

      // If email changed, call updateEmail first (Amendment 3: sends only { email })
      if (hasEmailChanged && employee.userId) {
        try {
          await userApi.updateEmail(employee.userId, { email: normalizedEmail })
        } catch (err: any) {
          const msg =
            err?.response?.data?.message || err?.message || 'Failed to update company email'
          setEmailError(msg)
          setProfileSaving(false)
          toast.error(msg)
          return
        }
      }

      // If roles changed, call userApi.update with new roles
      const initialRoles: UserRole[] =
        employee.user?.roles && employee.user.roles.length > 0
          ? employee.user.roles
          : (employee.user?.role ? [employee.user.role] : ['EMPLOYEE'])

      const hasRolesChanged =
        selectedRoles.length !== initialRoles.length ||
        !selectedRoles.every((r) => initialRoles.includes(r))

      if (hasRolesChanged && employee.userId) {
        try {
          await userApi.update(employee.userId, { roles: selectedRoles })
        } catch (err: any) {
          const msg =
            err?.response?.data?.message || err?.message || 'Failed to update user roles'
          setProfileSaving(false)
          toast.error(msg)
          return
        }
      }

      const computedDisplayName =
        displayName.trim() || [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ')

      const updatedResult = await employeeApi.updateAdmin(employee.id, {
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        displayName: computedDisplayName,
        personalEmail: personalEmail.trim() || null,
        phone: phone.trim() || null,
        gender: (gender as Gender) || null,
        dateOfBirth: dateOfBirth ? dayjs(dateOfBirth).format('YYYY-MM-DD') : null,
        joiningDate: joiningDate ? dayjs(joiningDate).format('YYYY-MM-DD') : undefined,
        departmentId: departmentId || null,
        teamId: usesTeams ? teamId || null : null,
        designationId,
        isActive,
        isProbation,
        managerId: managerId || null,
        secondaryManagerId: secondaryManagerId || null,
      })

      const selectedDept = departments.find((d) => d.id === departmentId)
      const selectedTm = teams.find((t) => t.id === teamId)
      const selectedDesig = designations.find((d) => d.id === designationId)
      const selectedMgr = allEmployees.find((e) => e.id === managerId)
      const selectedSecMgr = allEmployees.find((e) => e.id === secondaryManagerId)

      const mergedListItem: EmployeeListItem = {
        ...employee,
        ...updatedResult,
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        displayName: computedDisplayName,
        phone: phone.trim() || null,
        gender: (gender as Gender) || null,
        dateOfBirth: dateOfBirth ? dayjs(dateOfBirth).toISOString() : null,
        joiningDate: joiningDate ? dayjs(joiningDate).toISOString() : employee.joiningDate,
        departmentId: departmentId || null,
        department: updatedResult.department ?? (selectedDept ? { id: selectedDept.id, name: selectedDept.name } : null),
        teamId: usesTeams ? teamId || null : null,
        team: usesTeams ? (updatedResult.team ?? (selectedTm ? { id: selectedTm.id, name: selectedTm.name } : null)) : null,
        designationId,
        designation: updatedResult.designation ?? (selectedDesig ? { name: selectedDesig.name } : employee.designation),
        managerId: managerId || null,
        manager: updatedResult.manager ?? (selectedMgr ? { id: selectedMgr.id, displayName: selectedMgr.displayName, employeeCode: selectedMgr.employeeCode } : null),
        secondaryManagerId: secondaryManagerId || null,
        secondaryManager: (updatedResult as any).secondaryManager ?? (selectedSecMgr ? { id: selectedSecMgr.id, displayName: selectedSecMgr.displayName, employeeCode: selectedSecMgr.employeeCode } : null),
        user: {
          ...employee.user,
          email: hasEmailChanged ? normalizedEmail : (employee.user?.email || ''),
          personalEmail: personalEmail.trim() || null,
          roles: selectedRoles,
          role: selectedRoles[0] || 'EMPLOYEE',
        },
        isActive,
        isProbation,
      }

      setProfileSaving(false)
      onEmployeeUpdated(mergedListItem)
      onClose()
      toast.success('Employee profile updated successfully')
    } catch (err: any) {
      setProfileSaving(false)
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update employee')
    }
  }

  // ─── Save Attendance Correction ───
  const handleSaveAttendance = async () => {
    if (!checkInTime) {
      toast.error('Check-in time is required')
      return
    }

    setAttendanceSaving(true)
    try {
      const inIso = dayjs(`${attendanceDate}T${checkInTime}:00`).toISOString()
      const outIso = checkOutTime
        ? dayjs(`${attendanceDate}T${checkOutTime}:00`).toISOString()
        : undefined

      if (attendanceDay) {
        await attendanceApi.hrUpdateAttendanceDay(attendanceDay.id, {
          checkIn: inIso,
          checkOut: outIso,
          reason: attendanceReason.trim() || 'HR Manual Correction via Quick Edit',
        })
      } else {
        await attendanceApi.hrUpsertAttendanceDay({
          employeeId: employee.id,
          date: attendanceDate,
          checkIn: inIso,
          checkOut: outIso,
          reason: attendanceReason.trim() || 'HR Manual Entry via Quick Edit',
        })
      }

      toast.success('Attendance recorded/updated successfully')
      loadAttendanceForDate()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update attendance')
    } finally {
      setAttendanceSaving(false)
    }
  }

  // ─── Handle Leave Actions ───
  const handleApproveLeave = async (reqId: string) => {
    try {
      await leaveApi.approve(reqId)
      toast.success('Leave request approved')
      loadLeaveData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve leave')
    }
  }

  const handleRejectLeave = async (reqId: string) => {
    const reason = window.prompt('Enter reason for rejection:')
    if (!reason || !reason.trim()) return
    try {
      await leaveApi.reject(reqId)
      toast.success('Leave request rejected')
      loadLeaveData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject leave')
    }
  }

  const handleConfirmHrCancel = async () => {
    if (!targetCancelRequest || !cancelReason.trim()) {
      toast.error('Cancellation reason is required')
      return
    }
    setCancelSubmitting(true)
    try {
      await leaveApi.hrCancel(targetCancelRequest.id, cancelReason.trim())
      toast.success('Approved leave cancelled and balance reverted')
      setCancelModalOpen(false)
      setTargetCancelRequest(null)
      setCancelReason('')
      loadLeaveData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel leave')
    } finally {
      setCancelSubmitting(false)
    }
  }

  const initials = employee.displayName
    ? employee.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'E'

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            minHeight: 560,
          },
        }}
      >
        {/* ─── Modal Header ─── */}
        <DialogTitle
          sx={{
            p: 2.5,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: 'primary.main',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                {initials}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {employee.displayName}
                  </Typography>
                  <Chip
                    label={`#${employee.employeeCode}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, height: 22 }}
                  />
                  <Chip
                    label={isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={isActive ? 'success' : 'default'}
                    sx={{ height: 22, fontWeight: 600 }}
                  />
                  {isProbation && (
                    <Chip
                      label="Probation"
                      size="small"
                      color="warning"
                      sx={{ height: 22, fontWeight: 600 }}
                    />
                  )}
                  {selectedRoles.map((r) => (
                    <Chip
                      key={r}
                      label={r === 'COMPANY_ADMIN' ? 'Admin' : r === 'HR' ? 'HR' : 'Employee'}
                      size="small"
                      color={r === 'COMPANY_ADMIN' ? 'secondary' : r === 'HR' ? 'info' : 'primary'}
                      variant="filled"
                      sx={{ height: 22, fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {employee.user?.email} • {employee.designation?.name} •{' '}
                  {employee.department?.name || 'No Department'}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose} disabled={profileSaving}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* ─── Navigation Tabs ─── */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2.5, bgcolor: 'background.paper' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                minHeight: 48,
                gap: 1,
              },
            }}
          >
            <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Profile & Org" />
            <Tab icon={<AccessTimeIcon fontSize="small" />} iconPosition="start" label="Attendance" />
            <Tab icon={<EventNoteIcon fontSize="small" />} iconPosition="start" label="Leave Requests" />
          </Tabs>
        </Box>

        {/* ─── Tab Content ─── */}
        <DialogContent sx={{ p: 3 }}>
          {/* TAB 0: PROFILE WITH SEARCH + SELECT AUTOCOMPLETES */}
          {activeTab === 0 && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Administrative Employee Details
              </Typography>

              {/* Company Login Email */}
              <Tooltip
                title={!isLocalAuth ? "Email is managed by your SSO provider for this account" : ""}
                arrow
              >
                <TextField
                  label="Company Email Address (Login)"
                  fullWidth
                  size="small"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => {
                    setCompanyEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  disabled={profileSaving || !isLocalAuth}
                  error={Boolean(emailError)}
                  helperText={
                    emailError ||
                    (!isLocalAuth
                      ? "Email is managed by your SSO provider for this account"
                      : "Primary organization login email (changing this requires employee to re-login)")
                  }
                  required
                />
              </Tooltip>

              {/* Assigned System Roles */}
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Assigned System Roles *
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Configure access permissions. Users can hold multiple roles simultaneously (e.g. Employee + Company Admin).
                </Typography>
                <FormGroup row sx={{ gap: { xs: 1.5, sm: 3 } }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedRoles.includes('EMPLOYEE')}
                        onChange={() => handleRoleToggle('EMPLOYEE')}
                        color="primary"
                        disabled={profileSaving}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Employee
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Check-in & leave portal
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedRoles.includes('HR')}
                        onChange={() => handleRoleToggle('HR')}
                        color="primary"
                        disabled={profileSaving}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          HR Manager
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Attendance & leave admin
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedRoles.includes('COMPANY_ADMIN')}
                        onChange={() => handleRoleToggle('COMPANY_ADMIN')}
                        color="primary"
                        disabled={profileSaving}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Company Administrator
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Full organization control
                        </Typography>
                      </Box>
                    }
                  />
                </FormGroup>
                {selectedRoles.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    At least one role must be selected.
                  </Typography>
                )}
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="First Name"
                  fullWidth
                  size="small"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={profileSaving}
                  required
                />
                <TextField
                  label="Middle Name"
                  fullWidth
                  size="small"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  disabled={profileSaving}
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  size="small"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={profileSaving}
                  required
                />
              </Stack>

              <TextField
                label="Display Name"
                fullWidth
                size="small"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={profileSaving}
                helperText="Formatted name displayed throughout the system"
              />

              <Divider sx={{ my: 0.5 }} />

              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Contact & Personal Information
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Personal Email"
                  type="email"
                  fullWidth
                  size="small"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  disabled={profileSaving}
                  placeholder="e.g. personal@gmail.com"
                />
                <TextField
                  label="Phone Number"
                  fullWidth
                  size="small"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={profileSaving}
                  placeholder="+1 555-0199"
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="Gender"
                  fullWidth
                  size="small"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender | '')}
                  disabled={profileSaving}
                >
                  <MenuItem value="">— Not Specified —</MenuItem>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>

                <DatePicker
                  label="Date of Birth"
                  maxDate={dayjs()}
                  value={dateOfBirth ? dayjs(dateOfBirth) : null}
                  onChange={(newValue) => setDateOfBirth(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                  disabled={profileSaving}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />

                <DatePicker
                  label="Joining Date"
                  value={joiningDate ? dayjs(joiningDate) : null}
                  onChange={(newValue) => setJoiningDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                  disabled={profileSaving}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Stack>

              <Divider sx={{ my: 0.5 }} />

              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Organization & Hierarchy
              </Typography>

              {/* Department & Team Search + Select */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Autocomplete<Department, false, false, false>
                  value={selectedDepartment}
                  onChange={(_, newValue) => {
                    setDepartmentId(newValue ? newValue.id : '')
                    setTeamId('') // Reset team on department change
                  }}
                  options={departments}
                  filterOptions={filterDepartments}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  disabled={profileSaving}
                  fullWidth
                  size="small"
                  noOptionsText="No matching departments"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Department"
                      placeholder="Search or select department..."
                    />
                  )}
                />

                {usesTeams && (
                  <Autocomplete<Team, false, false, false>
                    value={selectedTeam}
                    onChange={(_, newValue) => {
                      setTeamId(newValue ? newValue.id : '')
                    }}
                    options={teams}
                    filterOptions={filterTeams}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, val) => option.id === val.id}
                    disabled={!departmentId || profileSaving}
                    fullWidth
                    size="small"
                    noOptionsText={
                      !departmentId
                        ? 'Select a department first'
                        : 'No matching teams'
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Team (Optional)"
                        placeholder={
                          departmentId
                            ? 'Search or select team...'
                            : 'Select department first'
                        }
                      />
                    )}
                  />
                )}
              </Stack>

              {/* Designation */}
              <Autocomplete<Designation, false, false, false>
                value={selectedDesignation}
                onChange={(_, newValue) => {
                  setDesignationId(newValue ? newValue.id : '')
                }}
                options={designations}
                filterOptions={filterDesignations}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                disabled={profileSaving}
                fullWidth
                size="small"
                noOptionsText="No matching designations"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Designation *"
                    required
                    placeholder="Search or select designation..."
                  />
                )}
              />

              {/* Primary & Secondary Managers */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ width: '100%' }}>
                  <EmployeeAutocomplete
                    value={managerId}
                    onChange={(newVal) => {
                      setManagerId(newVal)
                      if (secondaryManagerId && secondaryManagerId === newVal) {
                        setSecondaryManagerId('')
                      }
                    }}
                    employees={eligibleManagers}
                    disabled={profileSaving}
                    size="small"
                    label="Primary Reporting Manager"
                    placeholder="Search manager by name, code, email..."
                  />
                </Box>
                <Box sx={{ width: '100%' }}>
                  <EmployeeAutocomplete
                    value={secondaryManagerId}
                    onChange={(newVal) => setSecondaryManagerId(newVal)}
                    employees={eligibleSecondaryManagers}
                    disabled={profileSaving}
                    size="small"
                    label="Secondary Reporting Manager (Optional)"
                    placeholder="Search secondary manager..."
                  />
                </Box>
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" spacing={4} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      color="success"
                      disabled={profileSaving}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Employee Active Status
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Inactive employees cannot log in or submit attendance
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isProbation}
                      onChange={(e) => setIsProbation(e.target.checked)}
                      color="warning"
                      disabled={profileSaving}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Probationary Period
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Controls probation-specific leave policies
                      </Typography>
                    </Box>
                  }
                />
              </Stack>

              {isHrOrAdmin && (
                <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<LockResetIcon />}
                    onClick={() => setResetModalOpen(true)}
                  >
                    Reset Password
                  </Button>
                  {employee?.isActive ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<PersonOffIcon />}
                      onClick={() => setOffboardModalOpen(true)}
                    >
                      Deactivate / Offboard
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<RestoreIcon />}
                      onClick={() => setReactivateModalOpen(true)}
                    >
                      Reactivate Employee
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          )}

          {/* TAB 1: ATTENDANCE */}
          {activeTab === 1 && (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <DatePicker
                  label="Attendance Date"
                  maxDate={dayjs(todayStr)}
                  value={attendanceDate ? dayjs(attendanceDate) : null}
                  onChange={(newValue) => setAttendanceDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{
                    textField: {
                      size: 'small',
                      helperText: 'Future dates cannot be recorded',
                      sx: { minWidth: 200 },
                    },
                  }}
                />

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={loadAttendanceForDate}
                  disabled={attendanceLoading}
                >
                  Refresh Date
                </Button>
              </Box>

              {attendanceLoading ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading attendance record for {attendanceDate}...
                  </Typography>
                </Box>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      Record Status: {attendanceDay ? attendanceDay.status : 'NO RECORD'}
                    </Typography>
                    <Chip
                      label={
                        attendanceDay
                          ? `${Math.floor((attendanceDay.totalMinutes || 0) / 60)}h ${(attendanceDay.totalMinutes || 0) % 60}m worked`
                          : 'Not Created'
                      }
                      size="small"
                      color={attendanceDay ? 'primary' : 'default'}
                    />
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                    <TimePicker
                      label="Check-In Time (IST)"
                      value={checkInTime ? dayjs(`2000-01-01T${checkInTime}`) : null}
                      onChange={(newValue) => setCheckInTime(newValue && newValue.isValid() ? newValue.format('HH:mm') : '')}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          required: true,
                        },
                      }}
                    />
                    <TimePicker
                      label="Check-Out Time (IST)"
                      value={checkOutTime ? dayjs(`2000-01-01T${checkOutTime}`) : null}
                      onChange={(newValue) => setCheckOutTime(newValue && newValue.isValid() ? newValue.format('HH:mm') : '')}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          helperText: 'Leave blank for open shift',
                        },
                      }}
                    />
                  </Stack>

                  <TextField
                    label="Correction Reason / Admin Note"
                    fullWidth
                    size="small"
                    value={attendanceReason}
                    onChange={(e) => setAttendanceReason(e.target.value)}
                    placeholder="e.g. Biometric missed punch / HR approved correction"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveAttendance}
                      disabled={attendanceSaving || !checkInTime}
                    >
                      {attendanceSaving
                        ? 'Saving...'
                        : attendanceDay
                        ? 'Update Attendance Day'
                        : 'Create Attendance Day'}
                    </Button>
                  </Box>
                </Paper>
              )}

              {/* Event Timeline */}
              {attendanceDay?.events && attendanceDay.events.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                    Audit Event History ({attendanceDay.events.length})
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {attendanceDay.events.map((evt) => (
                      <Box
                        key={evt.id}
                        sx={{
                          p: 1.25,
                          borderRadius: 1.5,
                          border: 1,
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: 'background.paper',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={evt.type}
                            size="small"
                            color={evt.type === 'CHECK_IN' ? 'success' : 'info'}
                            sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {dayjs(evt.timestamp).format('HH:mm:ss A')}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Source: {evt.source}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}

          {/* TAB 2: LEAVE REQUESTS */}
          {activeTab === 2 && (
            <Stack spacing={2.5}>
              {/* Header with Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Leave Balances & History ({new Date().getFullYear()})
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    startIcon={<FlightTakeoffIcon />}
                    onClick={() => setMarkLeaveOpen(true)}
                    disabled={leaveLoading}
                  >
                    Mark Leave
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={loadLeaveData}
                    disabled={leaveLoading}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Box>

              {/* ─── Leave Balances Breakdown ─── */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Current Leave Balance Breakdown
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedBalanceToEdit(null)
                      setAllocationDialogOpen(true)
                    }}
                    sx={{ fontSize: '0.75rem', py: 0 }}
                  >
                    Grant / Add Leave Type
                  </Button>
                </Box>

                {employeeLeaveBalances.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No leave policy quotas allocated for this employee in {new Date().getFullYear()}.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setSelectedBalanceToEdit(null)
                        setAllocationDialogOpen(true)
                      }}
                      sx={{ mt: 1 }}
                    >
                      Grant Leave Type
                    </Button>
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                      gap: 1.5,
                    }}
                  >
                    {employeeLeaveBalances.map((bal) => (
                      <Paper
                        key={bal.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                          border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: '75%' }}>
                            {bal.leaveType?.name || 'Leave'}
                          </Typography>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedBalanceToEdit(bal)
                              setAllocationDialogOpen(true)
                            }}
                            title="Edit Allocation"
                            sx={{ p: 0.25 }}
                          >
                            <TuneIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Used: <strong>{formatLeaveDays(bal.used)}</strong>
                          </Typography>
                          <Chip
                            label={`${formatLeaveDays(bal.remaining)} Available`}
                            size="small"
                            color={bal.remaining > 0 ? 'success' : 'default'}
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>

              {leaveLoading ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading leave requests...
                  </Typography>
                </Box>
              ) : leaveRequests.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No leave requests found for this employee.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">
                          Duration
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">
                          Status
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          HR Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaveRequests.map((req) => {
                        const isMultiDay = req.durationValue > 1 || (req.days && req.days.length > 1)
                        const statusColor =
                          req.status === 'APPROVED'
                            ? 'success'
                            : (req.status === 'PENDING' || req.status === 'PENDING_MANAGER' || req.status === 'PENDING_HR')
                            ? 'warning'
                            : req.status === 'REJECTED'
                            ? 'error'
                            : 'default'

                        return (
                          <TableRow key={req.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {req.leaveType?.name || 'Leave'}
                              </Typography>
                              {req.reason && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {req.reason}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dayjs(req.fromDate).format('DD MMM YYYY')}
                                {req.fromDate !== req.toDate
                                  ? ` - ${dayjs(req.toDate).format('DD MMM YYYY')}`
                                  : ''}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${formatLeaveDays(req.durationValue)} ${req.durationType.toLowerCase()}`}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={req.status}
                                size="small"
                                color={statusColor as any}
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                {isMultiDay && (
                                  <Tooltip title="View Day Breakdown & Act on Individual Days">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => setSelectedRequestForBreakdown(req)}
                                    >
                                      {(req.status === 'PENDING' || req.status === 'PENDING_MANAGER' || req.status === 'PENDING_HR') ? (
                                        <TuneIcon fontSize="small" />
                                      ) : (
                                        <VisibilityIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {(req.status === 'PENDING' || req.status === 'PENDING_MANAGER' || req.status === 'PENDING_HR') && (
                                  <>
                                    <Tooltip title={isMultiDay ? "Approve All Days" : "Approve Leave"}>
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => handleApproveLeave(req.id)}
                                      >
                                        <CheckCircleIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={isMultiDay ? "Reject All Days" : "Reject Leave"}>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRejectLeave(req.id)}
                                      >
                                        <CancelIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                                {req.status === 'APPROVED' && (
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<DoNotDisturbIcon fontSize="small" />}
                                    onClick={() => {
                                      setTargetCancelRequest(req)
                                      setCancelModalOpen(true)
                                    }}
                                    sx={{ textTransform: 'none', py: 0.25, fontSize: '0.75rem' }}
                                  >
                                    HR Cancel
                                  </Button>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          )}
        </DialogContent>

        {/* ─── Modal Footer ─── */}
        <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={onClose} color="inherit" disabled={profileSaving}>
            Close
          </Button>
          {activeTab === 0 && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
              disabled={profileSaving}
            >
              {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ─── HR Cancel Reason Dialog ─── */}
      <Dialog
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>HR Cancel Approved Leave</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cancelling this approved leave will immediately revert the deducted quota balance to the employee.
          </Typography>
          <TextField
            autoFocus
            label="Cancellation Reason"
            fullWidth
            size="small"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Employee reported to office / Mistaken application"
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelModalOpen(false)} color="inherit">
            Back
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmHrCancel}
            disabled={cancelSubmitting || !cancelReason.trim()}
          >
            {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Change Confirmation Dialog */}
      <Dialog
        open={emailConfirmOpen}
        onClose={() => !profileSaving && setEmailConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirm Login Email Change
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Changing this employee&apos;s login email to{' '}
            <strong>{companyEmail.trim().toLowerCase()}</strong> will require them to log in again with the new address.
            Any active sessions tied to the previous address will be invalidated.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEmailConfirmOpen(false)}
            color="inherit"
            disabled={profileSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={executeSaveProfile}
            disabled={profileSaving}
          >
            {profileSaving ? 'Updating...' : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ResetPasswordDialog
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        userId={employee.userId}
        employeeName={employee.displayName}
        email={employee.user?.email || ''}
      />

      {/* Offboard Modal */}
      <OffboardEmployeeModal
        open={offboardModalOpen}
        employee={employee}
        onClose={() => setOffboardModalOpen(false)}
        onSuccess={() => {
          onEmployeeUpdated({ ...employee, isActive: false })
          onClose()
        }}
      />

      {/* Reactivate Dialog */}
      <ReactivateEmployeeDialog
        open={reactivateModalOpen}
        employee={employee}
        onClose={() => setReactivateModalOpen(false)}
        onSuccess={() => {
          onEmployeeUpdated({ ...employee, isActive: true })
          onClose()
        }}
      />

      {/* Day Breakdown Dialog */}
      <AdminLeaveDayBreakdownDialog
        open={Boolean(selectedRequestForBreakdown)}
        onClose={() => setSelectedRequestForBreakdown(null)}
        request={selectedRequestForBreakdown}
        employeeName={employee?.displayName}
        onSuccess={loadLeaveData}
      />

      {/* Mark Leave Dialog */}
      <AdminMarkLeaveDialog
        open={markLeaveOpen}
        onClose={() => setMarkLeaveOpen(false)}
        employee={employee}
        leaveTypes={leaveTypesList}
        leaveBalances={employeeLeaveBalances}
        onSuccess={loadLeaveData}
      />

      {/* Edit Allocation Dialog */}
      <AdminEditLeaveAllocationDialog
        open={allocationDialogOpen}
        onClose={() => {
          setAllocationDialogOpen(false)
          setSelectedBalanceToEdit(null)
        }}
        employee={employee}
        existingBalance={selectedBalanceToEdit}
        allLeaveTypes={leaveTypesList}
        currentBalances={employeeLeaveBalances}
        onSuccess={loadLeaveData}
      />
    </>
  )
}

export default AdminEmployeeQuickEditModal
