// src/pages/AdminCreateEmployee.tsx
import { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Chip,
  FormControlLabel,
  Switch,
  Checkbox,
  FormGroup,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import toast from 'react-hot-toast'

import { employeeApi } from '../api/employee.api'
import { leaveApi } from '../api/leave.api'
import { organizationApi } from '../api/organization.api'
import type { LeaveType } from '../types/leave.types'
import type { EmployeeListItem, Gender } from '../types/employee.types'
import type { Department, Team, Designation } from '../types/organization.types'
import type { AuthProvider, UserRole } from '../types/auth.types'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import EmployeeAutocomplete from '../components/EmployeeAutocomplete'

const STEPS = [
  'Account & Credentials',
  'Personal Details',
  'Organization & Reporting',
  'Employment & Leave',
  'Review & Submit',
]

const AdminCreateEmployee = () => {
  const navigate = useNavigate()

  const [activeStep, setActiveStep] = useState<number>(0)
  const [createdEmployee, setCreatedEmployee] = useState<(EmployeeListItem & { temporaryPassword?: string }) | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  // Step 0: Credentials Form State
  const [email, setEmail] = useState('')
  const [authProvider, setAuthProvider] = useState<AuthProvider>('LOCAL')
  // Extensibility note: state internally stored as roles: UserRole[] (holding 1 item today)
  const [roles, setRoles] = useState<UserRole[]>(['EMPLOYEE'])
  const [password, setPassword] = useState('')

  // Step 1: Personal Details Form State
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [personalEmail, setPersonalEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Step 2: Organization & Reporting Form State
  const [designations, setDesignations] = useState<Designation[]>([])
  const [selectedDesignationId, setSelectedDesignationId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [existingEmployees, setExistingEmployees] = useState<EmployeeListItem[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState('')
  const [selectedSecondaryManagerId, setSelectedSecondaryManagerId] = useState('')

  // Step 3: Employment & Leave Form State
  const [joiningDate, setJoiningDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [isProbation, setIsProbation] = useState(true)
  const [employeeCode, setEmployeeCode] = useState('')
  const [probationLeaveDays, setProbationLeaveDays] = useState<number | string>(6)
  const [clpLeaveType, setClpLeaveType] = useState<LeaveType | null>(null)

  // UI state
  const [orgLoading, setOrgLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load organization metadata
  useEffect(() => {
    const loadOrgData = async () => {
      setOrgLoading(true)
      try {
        const [desigs, depts, emps, leaveTypes] = await Promise.all([
          organizationApi.listDesignations(),
          organizationApi.listDepartments(),
          employeeApi.list(),
          leaveApi.getTypes(),
        ])
        setDesignations(desigs.filter((d) => d.isActive))
        setDepartments(depts.filter((d) => d.isActive))
        setExistingEmployees(emps.filter((e) => e.isActive))

        const probationType =
          leaveTypes.find((t) => t.code === 'CLP' || t.name.toLowerCase().includes('probation')) ||
          leaveTypes.find((t) => t.code === 'CL' || t.name.toLowerCase().includes('casual')) ||
          null
        setClpLeaveType(probationType)

        if (desigs.length > 0) {
          setSelectedDesignationId(desigs[0].id)
        }
      } catch {
        toast.error('Failed to load organization metadata')
      } finally {
        setOrgLoading(false)
      }
    }
    loadOrgData()
  }, [])

  // Load teams when department changes
  useEffect(() => {
    if (!selectedDepartmentId) {
      setTeams([])
      setSelectedTeamId('')
      return
    }
    const dept = departments.find((d) => d.id === selectedDepartmentId)
    if (dept && (dept as any).teams) {
      setTeams((dept as any).teams.filter((t: Team) => t.isActive))
    } else {
      organizationApi
        .listTeams(selectedDepartmentId)
        .then((allTeams) => {
          setTeams(allTeams.filter((t) => t.isActive))
        })
        .catch(() => setTeams([]))
    }
    setSelectedTeamId('')
  }, [selectedDepartmentId, departments])

  // Compute display name default
  const computedDisplayName = useMemo(() => {
    if (displayName.trim()) return displayName.trim()
    return [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ')
  }, [firstName, middleName, lastName, displayName])

  // Secondary managers excluding primary manager
  const eligibleSecondaryManagers = useMemo(() => {
    return existingEmployees.filter((e) => e.id !== selectedManagerId)
  }, [existingEmployees, selectedManagerId])

  const handleRoleToggle = (targetRole: UserRole) => {
    setRoles((prev) => {
      if (prev.includes(targetRole)) {
        if (prev.length === 1) {
          toast.error("At least one role must be selected");
          return prev;
        }
        return prev.filter((r) => r !== targetRole);
      } else {
        return [...prev, targetRole];
      }
    });
  };

  // Step Validation logic
  const validateCurrentStep = (): boolean => {
    setSubmitError(null)

    if (activeStep === 0) {
      if (!email.trim()) {
        setSubmitError('Company email is required')
        return false
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setSubmitError('Please enter a valid email address')
        return false
      }
      if (!roles || roles.length === 0) {
        setSubmitError('At least one role must be selected')
        return false
      }
      if (authProvider === 'LOCAL' && password.trim() && password.trim().length < 6) {
        setSubmitError('Password must be at least 6 characters long if provided')
        return false
      }
      return true
    }

    if (activeStep === 1) {
      if (!firstName.trim()) {
        setSubmitError('First name is required')
        return false
      }
      if (!lastName.trim()) {
        setSubmitError('Last name is required')
        return false
      }
      if (personalEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(personalEmail.trim())) {
          setSubmitError('Please enter a valid personal email address')
          return false
        }
      }
      if (dateOfBirth && dayjs(dateOfBirth).isAfter(dayjs())) {
        setSubmitError('Date of birth cannot be in the future')
        return false
      }
      return true
    }

    if (activeStep === 2) {
      if (!selectedDesignationId) {
        setSubmitError('Designation is required')
        return false
      }
      if (selectedSecondaryManagerId && selectedManagerId && selectedSecondaryManagerId === selectedManagerId) {
        setSubmitError('Secondary manager cannot be the same as primary reporting manager')
        return false
      }
      return true
    }

    if (activeStep === 3) {
      if (!joiningDate) {
        setSubmitError('Joining date is required')
        return false
      }
      if (employeeCode.trim()) {
        const num = Number(employeeCode.trim())
        if (!Number.isInteger(num) || num <= 0) {
          setSubmitError('Employee code must be a positive integer if provided')
          return false
        }
      }
      return true
    }

    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setSubmitError(null)
    setActiveStep((prev) => Math.max(0, prev - 1))
  }

  // Final Submit: Calls POST /api/employees/onboard atomically
  const handleCompleteOnboarding = async () => {
    setSubmitError(null)
    setSubmitting(true)

    try {
      const payload: any = {
        email: email.trim().toLowerCase(),
        authProvider,
        roles,
        role: roles[0] || 'EMPLOYEE',
        password: authProvider === 'LOCAL' && password.trim() ? password.trim() : undefined,

        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        displayName: computedDisplayName || undefined,
        personalEmail: personalEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth ? dayjs(dateOfBirth).format('YYYY-MM-DD') : undefined,

        designationId: selectedDesignationId,
        departmentId: selectedDepartmentId || undefined,
        teamId: selectedTeamId || undefined,
        managerId: selectedManagerId || undefined,
        secondaryManagerId: selectedSecondaryManagerId || undefined,

        joiningDate: dayjs(joiningDate).format('YYYY-MM-DD'),
        isProbation,
        employeeCode: employeeCode.trim() ? Number(employeeCode.trim()) : undefined,
      }

      if (isProbation && clpLeaveType && Number(probationLeaveDays) >= 0) {
        payload.initialLeaveGrant = {
          leaveTypeId: clpLeaveType.id,
          allocated: Number(probationLeaveDays),
        }
      }

      const result = await employeeApi.onboard(payload)
      setCreatedEmployee(result as any)
      setActiveStep(5)
      toast.success('Employee onboarded successfully!')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to onboard employee'
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartOver = () => {
    setActiveStep(0)
    setCreatedEmployee(null)
    setEmail('')
    setAuthProvider('LOCAL')
    setRoles(['EMPLOYEE'])
    setPassword('')
    setFirstName('')
    setMiddleName('')
    setLastName('')
    setDisplayName('')
    setPersonalEmail('')
    setPhone('')
    setGender('')
    setDateOfBirth('')
    setSelectedDepartmentId('')
    setSelectedTeamId('')
    setSelectedManagerId('')
    setSelectedSecondaryManagerId('')
    setJoiningDate(dayjs().format('YYYY-MM-DD'))
    setIsProbation(true)
    setEmployeeCode('')
    setProbationLeaveDays(6)
    setSubmitError(null)
  }

  const handleCopyPassword = () => {
    if (createdEmployee?.temporaryPassword) {
      navigator.clipboard.writeText(createdEmployee.temporaryPassword)
      setCopiedPassword(true)
      toast.success('Password copied to clipboard')
      setTimeout(() => setCopiedPassword(false), 3000)
    }
  }

  if (orgLoading) {
    return <LoadingState message="Loading organization configuration..." />
  }

  const selectedDeptObj = departments.find((d) => d.id === selectedDepartmentId)
  const selectedTeamObj = teams.find((t) => t.id === selectedTeamId)
  const selectedDesigObj = designations.find((d) => d.id === selectedDesignationId)
  const selectedMgrObj = existingEmployees.find((e) => e.id === selectedManagerId)
  const selectedSecMgrObj = existingEmployees.find((e) => e.id === selectedSecondaryManagerId)

  return (
    <Box>
      <PageHeader
        title="Onboard New Employee"
        subtitle="Complete atomic employee onboarding in a single seamless flow."
      />

      {activeStep < 5 && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label, idx) => (
              <Step key={label} completed={activeStep > idx}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      {/* STEP 0: CREDENTIALS */}
      {activeStep === 0 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Step 1: Account & Credentials
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Set up the employee's system login and access permissions.
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Company Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                placeholder="e.g. alex.chen@tenantcorp.com"
                helperText="Primary email used for company login and system notifications"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Authentication Provider"
                value={authProvider}
                onChange={(e) => setAuthProvider(e.target.value as AuthProvider)}
                fullWidth
                required
              >
                <MenuItem value="LOCAL">Local (Email & Password)</MenuItem>
                <MenuItem value="GOOGLE">Google SSO</MenuItem>
                <MenuItem value="MICROSOFT">Microsoft SSO</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Assigned System Roles *
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Select all roles that apply. An employee can hold multiple roles simultaneously (e.g. Employee + Company Admin).
                </Typography>
                <FormGroup row sx={{ gap: { xs: 1.5, sm: 3 } }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.includes('EMPLOYEE')}
                        onChange={() => handleRoleToggle('EMPLOYEE')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Employee
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Standard portal access (check-in & leave requests)
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.includes('HR')}
                        onChange={() => handleRoleToggle('HR')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          HR Manager
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Attendance & leave administration
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.includes('COMPANY_ADMIN')}
                        onChange={() => handleRoleToggle('COMPANY_ADMIN')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Company Administrator
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Full organization management & settings
                        </Typography>
                      </Box>
                    }
                  />
                </FormGroup>
                {roles.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    At least one role must be selected.
                  </Typography>
                )}
              </Box>
            </Grid>

            {authProvider === 'LOCAL' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Initial Password (Optional)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  placeholder="Leave empty to auto-generate a secure temporary password"
                  helperText="If specified, must be at least 6 characters. Must change password on first login."
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                >
                  Continue to Personal Details
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* STEP 1: PERSONAL DETAILS */}
      {activeStep === 1 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Step 2: Personal Information
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Enter the employee's personal contact and biographical master data.
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Middle Name"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                placeholder={computedDisplayName || 'Leave empty to use First Middle Last'}
                helperText="Formatted name displayed on cards, headers, and reports"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Personal Email Address"
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                fullWidth
                placeholder="e.g. personal.email@gmail.com"
                helperText="Secondary contact for recovery and HR records"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
                placeholder="+1 555-0199"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender | '')}
                fullWidth
              >
                <MenuItem value="">— Not Specified —</MenuItem>
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="Date of Birth"
                maxDate={dayjs()}
                value={dateOfBirth ? dayjs(dateOfBirth) : null}
                onChange={(newValue) => setDateOfBirth(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                >
                  Continue to Organization & Hierarchy
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* STEP 2: ORGANIZATION & HIERARCHY */}
      {activeStep === 2 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Step 3: Organization & Reporting Structure
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Assign designation, department, team, and reporting managers.
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Designation"
                value={selectedDesignationId}
                onChange={(e) => setSelectedDesignationId(e.target.value)}
                fullWidth
                required
              >
                {designations.map((des) => (
                  <MenuItem key={des.id} value={des.id}>
                    {des.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Department"
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">— No Department Selected —</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                fullWidth
                disabled={!selectedDepartmentId || teams.length === 0}
                helperText={
                  !selectedDepartmentId
                    ? 'Select a department first to view teams'
                    : teams.length === 0
                      ? 'No teams in this department'
                      : ''
                }
              >
                <MenuItem value="">— No Team —</MenuItem>
                {teams.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <EmployeeAutocomplete
                label="Primary Reporting Manager"
                value={selectedManagerId}
                onChange={(id) => {
                  setSelectedManagerId(id)
                  if (selectedSecondaryManagerId && selectedSecondaryManagerId === id) {
                    setSelectedSecondaryManagerId('')
                  }
                }}
                employees={existingEmployees}
                placeholder="Search primary manager..."
                helperText="Primary approver for leave and attendance"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <EmployeeAutocomplete
                label="Secondary Reporting Manager (Optional)"
                value={selectedSecondaryManagerId}
                onChange={(id) => setSelectedSecondaryManagerId(id)}
                employees={eligibleSecondaryManagers}
                placeholder="Search secondary manager..."
                helperText="Secondary approver/manager (cannot be primary manager)"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                >
                  Continue to Employment & Leave
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* STEP 3: EMPLOYMENT & LEAVE */}
      {activeStep === 3 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Step 4: Employment & Leave Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Set joining date, employment terms, and initial leave grant.
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Joining Date"
                value={joiningDate ? dayjs(joiningDate) : null}
                onChange={(newValue) => setJoiningDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    helperText: "Leave balances and attendance will be bootstrapped from this date",
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Employee Code (Optional / Legacy Import)"
                type="number"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                fullWidth
                placeholder="Auto-generated if left blank"
                helperText="Leave blank for auto-generation (#next). Provide only when migrating existing employee codes."
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isProbation}
                    onChange={(e) => setIsProbation(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {isProbation ? 'Employment Status: Probation' : 'Employment Status: Permanent'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isProbation
                        ? 'Employee is on probation; probation leave policy applies'
                        : 'Employee is permanent with full standard leave policy'}
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            {isProbation && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Casual Leave (Probation) — Days to Grant"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.5 }}
                  value={probationLeaveDays}
                  onChange={(e) => setProbationLeaveDays(e.target.value)}
                  helperText="Initial probation leave allocation. Permanent leave types can be allocated after probation."
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                >
                  Proceed to Review & Confirm
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {activeStep === 4 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Step 5: Review & Complete Onboarding
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verify all details below. No database records have been created yet.
              </Typography>
            </Box>
          </Box>

          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={3} mb={3}>
            {/* Credentials Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary">
                      1. Account & Credentials
                    </Typography>
                    <IconButton size="small" onClick={() => setActiveStep(0)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '40%', border: 'none', py: 0.75 }}>
                          Company Email
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>{email}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Auth Provider
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          <Chip label={authProvider} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>Role</TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          <Chip label={roles[0]} size="small" color="primary" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>Password</TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {authProvider !== 'LOCAL'
                            ? 'Handled via SSO'
                            : password.trim()
                              ? 'Custom password provided'
                              : 'Auto-generate temporary password'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* Personal Details Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary">
                      2. Personal Details
                    </Typography>
                    <IconButton size="small" onClick={() => setActiveStep(1)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '40%', border: 'none', py: 0.75 }}>
                          Full Name
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {[firstName, middleName, lastName].filter(Boolean).join(' ')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Display Name
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>{computedDisplayName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Personal Email
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>{personalEmail || '—'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>Phone / Gender</TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {phone || '—'} • {gender || 'Not specified'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Date of Birth
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {dateOfBirth ? dayjs(dateOfBirth).format('DD MMM YYYY') : '—'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* Org & Manager Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary">
                      3. Organization & Reporting
                    </Typography>
                    <IconButton size="small" onClick={() => setActiveStep(2)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '40%', border: 'none', py: 0.75 }}>
                          Designation
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {selectedDesigObj?.name || '—'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Department / Team
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {selectedDeptObj?.name || 'None'} • {selectedTeamObj?.name || 'No Team'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Primary Manager
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {selectedMgrObj ? `${selectedMgrObj.displayName} (#${selectedMgrObj.employeeCode})` : 'None (Top of Hierarchy)'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Secondary Manager
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {selectedSecMgrObj ? `${selectedSecMgrObj.displayName} (#${selectedSecMgrObj.employeeCode})` : 'None'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* Employment & Leave Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary">
                      4. Employment & Leave
                    </Typography>
                    <IconButton size="small" onClick={() => setActiveStep(3)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '40%', border: 'none', py: 0.75 }}>
                          Joining Date
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {dayjs(joiningDate).format('DD MMMM YYYY')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Employment Status
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          <Chip
                            label={isProbation ? 'Probation' : 'Permanent'}
                            size="small"
                            color={isProbation ? 'warning' : 'success'}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Employee Code
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {employeeCode.trim() ? `#${employeeCode.trim()} (Explicit)` : 'Auto-Generated (#next)'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 'none', py: 0.75 }}>
                          Initial Leave Grant
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.75 }}>
                          {isProbation ? `${probationLeaveDays} Casual Leave Days` : 'Standard Policy'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCompleteOnboarding}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
            >
              {submitting ? 'Completing Atomic Onboarding...' : 'Complete Employee Onboarding'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* STEP 5: COMPLETION SUMMARY */}
      {activeStep === 5 && createdEmployee && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: 1, borderColor: 'divider', textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 1.5 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Employee Successfully Onboarded!
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            User credentials, profile master data, and leave balances were atomically created.
          </Typography>

          <Card variant="outlined" sx={{ maxWidth: 540, mx: 'auto', mb: 3, textAlign: 'left', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Employee Code
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary" mb={1.5}>
                #{createdEmployee.employeeCode}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Full Name
              </Typography>
              <Typography variant="body1" fontWeight={600} mb={1.5}>
                {createdEmployee.displayName}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Designation & Department
              </Typography>
              <Typography variant="body2" mb={1.5}>
                {createdEmployee.designation?.name || 'Designation'} • {createdEmployee.department?.name || 'No Department'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Company Email
              </Typography>
              <Typography variant="body2" mb={1.5}>
                {createdEmployee.user?.email || email}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Joining Date
              </Typography>
              <Typography variant="body2">
                {dayjs(createdEmployee.joiningDate).format('DD MMMM YYYY')}
              </Typography>
            </CardContent>
          </Card>

          {createdEmployee.temporaryPassword && (
            <Card
              variant="outlined"
              sx={{
                maxWidth: 540,
                mx: 'auto',
                mb: 4,
                textAlign: 'left',
                borderRadius: 2,
                bgcolor: 'background.paper',
                borderColor: 'primary.light',
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>
                  Temporary Account Password
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  Share this temporary password with the employee. They will be prompted to set a new password on their first login.
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  <span>{createdEmployee.temporaryPassword}</span>
                  <Tooltip title={copiedPassword ? 'Copied!' : 'Copy Password'}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopyPassword}
                    >
                      {copiedPassword ? 'Copied' : 'Copy'}
                    </Button>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          )}

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" onClick={handleStartOver}>
              Onboard Another Employee
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/employees/' + createdEmployee.id)}
            >
              View Employee Profile
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

export default AdminCreateEmployee
