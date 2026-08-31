// src/pages/AdminUserList.tsx
import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import LockResetIcon from '@mui/icons-material/LockReset'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import dayjs from 'dayjs'

import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { userApi } from '../api/user.api'
import type { User } from '../types/user.types'

const formatRole = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin'
    case 'COMPANY_ADMIN':
      return 'Company Admin'
    case 'HR':
      return 'HR'
    case 'EMPLOYEE':
      return 'Employee'
    default:
      return role || '—'
  }
}

const getRoleChipColor = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'secondary'
    case 'COMPANY_ADMIN':
      return 'primary'
    case 'HR':
      return 'info'
    case 'EMPLOYEE':
      return 'default'
    default:
      return 'default'
  }
}

const getProviderChip = (provider?: string) => {
  switch (provider) {
    case 'GOOGLE':
      return <Chip label="Google" size="small" variant="outlined" color="primary" />
    case 'MICROSOFT':
      return <Chip label="Microsoft" size="small" variant="outlined" color="info" />
    case 'LOCAL':
    default:
      return <Chip label="Password" size="small" variant="outlined" />
  }
}

const AdminUserList = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE')

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await userApi.list()
      setUsers(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load user accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Status counts
  const activeCount = useMemo(() => users.filter((u) => u.isActive).length, [users])
  const inactiveCount = useMemo(() => users.filter((u) => !u.isActive).length, [users])
  const totalCount = users.length

  // Filtered by status and search query
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Status scope filter
      if (statusFilter === 'ACTIVE' && !u.isActive) return false
      if (statusFilter === 'INACTIVE' && u.isActive) return false

      // 2. Search query filter
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true

      const name = (
        u.employee?.displayName ||
        `${u.employee?.firstName || ''} ${u.employee?.lastName || ''}`
      ).toLowerCase()
      const email = (u.email || '').toLowerCase()
      const codeStr = String(u.employee?.employeeCode || '')
      const codeFormatted = `#${codeStr}`
      const roleStr = (u.role || '').toLowerCase()
      const providerStr = (u.authProvider || '').toLowerCase()
      const dept = (u.employee?.department?.name || '').toLowerCase()
      const desig = (u.employee?.designation?.name || '').toLowerCase()

      const searchableText = `${name} ${email} ${codeStr} ${codeFormatted} ${roleStr} ${providerStr} ${dept} ${desig}`
      return searchableText.includes(query)
    })
  }, [users, statusFilter, searchQuery])

  // Table column configuration
  const columns = useMemo(
    () => [
      {
        label: 'Code',
        render: (row: User) =>
          row.employee?.employeeCode ? `#${row.employee.employeeCode}` : '—',
      },
      {
        label: 'Name',
        render: (row: User) => (
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {row.employee?.displayName || (
                <span style={{ color: '#9e9e9e', fontStyle: 'italic' }}>No profile</span>
              )}
            </Typography>
            {row.employee?.department?.name && (
              <Typography variant="caption" color="text.secondary">
                {row.employee.department.name}
                {row.employee.designation?.name ? ` • ${row.employee.designation.name}` : ''}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        label: 'Email',
        render: (row: User) => (
          <Typography variant="body2" fontFamily="monospace" fontSize="0.8125rem">
            {row.email}
          </Typography>
        ),
      },
      {
        label: 'Role',
        render: (row: User) => (
          <Chip
            label={formatRole(row.role)}
            color={getRoleChipColor(row.role) as any}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        ),
      },
      {
        label: 'Auth Method',
        render: (row: User) => getProviderChip(row.authProvider),
      },
      {
        label: 'Password Status',
        render: (row: User) =>
          row.mustChangePassword ? (
            <Chip
              icon={<LockResetIcon />}
              label="Must Reset"
              color="warning"
              size="small"
              variant="outlined"
            />
          ) : (
            <Chip
              icon={<CheckCircleOutlineIcon />}
              label="Standard"
              color="success"
              size="small"
              variant="outlined"
            />
          ),
      },
      {
        label: 'Status',
        render: (row: User) => (
          <Chip
            label={row.isActive ? 'Active' : 'Inactive'}
            color={row.isActive ? 'success' : 'default'}
            size="small"
          />
        ),
      },
      {
        label: 'Created',
        render: (row: User) =>
          row.createdAt ? dayjs(row.createdAt).format('DD MMM YYYY') : '—',
      },
    ],
    []
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      <PageHeader
        title={`User Accounts (${filteredUsers.length}${
          searchQuery ? ` of ${users.length}` : ''
        })`}
        subtitle="Company user accounts directory, assigned roles, authentication methods, and security flags"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'User Accounts' },
        ]}
        action={
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
            <ToggleButton value="ACTIVE">Active ({activeCount})</ToggleButton>
            <ToggleButton value="INACTIVE">Inactive ({inactiveCount})</ToggleButton>
            <ToggleButton value="ALL">All ({totalCount})</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {/* ─── Search Bar ─── */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          placeholder="Search by name, email, #code, role, or auth provider..."
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
        data={filteredUsers}
        emptyMessage={
          searchQuery
            ? `No user accounts match "${searchQuery}" in ${statusFilter.toLowerCase()} list`
            : `No ${statusFilter.toLowerCase()} user accounts found`
        }
        columns={columns}
      />
    </Box>
  )
}

export default AdminUserList
