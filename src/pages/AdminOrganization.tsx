// src/pages/AdminOrganization.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import GroupsIcon from '@mui/icons-material/Groups'
import BadgeIcon from '@mui/icons-material/Badge'
import RuleIcon from '@mui/icons-material/Rule'
import PersonIcon from '@mui/icons-material/Person'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import RefreshIcon from '@mui/icons-material/Refresh'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { organizationApi } from '../api/organization.api'
import { attendanceApi } from '../api/attendance.api'
import { employeeApi } from '../api/employee.api'
import type {
  Department,
  Team,
  Designation,
  DesignationAttendancePolicy,
} from '../types/organization.types'
import type { EmployeeAttendanceOverride } from '../types/attendance.types'
import type { EmployeeListItem } from '../types/employee.types'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

/* ─── Typo-tolerant search helper ─── */
function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase().trim()
  const target = text.toLowerCase()
  if (target.includes(q)) return true

  // Subsequence matching for minor typos / abbreviations
  let i = 0
  for (let j = 0; j < target.length && i < q.length; j++) {
    if (target[j] === q[i]) i++
  }
  return i === q.length
}

const AdminOrganization: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<number>(0)

  // ─── Data States ───
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [policies, setPolicies] = useState<DesignationAttendancePolicy[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [employeeOverrides, setEmployeeOverrides] = useState<EmployeeAttendanceOverride[]>([])
  const [usesTeams, setUsesTeams] = useState<boolean>(false)
  const [settingLoading, setSettingLoading] = useState<boolean>(false)

  // ─── Loading States ───
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  // ─── Filter & Search States ───
  const [deptSearch, setDeptSearch] = useState<string>('')
  const [teamSearch, setTeamSearch] = useState<string>('')
  const [teamDeptFilter, setTeamDeptFilter] = useState<string>('ALL')
  const [desigSearch, setDesigSearch] = useState<string>('')
  const [policySearch, setPolicySearch] = useState<string>('')
  const [policyMode, setPolicyMode] = useState<'DESIGNATION' | 'EMPLOYEE'>('DESIGNATION')
  const [employeeOverrideSearch, setEmployeeOverrideSearch] = useState<string>('')

  // ─── Dialog States ───
  // Department dialogs
  const [deptModalOpen, setDeptModalOpen] = useState<boolean>(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deptNameInput, setDeptNameInput] = useState<string>('')
  const [deactivateDeptTarget, setDeactivateDeptTarget] = useState<Department | null>(null)

  // Team dialogs
  const [teamModalOpen, setTeamModalOpen] = useState<boolean>(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamNameInput, setTeamNameInput] = useState<string>('')
  const [teamDeptInput, setTeamDeptInput] = useState<string>('')
  const [deactivateTeamTarget, setDeactivateTeamTarget] = useState<Team | null>(null)

  // Designation dialogs
  const [desigModalOpen, setDesigModalOpen] = useState<boolean>(false)
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null)
  const [desigNameInput, setDesigNameInput] = useState<string>('')
  const [deactivateDesigTarget, setDeactivateDesigTarget] = useState<Designation | null>(null)

  // Designation Policy dialog
  const [policyModalOpen, setPolicyModalOpen] = useState<boolean>(false)
  const [policyTargetDesig, setPolicyTargetDesig] = useState<Designation | null>(null)
  const [policyAutoPresent, setPolicyAutoPresent] = useState<boolean>(false)
  const [policyAttendanceExempt, setPolicyAttendanceExempt] = useState<boolean>(false)

  // Employee Override dialogs
  const [empOverrideModalOpen, setEmpOverrideModalOpen] = useState<boolean>(false)
  const [overrideTargetEmp, setOverrideTargetEmp] = useState<EmployeeListItem | null>(null)
  const [empAutoPresent, setEmpAutoPresent] = useState<boolean>(false)
  const [empAttendanceExempt, setEmpAttendanceExempt] = useState<boolean>(false)
  const [empReasonInput, setEmpReasonInput] = useState<string>('')
  const [resetOverrideTarget, setResetOverrideTarget] = useState<EmployeeListItem | null>(null)

  /* ─── Toggle Uses Teams Setting ─── */
  const handleToggleUsesTeams = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.checked
    setSettingLoading(true)
    try {
      const res = await organizationApi.updateTeamsSetting(nextVal)
      setUsesTeams(res.usesTeams)
      toast.success(res.usesTeams ? 'Team management enabled' : 'Team management disabled (using direct Departments)')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update teams setting')
    } finally {
      setSettingLoading(false)
    }
  }

  /* ─── Fetch All Organization Data ─── */
  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const [deptData, desigData, policyData, empData, overrideData, teamsSetting] = await Promise.all([
        organizationApi.listDepartments(),
        organizationApi.listDesignations(),
        organizationApi.listDesignationAttendancePolicies().catch(() => []),
        employeeApi.list().catch(() => []),
        attendanceApi.listEmployeeOverrides().catch(() => []),
        organizationApi.getTeamsSetting().catch(() => ({ usesTeams: false })),
      ])

      setUsesTeams(teamsSetting?.usesTeams ?? false)

      setDepartments(deptData || [])
      setDesignations(desigData || [])
      setPolicies(policyData || [])
      setEmployees(empData || [])
      setEmployeeOverrides(overrideData || [])

      // Load teams for all departments in parallel
      if (deptData && deptData.length > 0) {
        const teamPromises = deptData.map((d: Department) =>
          organizationApi.listTeams(d.id).catch(() => [])
        )
        const teamResults = await Promise.all(teamPromises)
        setTeams(teamResults.flat())
      } else {
        setTeams([])
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load organization records')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData(true)
    toast.success('Organization data refreshed')
  }

  /* ─── Department Operations ─── */
  const handleOpenDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept)
      setDeptNameInput(dept.name)
    } else {
      setEditingDept(null)
      setDeptNameInput('')
    }
    setDeptModalOpen(true)
  }

  const handleSaveDept = async () => {
    const trimmed = deptNameInput.trim()
    if (!trimmed) {
      toast.error('Department name is required')
      return
    }

    setActionLoading(true)
    try {
      if (editingDept) {
        await organizationApi.updateDepartment(editingDept.id, trimmed)
        toast.success('Department updated successfully')
      } else {
        await organizationApi.createDepartment(trimmed)
        toast.success('Department created successfully')
      }
      setDeptModalOpen(false)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save department')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivateDept = async () => {
    if (!deactivateDeptTarget) return
    setActionLoading(true)
    try {
      await organizationApi.deactivateDepartment(deactivateDeptTarget.id)
      toast.success('Department deactivated')
      setDeactivateDeptTarget(null)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate department')
    } finally {
      setActionLoading(false)
    }
  }

  /* ─── Team Operations ─── */
  const handleOpenTeamModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team)
      setTeamNameInput(team.name)
      setTeamDeptInput(team.departmentId)
    } else {
      setEditingTeam(null)
      setTeamNameInput('')
      const defaultDept =
        teamDeptFilter !== 'ALL'
          ? teamDeptFilter
          : departments.find((d) => d.isActive)?.id || ''
      setTeamDeptInput(defaultDept)
    }
    setTeamModalOpen(true)
  }

  const handleSaveTeam = async () => {
    const trimmed = teamNameInput.trim()
    if (!trimmed) {
      toast.error('Team name is required')
      return
    }
    if (!teamDeptInput) {
      toast.error('Parent department is required')
      return
    }

    setActionLoading(true)
    try {
      if (editingTeam) {
        await organizationApi.updateTeam(editingTeam.id, {
          name: trimmed,
          departmentId: teamDeptInput,
        })
        toast.success('Team updated successfully')
      } else {
        await organizationApi.createTeam(trimmed, teamDeptInput)
        toast.success('Team created successfully')
      }
      setTeamModalOpen(false)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save team')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivateTeam = async () => {
    if (!deactivateTeamTarget) return
    setActionLoading(true)
    try {
      await organizationApi.deactivateTeam(deactivateTeamTarget.id)
      toast.success('Team deactivated')
      setDeactivateTeamTarget(null)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate team')
    } finally {
      setActionLoading(false)
    }
  }

  /* ─── Designation Operations ─── */
  const handleOpenDesigModal = (desig?: Designation) => {
    if (desig) {
      setEditingDesig(desig)
      setDesigNameInput(desig.name)
    } else {
      setEditingDesig(null)
      setDesigNameInput('')
    }
    setDesigModalOpen(true)
  }

  const handleSaveDesig = async () => {
    const trimmed = desigNameInput.trim()
    if (!trimmed) {
      toast.error('Designation name is required')
      return
    }

    setActionLoading(true)
    try {
      if (editingDesig) {
        await organizationApi.updateDesignation(editingDesig.id, trimmed)
        toast.success('Designation updated successfully')
      } else {
        await organizationApi.createDesignation(trimmed)
        toast.success('Designation created successfully')
      }
      setDesigModalOpen(false)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save designation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivateDesig = async () => {
    if (!deactivateDesigTarget) return
    setActionLoading(true)
    try {
      await organizationApi.deactivateDesignation(deactivateDesigTarget.id)
      toast.success('Designation deactivated')
      setDeactivateDesigTarget(null)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate designation')
    } finally {
      setActionLoading(false)
    }
  }

  /* ─── Policy Maps ─── */
  const policyMap = useMemo(() => {
    const map = new Map<string, DesignationAttendancePolicy>()
    policies.forEach((p) => map.set(p.designationId, p))
    return map
  }, [policies])

  const overrideMap = useMemo(() => {
    const map = new Map<string, EmployeeAttendanceOverride>()
    employeeOverrides.forEach((o) => map.set(o.employeeId, o))
    return map
  }, [employeeOverrides])

  /* ─── Designation Policy Operations ─── */
  const handleOpenPolicyModal = (desig: Designation) => {
    setPolicyTargetDesig(desig)
    const existing = policyMap.get(desig.id)
    setPolicyAutoPresent(existing ? existing.autoPresent : false)
    setPolicyAttendanceExempt(existing ? existing.attendanceExempt : false)
    setPolicyModalOpen(true)
  }

  const handleSavePolicy = async () => {
    if (!policyTargetDesig) return
    setActionLoading(true)
    try {
      await organizationApi.upsertDesignationAttendancePolicy({
        designationId: policyTargetDesig.id,
        autoPresent: policyAutoPresent,
        attendanceExempt: policyAttendanceExempt,
      })
      toast.success(`Attendance policy updated for ${policyTargetDesig.name}`)
      setPolicyModalOpen(false)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update attendance policy')
    } finally {
      setActionLoading(false)
    }
  }

  /* ─── Employee Override Operations ─── */
  const handleOpenEmpOverrideModal = (emp: EmployeeListItem) => {
    setOverrideTargetEmp(emp)
    const existing = overrideMap.get(emp.id)
    if (existing) {
      setEmpAutoPresent(existing.autoPresent)
      setEmpAttendanceExempt(existing.attendanceExempt)
      setEmpReasonInput(existing.reason || '')
    } else {
      // Fallback to designation policy defaults
      const desigPolicy = policyMap.get(emp.designationId)
      setEmpAutoPresent(desigPolicy ? desigPolicy.autoPresent : false)
      setEmpAttendanceExempt(desigPolicy ? desigPolicy.attendanceExempt : false)
      setEmpReasonInput('')
    }
    setEmpOverrideModalOpen(true)
  }

  const handleSaveEmpOverride = async () => {
    if (!overrideTargetEmp) return
    setActionLoading(true)
    try {
      await attendanceApi.upsertEmployeeOverride({
        employeeId: overrideTargetEmp.id,
        autoPresent: empAutoPresent,
        attendanceExempt: empAttendanceExempt,
        reason: empReasonInput.trim() || undefined,
      })
      toast.success(`Attendance override updated for ${overrideTargetEmp.displayName}`)
      setEmpOverrideModalOpen(false)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update employee override')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetEmpOverride = async () => {
    if (!resetOverrideTarget) return
    setActionLoading(true)
    try {
      await attendanceApi.deleteEmployeeOverride(resetOverrideTarget.id)
      toast.success(`Attendance override removed for ${resetOverrideTarget.displayName}. Falling back to designation policy.`)
      setResetOverrideTarget(null)
      loadAllData(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset employee override')
    } finally {
      setActionLoading(false)
    }
  }

  /* ─── Filtered Datasets ─── */
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => matchesSearch(d.name, deptSearch))
  }, [departments, deptSearch])

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>()
    departments.forEach((d) => map.set(d.id, d.name))
    return map
  }, [departments])

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (teamDeptFilter !== 'ALL' && t.departmentId !== teamDeptFilter) return false
      const deptName = departmentMap.get(t.departmentId) || ''
      return matchesSearch(t.name, teamSearch) || matchesSearch(deptName, teamSearch)
    })
  }, [teams, teamDeptFilter, teamSearch, departmentMap])

  const filteredDesignations = useMemo(() => {
    return designations.filter((d) => matchesSearch(d.name, desigSearch))
  }, [designations, desigSearch])

  const filteredPolicyDesignations = useMemo(() => {
    return designations.filter((d) => matchesSearch(d.name, policySearch))
  }, [designations, policySearch])

  const filteredEmployeesForOverride = useMemo(() => {
    return employees.filter((e) => {
      const q = employeeOverrideSearch
      const codeStr = e.employeeCode ? e.employeeCode.toString() : ''
      const desigName = e.designation?.name || ''
      return (
        matchesSearch(e.displayName, q) ||
        matchesSearch(codeStr, q) ||
        matchesSearch(desigName, q)
      )
    })
  }, [employees, employeeOverrideSearch])

  return (
    <Box sx={{ width: '100%', mx: 'auto', pb: 5 }}>
      <PageHeader
        title="Organization Management"
        subtitle="Manage departments, teams, designations, and designation/employee attendance policies"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Organization Management' },
        ]}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={
              refreshing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon fontSize="small" />
              )
            }
            onClick={handleRefresh}
            disabled={refreshing || loading}
            sx={{ borderRadius: '8px' }}
          >
            Refresh
          </Button>
        }
      />

      {/* ─── TABS HEADER ─── */}
      <Paper elevation={2} sx={{ borderRadius: '16px', mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9375rem',
              py: 2,
              minHeight: 56,
              gap: 1,
            },
          }}
        >
          <Tab
            icon={<BusinessIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Departments</span>
                <Chip
                  label={departments.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>
            }
          />
          <Tab
            icon={<BadgeIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Designations</span>
                <Chip
                  label={designations.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>
            }
          />
          <Tab
            icon={<GroupsIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Teams</span>
                <Chip
                  label={teams.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>
            }
          />
          <Tab
            icon={<RuleIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Attendance Policy</span>
                <Chip
                  label={
                    employeeOverrides.length > 0
                      ? `${policies.length} desig • ${employeeOverrides.length} overrides`
                      : `${policies.length} desig`
                  }
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
                />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* ─── TAB CONTENT PANELS ─── */}
      {loading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={36} />
        </Box>
      ) : (
        <>
          {/* ══════════════════════════════════════════════
              TAB 0: DEPARTMENTS
             ══════════════════════════════════════════════ */}
          {activeTab === 0 && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 3,
                }}
              >
                <TextField
                  placeholder="Search departments..."
                  size="small"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: deptSearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setDeptSearch('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{ width: { xs: '100%', sm: 300 } }}
                />

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDeptModal()}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  Add Department
                </Button>
              </Box>

              {filteredDepartments.length === 0 ? (
                <EmptyState
                  title="No Departments Found"
                  subtitle={
                    deptSearch
                      ? `No department matching "${deptSearch}"`
                      : 'No departments have been added yet.'
                  }
                />
              ) : (
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Department Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 140 }} align="right">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDepartments.map((dept) => (
                        <TableRow
                          key={dept.id}
                          hover
                          sx={{ opacity: dept.isActive ? 1 : 0.6 }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {dept.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={dept.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={dept.isActive ? 'success' : 'default'}
                              sx={{ fontWeight: 600, height: 22 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title="Edit / Rename">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenDeptModal(dept)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {dept.isActive && (
                                <Tooltip title="Deactivate Department">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setDeactivateDeptTarget(dept)}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}

          {/* ══════════════════════════════════════════════
              TAB 1: DESIGNATIONS
             ══════════════════════════════════════════════ */}
          {activeTab === 1 && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 3,
                }}
              >
                <TextField
                  placeholder="Search designations..."
                  size="small"
                  value={desigSearch}
                  onChange={(e) => setDesigSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: desigSearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setDesigSearch('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{ width: { xs: '100%', sm: 300 } }}
                />

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDesigModal()}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  Add Designation
                </Button>
              </Box>

              {filteredDesignations.length === 0 ? (
                <EmptyState
                  title="No Designations Found"
                  subtitle={
                    desigSearch
                      ? `No designation matching "${desigSearch}"`
                      : 'No designations have been created yet.'
                  }
                />
              ) : (
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Designation Title</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Attendance Policy</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 160 }} align="right">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDesignations.map((desig) => {
                        const policy = policyMap.get(desig.id)
                        return (
                          <TableRow
                            key={desig.id}
                            hover
                            sx={{ opacity: desig.isActive ? 1 : 0.6 }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {desig.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={desig.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                color={desig.isActive ? 'success' : 'default'}
                                sx={{ fontWeight: 600, height: 22 }}
                              />
                            </TableCell>
                            <TableCell>
                              {policy && (policy.autoPresent || policy.attendanceExempt) ? (
                                <Stack direction="row" spacing={1}>
                                  {policy.autoPresent && (
                                    <Chip
                                      label="Auto Present"
                                      size="small"
                                      color="info"
                                      sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                    />
                                  )}
                                  {policy.attendanceExempt && (
                                    <Chip
                                      label="Exempt"
                                      size="small"
                                      color="secondary"
                                      sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                    />
                                  )}
                                </Stack>
                              ) : (
                                <Chip
                                  label="Standard"
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, fontSize: '0.75rem' }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Configure Attendance Policy">
                                  <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleOpenPolicyModal(desig)}
                                  >
                                    <RuleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit / Rename">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleOpenDesigModal(desig)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {desig.isActive && (
                                  <Tooltip title="Deactivate Designation">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setDeactivateDesigTarget(desig)}
                                    >
                                      <BlockIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
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
            </Paper>
          )}

          {/* ══════════════════════════════════════════════
              TAB 2: TEAMS
             ══════════════════════════════════════════════ */}
          {activeTab === 2 && (
            <Stack spacing={3}>
              {/* Teams Feature Toggle Card */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '10px',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        display: 'flex',
                      }}
                    >
                      <GroupsIcon />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Teams Feature
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {usesTeams
                          ? 'Teams are currently enabled for this company.'
                          : 'Teams are currently disabled for this company.'}
                      </Typography>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={usesTeams}
                        onChange={handleToggleUsesTeams}
                        disabled={settingLoading || loading}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {usesTeams ? 'Teams: Enabled' : 'Teams: Disabled'}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>
              </Paper>

              {!usesTeams ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography fontWeight={600} gutterBottom>
                    Teams are currently disabled for this company.
                  </Typography>
                  <Typography variant="body2">
                    Employees currently belong directly to their respective Departments. To organize departments into sub-teams and assign employees to teams, enable Teams above.
                  </Typography>
                </Alert>
              ) : (
                <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Department Filter</InputLabel>
                        <Select
                          value={teamDeptFilter}
                          label="Department Filter"
                          onChange={(e) => setTeamDeptFilter(e.target.value)}
                        >
                          <MenuItem value="ALL">All Departments ({departments.length})</MenuItem>
                          {departments.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                              {d.name} {!d.isActive ? '(Inactive)' : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        placeholder="Search teams..."
                        size="small"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: teamSearch ? (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setTeamSearch('')}>
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{ minWidth: { xs: '100%', sm: 260 } }}
                      />
                    </Stack>

                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenTeamModal()}
                      sx={{ borderRadius: '8px' }}
                      disabled={departments.filter((d) => d.isActive).length === 0}
                    >
                      Add Team
                    </Button>
                  </Box>

                  {/* Teams Table */}
                  {filteredTeams.length === 0 ? (
                    <EmptyState
                      title="No teams found"
                      subtitle={
                        teamSearch || teamDeptFilter !== 'ALL'
                          ? 'No teams match your filter criteria'
                          : 'No teams created for this company yet. Click "Add Team" to organize departments.'
                      }
                    />
                  ) : (
                    <TableContainer sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}>
                      <Table size="medium">
                        <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Team Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Employees
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Status
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredTeams.map((t) => {
                            const parentDept = departments.find((d) => d.id === t.departmentId)
                            const teamEmployees = employees.filter((e) => e.teamId === t.id && e.isActive)
                            return (
                              <TableRow key={t.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <GroupsIcon fontSize="small" color="action" />
                                    <Typography fontWeight={600}>{t.name}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={parentDept?.name || 'Unknown Department'}
                                    size="small"
                                    variant="outlined"
                                    color={parentDept?.isActive ? 'default' : 'warning'}
                                    sx={{ fontWeight: 500 }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={`${teamEmployees.length} active`}
                                    size="small"
                                    color={teamEmployees.length > 0 ? 'primary' : 'default'}
                                    variant={teamEmployees.length > 0 ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={t.isActive ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={t.isActive ? 'success' : 'default'}
                                    variant="filled"
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Tooltip title="Edit / Rename / Move Team">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => {
                                          setEditingTeam(t)
                                          setTeamNameInput(t.name)
                                          setTeamDeptInput(t.departmentId)
                                          setTeamModalOpen(true)
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {t.isActive && (
                                      <Tooltip title="Deactivate Team">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => setDeactivateTeamTarget(t)}
                                        >
                                          <BlockIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
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
                </Paper>
              )}
            </Stack>
          )}

{/* ══════════════════════════════════════════════
              TAB 3: ATTENDANCE POLICY (DESIGNATION + EMPLOYEE OVERRIDES)
             ══════════════════════════════════════════════ */}
          {activeTab === 3 && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
              <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Attendance Policy Hierarchy
                </Typography>
                <Typography variant="body2">
                  1. <strong>Employee Override:</strong> Takes top precedence for individual contract/role exceptions.
                  <br />
                  2. <strong>Designation Policy:</strong> Applies to all employees in that designation when no employee override is set.
                  <br />
                  3. <strong>Default Policy:</strong> Standard attendance tracking (8h working, 30m lunch, 20m break).
                </Typography>
              </Alert>

              {/* Mode Toggle: Designation Policies vs Employee Overrides */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <ToggleButtonGroup
                  value={policyMode}
                  exclusive
                  onChange={(_, val) => val && setPolicyMode(val)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2.5,
                      py: 0.75,
                    },
                  }}
                >
                  <ToggleButton value="DESIGNATION">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BadgeIcon fontSize="small" />
                      <span>Designation Policies ({designations.length})</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="EMPLOYEE">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon fontSize="small" />
                      <span>Employee Overrides ({employeeOverrides.length})</span>
                    </Stack>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* ─── SUB-MODE A: DESIGNATION POLICIES ─── */}
              {policyMode === 'DESIGNATION' && (
                <>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      placeholder="Search designations to configure policy..."
                      size="small"
                      value={policySearch}
                      onChange={(e) => setPolicySearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: policySearch ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setPolicySearch('')}>
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{ width: { xs: '100%', sm: 360 } }}
                    />
                  </Box>

                  {filteredPolicyDesignations.length === 0 ? (
                    <EmptyState
                      title="No Designations Found"
                      subtitle="No matching designations available for attendance policy configuration."
                    />
                  ) : (
                    <TableContainer>
                      <Table size="medium">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Auto Present</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Attendance Exempt</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 140 }} align="right">
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredPolicyDesignations.map((desig) => {
                            const policy = policyMap.get(desig.id)
                            const isAutoPresent = policy ? policy.autoPresent : false
                            const isExempt = policy ? policy.attendanceExempt : false

                            return (
                              <TableRow key={desig.id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>
                                    {desig.name}
                                  </Typography>
                                  {!desig.isActive && (
                                    <Chip
                                      label="Inactive Designation"
                                      size="small"
                                      sx={{ height: 18, fontSize: '0.625rem', mt: 0.5 }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={isAutoPresent ? 'Enabled' : 'Disabled'}
                                    size="small"
                                    color={isAutoPresent ? 'info' : 'default'}
                                    variant={isAutoPresent ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 600, height: 22 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={isExempt ? 'Exempt' : 'Tracked'}
                                    size="small"
                                    color={isExempt ? 'secondary' : 'default'}
                                    variant={isExempt ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 600, height: 22 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<RuleIcon fontSize="small" />}
                                    onClick={() => handleOpenPolicyModal(desig)}
                                    sx={{ borderRadius: '8px', fontSize: '0.75rem' }}
                                  >
                                    Configure
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}

              {/* ─── SUB-MODE B: EMPLOYEE OVERRIDES ─── */}
              {policyMode === 'EMPLOYEE' && (
                <>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      placeholder="Search employees by name, code (#123), or designation..."
                      size="small"
                      value={employeeOverrideSearch}
                      onChange={(e) => setEmployeeOverrideSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: employeeOverrideSearch ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setEmployeeOverrideSearch('')}>
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{ width: { xs: '100%', sm: 420 } }}
                    />
                  </Box>

                  {filteredEmployeesForOverride.length === 0 ? (
                    <EmptyState
                      title="No Employees Found"
                      subtitle="No matching employees found."
                    />
                  ) : (
                    <TableContainer>
                      <Table size="medium">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Effective Policy</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Policy Source</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 220 }} align="right">
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredEmployeesForOverride.map((emp) => {
                            const override = overrideMap.get(emp.id)
                            const desigPolicy = policyMap.get(emp.designationId)

                            // Resolution Hierarchy: Employee Override -> Designation Policy -> Default
                            let source = 'Default Policy'
                            let isAutoPresent = false
                            let isExempt = false

                            if (override) {
                              source = 'Employee Override'
                              isAutoPresent = override.autoPresent
                              isExempt = override.attendanceExempt
                            } else if (desigPolicy) {
                              source = `Designation (${emp.designation?.name || 'Role'})`
                              isAutoPresent = desigPolicy.autoPresent
                              isExempt = desigPolicy.attendanceExempt
                            }

                            const hasOverride = Boolean(override)

                            return (
                              <TableRow key={emp.id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>
                                    {emp.displayName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    #{emp.employeeCode}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {emp.designation?.name || '—'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    {isAutoPresent ? (
                                      <Chip
                                        label="Auto Present"
                                        size="small"
                                        color="info"
                                        sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                      />
                                    ) : null}
                                    {isExempt ? (
                                      <Chip
                                        label="Attendance Exempt"
                                        size="small"
                                        color="secondary"
                                        sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                                      />
                                    ) : null}
                                    {!isAutoPresent && !isExempt && (
                                      <Chip
                                        label="Standard Tracking"
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.75rem' }}
                                      />
                                    )}
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={source}
                                    size="small"
                                    color={hasOverride ? 'warning' : 'default'}
                                    variant={hasOverride ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: hasOverride ? 700 : 500, height: 24 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button
                                      variant={hasOverride ? 'contained' : 'outlined'}
                                      size="small"
                                      color={hasOverride ? 'warning' : 'primary'}
                                      startIcon={<EditIcon fontSize="small" />}
                                      onClick={() => handleOpenEmpOverrideModal(emp)}
                                      sx={{ borderRadius: '8px', fontSize: '0.75rem' }}
                                    >
                                      {hasOverride ? 'Edit Override' : 'Override'}
                                    </Button>

                                    {hasOverride && (
                                      <Tooltip title="Reset to designation policy">
                                        <IconButton
                                          size="small"
                                          color="default"
                                          onClick={() => setResetOverrideTarget(emp)}
                                        >
                                          <RestartAltIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
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
                </>
              )}
            </Paper>
          )}

          {/* ─── CROSS-LINK FOOTER TO WORKPLACE SETTINGS ─── */}
          <Paper
            variant="outlined"
            sx={{
              mt: 4,
              p: 2.5,
              borderRadius: '16px',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              borderColor: alpha(theme.palette.primary.main, 0.15),
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Workplace & Office Location Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure GPS coordinates, geo-fence radius, and working hours (8h working, 30m lunch, 20m break).
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/admin/geo-settings')}
              sx={{ borderRadius: '8px' }}
            >
              Open Workplace Settings
            </Button>
          </Paper>
        </>
      )}

      {/* ─── DIALOGS ─── */}

      {/* 1. Department Create / Edit Dialog */}
      <Dialog
        open={deptModalOpen}
        onClose={() => !actionLoading && setDeptModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDept ? 'Edit Department' : 'Create Department'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <TextField
            autoFocus
            label="Department Name"
            value={deptNameInput}
            onChange={(e) => setDeptNameInput(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. Engineering"
            disabled={actionLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeptModalOpen(false)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveDept}
            variant="contained"
            disabled={actionLoading || !deptNameInput.trim()}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Department Deactivation Dialog */}
      <Dialog
        open={Boolean(deactivateDeptTarget)}
        onClose={() => !actionLoading && setDeactivateDeptTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Deactivate Department</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate{' '}
            <strong>{deactivateDeptTarget?.name}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This is a safe soft-deactivation. Existing employees and historical records will remain intact.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeactivateDeptTarget(null)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeactivateDept}
            color="error"
            variant="contained"
            disabled={actionLoading}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Deactivating...' : 'Confirm Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Team Create / Edit Dialog */}
      <Dialog
        open={teamModalOpen}
        onClose={() => !actionLoading && setTeamModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingTeam ? 'Edit Team' : 'Create Team'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Parent Department</InputLabel>
              <Select
                value={teamDeptInput}
                label="Parent Department"
                onChange={(e) => setTeamDeptInput(e.target.value)}
                disabled={actionLoading}
              >
                {departments
                  .filter((d) => d.isActive || d.id === teamDeptInput)
                  .map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name} {!d.isActive ? '(Inactive)' : ''}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Team Name"
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. Frontend Core"
              disabled={actionLoading}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setTeamModalOpen(false)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTeam}
            variant="contained"
            disabled={actionLoading || !teamNameInput.trim() || !teamDeptInput}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 4. Team Deactivation Dialog */}
      <Dialog
        open={Boolean(deactivateTeamTarget)}
        onClose={() => !actionLoading && setDeactivateTeamTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Deactivate Team</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate{' '}
            <strong>{deactivateTeamTarget?.name}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Existing employees assigned to this team will retain their team assignment and history.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeactivateTeamTarget(null)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeactivateTeam}
            color="error"
            variant="contained"
            disabled={actionLoading}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Deactivating...' : 'Confirm Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 5. Designation Create / Edit Dialog */}
      <Dialog
        open={desigModalOpen}
        onClose={() => !actionLoading && setDesigModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDesig ? 'Edit Designation' : 'Create Designation'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <TextField
            autoFocus
            label="Designation Title"
            value={desigNameInput}
            onChange={(e) => setDesigNameInput(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. Senior Software Engineer"
            disabled={actionLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDesigModalOpen(false)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveDesig}
            variant="contained"
            disabled={actionLoading || !desigNameInput.trim()}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. Designation Deactivation Dialog */}
      <Dialog
        open={Boolean(deactivateDesigTarget)}
        onClose={() => !actionLoading && setDeactivateDesigTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Deactivate Designation</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate{' '}
            <strong>{deactivateDesigTarget?.name}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Employees currently assigned to this designation will retain their profile details safely.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeactivateDesigTarget(null)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeactivateDesig}
            color="error"
            variant="contained"
            disabled={actionLoading}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Deactivating...' : 'Confirm Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. Designation Attendance Policy Dialog */}
      <Dialog
        open={policyModalOpen}
        onClose={() => !actionLoading && setPolicyModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Designation Policy Rules
          {policyTargetDesig && (
            <Typography variant="caption" color="text.secondary" display="block">
              {policyTargetDesig.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: policyAutoPresent
                  ? alpha(theme.palette.info.main, 0.06)
                  : 'transparent',
                borderColor: policyAutoPresent
                  ? alpha(theme.palette.info.main, 0.3)
                  : 'divider',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={policyAutoPresent}
                    onChange={(e) => {
                      setPolicyAutoPresent(e.target.checked)
                      if (e.target.checked) setPolicyAttendanceExempt(false)
                    }}
                    color="info"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Auto Present
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Treats punches as immediately Present without duration threshold.
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: policyAttendanceExempt
                  ? alpha(theme.palette.secondary.main, 0.06)
                  : 'transparent',
                borderColor: policyAttendanceExempt
                  ? alpha(theme.palette.secondary.main, 0.3)
                  : 'divider',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={policyAttendanceExempt}
                    onChange={(e) => {
                      setPolicyAttendanceExempt(e.target.checked)
                      if (e.target.checked) setPolicyAutoPresent(false)
                    }}
                    color="secondary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Attendance Exempt
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Excludes this designation from attendance tracking and daily absence flags.
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setPolicyModalOpen(false)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSavePolicy}
            variant="contained"
            disabled={actionLoading}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Saving...' : 'Save Policy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 8. Employee Attendance Override Dialog */}
      <Dialog
        open={empOverrideModalOpen}
        onClose={() => !actionLoading && setEmpOverrideModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Employee Attendance Override
          {overrideTargetEmp && (
            <Typography variant="caption" color="text.secondary" display="block">
              {overrideTargetEmp.displayName} (#{overrideTargetEmp.employeeCode}) • Designation: {overrideTargetEmp.designation?.name || '—'}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {overrideTargetEmp && (
            <Alert severity="info" variant="outlined" sx={{ mb: 2.5, borderRadius: '12px' }}>
              <strong>Designation Fallback:</strong> {overrideTargetEmp.designation?.name || '—'} (
              {(() => {
                const desigPol = policyMap.get(overrideTargetEmp.designationId)
                if (!desigPol || (!desigPol.autoPresent && !desigPol.attendanceExempt)) {
                  return 'Standard Attendance Tracking'
                }
                return [
                  desigPol.autoPresent ? 'Auto Present: ON' : null,
                  desigPol.attendanceExempt ? 'Attendance Exempt: ON' : null,
                ]
                  .filter(Boolean)
                  .join(', ')
              })()}
              )
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: empAutoPresent
                  ? alpha(theme.palette.info.main, 0.06)
                  : 'transparent',
                borderColor: empAutoPresent
                  ? alpha(theme.palette.info.main, 0.3)
                  : 'divider',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={empAutoPresent}
                    onChange={(e) => {
                      setEmpAutoPresent(e.target.checked)
                      if (e.target.checked) setEmpAttendanceExempt(false)
                    }}
                    color="info"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Override: Auto Present
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Treats punches as immediately Present regardless of worked duration threshold.
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: empAttendanceExempt
                  ? alpha(theme.palette.secondary.main, 0.06)
                  : 'transparent',
                borderColor: empAttendanceExempt
                  ? alpha(theme.palette.secondary.main, 0.3)
                  : 'divider',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={empAttendanceExempt}
                    onChange={(e) => {
                      setEmpAttendanceExempt(e.target.checked)
                      if (e.target.checked) setEmpAutoPresent(false)
                    }}
                    color="secondary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Override: Attendance Exempt
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Excludes this employee completely from attendance tracking and daily absence flags.
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <TextField
              label="Override Reason / Audit Note"
              placeholder="e.g. Contract agreement / Field worker exemption / Offer letter clause"
              value={empReasonInput}
              onChange={(e) => setEmpReasonInput(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
              disabled={actionLoading}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setEmpOverrideModalOpen(false)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEmpOverride}
            variant="contained"
            disabled={actionLoading}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Saving...' : 'Save Override'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 9. Employee Override Reset Confirmation Dialog */}
      <Dialog
        open={Boolean(resetOverrideTarget)}
        onClose={() => !actionLoading && setResetOverrideTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reset to Designation Policy</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to remove the attendance override for{' '}
            <strong>{resetOverrideTarget?.displayName}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            The employee will immediately fall back to the designation policy ({resetOverrideTarget?.designation?.name || 'Role'}). Historical attendance records will remain intact.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setResetOverrideTarget(null)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetEmpOverride}
            color="primary"
            variant="contained"
            disabled={actionLoading}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {actionLoading ? 'Resetting...' : 'Confirm Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminOrganization
