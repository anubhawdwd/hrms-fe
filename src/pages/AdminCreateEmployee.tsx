// src/pages/AdminCreateEmployee.tsx
import { useEffect, useState } from 'react'
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
  Card,
  CardContent,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BadgeIcon from '@mui/icons-material/Badge'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ReplayIcon from '@mui/icons-material/Replay'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

import { userApi } from '../api/user.api'
import { employeeApi } from '../api/employee.api'
import { organizationApi } from '../api/organization.api'
import type { User } from '../types/user.types'
import type { EmployeeListItem } from '../types/employee.types'
import type { Department, Team, Designation } from '../types/organization.types'
import type { AuthProvider, UserRole } from '../types/auth.types'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'

const STEPS = ['Create User Credentials', 'Setup Employee Profile']

const AdminCreateEmployee = () => {
  const navigate = useNavigate()

  const [activeStep, setActiveStep] = useState<number>(0)
  const [createdUser, setCreatedUser] = useState<User | null>(null)
  const [createdEmployee, setCreatedEmployee] = useState<EmployeeListItem | null>(null)

  // Step 1: User Form State
  const [email, setEmail] = useState('')
  const [authProvider, setAuthProvider] = useState<AuthProvider>('LOCAL')
  const [role, setRole] = useState<UserRole>('EMPLOYEE')
  const [userCreating, setUserCreating] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)

  // Step 2: Employee Profile Form State
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [joiningDate, setJoiningDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [isProbation, setIsProbation] = useState(true)

  // Org Dropdowns State
  const [designations, setDesignations] = useState<Designation[]>([])
  const [selectedDesignationId, setSelectedDesignationId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [existingEmployees, setExistingEmployees] = useState<EmployeeListItem[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState('')

  const [orgLoading, setOrgLoading] = useState(true)
  const [employeeCreating, setEmployeeCreating] = useState(false)
  const [employeeError, setEmployeeError] = useState<string | null>(null)

  // Load designations, departments, and existing employees for managers
  useEffect(() => {
    const loadOrgData = async () => {
      setOrgLoading(true)
      try {
        const [desigs, depts, emps] = await Promise.all([
          organizationApi.listDesignations(),
          organizationApi.listDepartments(),
          employeeApi.list(),
        ])
        setDesignations(desigs.filter((d) => d.isActive))
        setDepartments(depts.filter((d) => d.isActive))
        setExistingEmployees(emps.filter((e) => e.isActive))

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

  // Load teams whenever department changes
  useEffect(() => {
    if (!selectedDepartmentId) {
      setTeams([])
      setSelectedTeamId('')
      return
    }

    const loadTeams = async () => {
      try {
        const teamList = await organizationApi.listTeams(selectedDepartmentId)
        const activeTeams = teamList.filter((t) => t.isActive)
        setTeams(activeTeams)
        if (activeTeams.length > 0) {
          setSelectedTeamId(activeTeams[0].id)
        } else {
          setSelectedTeamId('')
        }
      } catch {
        setTeams([])
        setSelectedTeamId('')
      }
    }

    loadTeams()
  }, [selectedDepartmentId])

  // Step 1: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserError(null)

    if (!email.trim()) {
      setUserError('Email is required')
      return
    }

    setUserCreating(true)
    try {
      const user = await userApi.create({
        email: email.trim().toLowerCase(),
        authProvider,
        role,
      })
      setCreatedUser(user)
      setActiveStep(1)
      toast.success(`User account created: ${user.email}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create user account'
      setUserError(msg)
      toast.error(msg)
    } finally {
      setUserCreating(false)
    }
  }

  // Step 2: Create Employee Profile
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmployeeError(null)

    if (!createdUser) {
      setEmployeeError('User account missing. Please complete Step 1 first.')
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      setEmployeeError('First name and last name are required.')
      return
    }
    if (!selectedDesignationId) {
      setEmployeeError('Please select a designation.')
      return
    }
    if (!joiningDate) {
      setEmployeeError('Joining date is required.')
      return
    }

    setEmployeeCreating(true)
    try {
      const computedDisplayName =
        displayName.trim() ||
        [firstName.trim(), middleName.trim(), lastName.trim()]
          .filter(Boolean)
          .join(' ')

      const newEmp = await employeeApi.create({
        userId: createdUser.id,
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        displayName: computedDisplayName,
        designationId: selectedDesignationId,
        teamId: selectedTeamId || undefined,
        managerId: selectedManagerId || undefined,
        joiningDate,
        dateOfBirth: dateOfBirth || undefined,
        isProbation,
      })

      setCreatedEmployee(newEmp)
      setActiveStep(2)
      toast.success('Employee onboarded successfully with leave balances initialized!')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create employee profile'
      setEmployeeError(msg)
      toast.error(msg)
    } finally {
      setEmployeeCreating(false)
    }
  }

  const handleReset = () => {
    setActiveStep(0)
    setCreatedUser(null)
    setCreatedEmployee(null)
    setEmail('')
    setFirstName('')
    setMiddleName('')
    setLastName('')
    setDisplayName('')
    setDateOfBirth('')
    setUserError(null)
    setEmployeeError(null)
  }

  if (orgLoading) {
    return <LoadingState message="Loading organization configuration..." />
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 4 }}>
      <PageHeader
        title="Onboard New Employee"
        subtitle="Create a system user account and configure employee profile, organization hierarchy, and automated leave allocation"
        backTo="/admin/employees"
        backLabel="Back to Employees"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Employees', path: '/admin/employees' },
          { label: 'Onboard New' },
        ]}
      />

      {/* Stepper */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stepper activeStep={activeStep}>
          {STEPS.map((label, index) => (
            <Step key={label} completed={activeStep > index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* ─── STEP 0: USER CREDENTIALS ─── */}
      {activeStep === 0 && (
        <Paper elevation={2} sx={{ p: 3.5, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <AccountCircleIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Step 1: User Account Credentials
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Set up the login identity and authorization role for the company member.
          </Typography>

          {userError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>
              {userError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleCreateUser}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Work Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. employee@phibonacci.com"
                  helperText="Must be unique within your company"
                  disabled={userCreating}
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
                  disabled={userCreating}
                >
                  <MenuItem value="LOCAL">LOCAL (Password Login)</MenuItem>
                  <MenuItem value="GOOGLE">GOOGLE (Single Sign-On)</MenuItem>
                  <MenuItem value="MICROSOFT">MICROSOFT (Single Sign-On)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="System Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  fullWidth
                  required
                  disabled={userCreating}
                >
                  <MenuItem value="EMPLOYEE">EMPLOYEE (Standard Staff)</MenuItem>
                  <MenuItem value="HR">HR (Human Resources Administrator)</MenuItem>
                  <MenuItem value="COMPANY_ADMIN">COMPANY_ADMIN (Executive Admin)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/employees')}
                    disabled={userCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      userCreating ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />
                    }
                    disabled={userCreating}
                  >
                    {userCreating ? 'Creating User...' : 'Create User & Proceed'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* ─── STEP 1: EMPLOYEE PROFILE ─── */}
      {activeStep === 1 && createdUser && (
        <Paper elevation={2} sx={{ p: 3.5, borderRadius: 2 }}>
          {/* Confirmed User Banner */}
          <Card
            variant="outlined"
            sx={{
              mb: 3,
              borderRadius: 2,
              bgcolor: 'primary.50',
              borderColor: 'primary.light',
            }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      User Account Confirmed
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {createdUser.email}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={createdUser.role} color="primary" size="small" />
                  <Chip label={createdUser.authProvider} variant="outlined" size="small" />
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <BadgeIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Step 2: Employee Profile & Organization Setup
            </Typography>
          </Box>

          {employeeError && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 1.5 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<ReplayIcon />}
                  onClick={handleCreateEmployee}
                >
                  Retry
                </Button>
              }
            >
              {employeeError} — You can adjust the fields below and retry without recreating the user account.
            </Alert>
          )}

          <Box component="form" onSubmit={handleCreateEmployee}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1.5}>
              1. Personal Details
            </Typography>

            <Grid container spacing={2.5} mb={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. Sarah"
                  disabled={employeeCreating}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Middle Name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  fullWidth
                  placeholder="Optional"
                  disabled={employeeCreating}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. Jenkins"
                  disabled={employeeCreating}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  fullWidth
                  placeholder="Leave blank to auto-generate"
                  helperText="Defaults to First Middle Last"
                  disabled={employeeCreating}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled={employeeCreating}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1.5}>
              2. Job & Organization Structure
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Designation"
                  value={selectedDesignationId}
                  onChange={(e) => setSelectedDesignationId(e.target.value)}
                  fullWidth
                  required
                  disabled={employeeCreating}
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
                  disabled={employeeCreating}
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
                  disabled={employeeCreating || !selectedDepartmentId || teams.length === 0}
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
                <TextField
                  select
                  label="Reporting Manager"
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  fullWidth
                  disabled={employeeCreating}
                >
                  <MenuItem value="">— None (Top of Hierarchy) —</MenuItem>
                  {existingEmployees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.displayName} ({emp.designation?.name})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Joining Date"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  disabled={employeeCreating}
                  helperText="Leave balances will be bootstrapped automatically from this date"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isProbation}
                      onChange={(e) => setIsProbation(e.target.checked)}
                      color="primary"
                      disabled={employeeCreating}
                    />
                  }
                  label="Employee on Probation Period"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1.5 }} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={handleReset}
                    disabled={employeeCreating}
                  >
                    Start Over / Different User
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      employeeCreating ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />
                    }
                    disabled={employeeCreating}
                  >
                    {employeeCreating ? 'Onboarding Employee...' : 'Complete Employee Onboarding'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* ─── STEP 2: COMPLETION SUMMARY ─── */}
      {activeStep === 2 && createdEmployee && (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 1.5 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Employee Successfully Onboarded!
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Profile created and initial annual leave allocations have been bootstrapped.
          </Typography>

          <Card variant="outlined" sx={{ maxWidth: 500, mx: 'auto', mb: 4, textAlign: 'left', borderRadius: 2 }}>
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
                Designation & Team
              </Typography>
              <Typography variant="body2" mb={1.5}>
                {createdEmployee.designation?.name} • {createdEmployee.team?.name || 'No Team Assigned'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Joining Date
              </Typography>
              <Typography variant="body2">
                {dayjs(createdEmployee.joiningDate).format('DD MMMM YYYY')}
              </Typography>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={handleReset}
            >
              Onboard Another Employee
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(`/admin/employees/${createdEmployee.id}`)}
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
