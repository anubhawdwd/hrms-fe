// src/pages/AdminEmployeeList.tsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Tooltip,
  Paper,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import EditIcon from '@mui/icons-material/Edit'
import { useNavigate } from 'react-router-dom'
import { useEmployeeList } from '../hooks/useEmployee'
import { useUser } from '../hooks/useAuth'
import { organizationApi } from '../api/organization.api'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import AdminEmployeeQuickEditModal from '../components/AdminEmployeeQuickEditModal'
import type { EmployeeListItem } from '../types/employee.types'

/* ─── Levenshtein Distance for Typo-Tolerant Search ─── */
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

const AdminEmployeeList = () => {
  const navigate = useNavigate()
  const user = useUser()
  const [usesTeams, setUsesTeams] = useState<boolean>(user?.usesTeams ?? false)
  const {
    employees,
    rawEmployees,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    activeCount,
    inactiveCount,
    totalCount,
    reload,
    updateEmployeeInList,
  } = useEmployeeList()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] =
    useState<EmployeeListItem | null>(null)
  const [quickEditOpen, setQuickEditOpen] = useState<boolean>(false)

  // Fetch company teams setting once
  useEffect(() => {
    organizationApi
      .getTeamsSetting()
      .then((res) => setUsesTeams(res.usesTeams))
      .catch(() => {})
  }, [])

  // Handle live in-place update after quick edit
  const handleEmployeeUpdated = useCallback(
    (updated: EmployeeListItem) => {
      updateEmployeeInList(updated)
      setSelectedEmployeeForEdit(null)
    },
    [updateEmployeeInList]
  )

  // Typo-tolerant live filtering within current statusFilter scope
  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return employees

    const tokens = query.split(/\s+/).filter(Boolean)

    return employees.filter((emp) => {
      const name = (
        emp.displayName || `${emp.firstName} ${emp.lastName}`
      ).toLowerCase()
      const firstName = (emp.firstName || '').toLowerCase()
      const lastName = (emp.lastName || '').toLowerCase()
      const email = (emp.user?.email || '').toLowerCase()
      const codeStr = String(emp.employeeCode || '')
      const codeFormatted = `#${codeStr}`
      const codeEmp = `emp-${codeStr}`
      const codeEmpPadded = `emp-${codeStr.padStart(4, '0')}`
      const dept = (emp.department?.name || '').toLowerCase()
      const desig = (emp.designation?.name || '').toLowerCase()
      const team = (emp.team?.name || '').toLowerCase()

      const searchableText = `${name} ${email} ${codeStr} ${codeFormatted} ${codeEmp} ${codeEmpPadded} ${dept} ${desig} ${team}`
      const searchableWords = [
        ...name.split(/\s+/),
        firstName,
        lastName,
        ...email.split(/[@.]+/),
        codeStr,
        ...dept.split(/\s+/),
        ...desig.split(/\s+/),
        ...team.split(/\s+/),
      ].filter(Boolean)

      return tokens.every((token) => {
        if (searchableText.includes(token)) return true
        return searchableWords.some((word) => isFuzzyMatch(word, token))
      })
    })
  }, [employees, searchQuery])

  // Table columns definition
  const columns = useMemo(() => {
    const cols = [
      {
        label: 'Code',
        render: (row: EmployeeListItem) => `#${row.employeeCode}`,
      },
      {
        label: 'Name',
        render: (row: EmployeeListItem) => (
          <Box
            sx={{
              cursor: 'pointer',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={() => {
              setSelectedEmployeeForEdit(row)
              setQuickEditOpen(true)
            }}
          >
            {row.displayName}
          </Box>
        ),
      },
      {
        label: 'Email',
        render: (row: EmployeeListItem) => row.user?.email || '—',
      },
      {
        label: 'Department',
        render: (row: EmployeeListItem) => row.department?.name ?? '—',
      },
    ]

    if (usesTeams) {
      cols.push({
        label: 'Team',
        render: (row: EmployeeListItem) => row.team?.name ?? '—',
      })
    }

    cols.push(
      {
        label: 'Designation',
        render: (row: EmployeeListItem) => row.designation?.name ?? '—',
      },
      {
        label: 'Status',
        render: (row: EmployeeListItem) => (
          <Chip
            label={row.isActive ? 'Active' : 'Inactive'}
            color={row.isActive ? 'success' : 'default'}
            size="small"
          />
        ),
      },
      {
        label: 'Actions',
        render: (row: EmployeeListItem) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Quick Edit (Profile, Attendance, Leave)">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  setSelectedEmployeeForEdit(row)
                  setQuickEditOpen(true)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      }
    )

    return cols
  }, [usesTeams])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      <PageHeader
        title={`Employees (${filteredEmployees.length}${
          searchQuery ? ` of ${employees.length}` : ''
        })`}
        subtitle="Company employee directory, live search, and lifecycle management"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Employees' },
        ]}
        action={
          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(_, newVal) => {
                if (newVal) setStatusFilter(newVal)
              }}
              size="small"
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 1,
                borderRadius: 2,
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  px: 1.75,
                  py: 0.6,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  border: 'none',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="ACTIVE">
                Active ({activeCount})
              </ToggleButton>
              <ToggleButton value="INACTIVE">
                Inactive ({inactiveCount})
              </ToggleButton>
              <ToggleButton value="ALL">
                All ({totalCount})
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/admin/employees/new')}
            >
              Onboard Employee
            </Button>
          </Stack>
        }
      />

      {/* ─── Search Bar ─── */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          placeholder="Search by name, email, #code, department, designation, or team..."
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Paper>

      {/* ─── Data Table ─── */}
      <DataTable
        data={filteredEmployees}
        emptyMessage={
          searchQuery
            ? `No employees match "${searchQuery}" in ${statusFilter.toLowerCase()} list`
            : `No ${statusFilter.toLowerCase()} employees found`
        }
        columns={columns}
      />

      {/* ─── Quick Edit Modal ─── */}
      {selectedEmployeeForEdit && (
        <AdminEmployeeQuickEditModal
          open={quickEditOpen}
          onClose={() => {
            setQuickEditOpen(false)
            setSelectedEmployeeForEdit(null)
          }}
          employee={selectedEmployeeForEdit}
          onEmployeeUpdated={handleEmployeeUpdated}
          usesTeams={usesTeams}
          allEmployees={rawEmployees}
        />
      )}
    </Box>
  )
}

export default AdminEmployeeList
