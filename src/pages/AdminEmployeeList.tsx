// src/pages/AdminEmployeeList.tsx
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useEmployeeList } from '../hooks/useEmployee'
import DataTable from '../components/DataTable'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

const AdminEmployeeList = () => {
  const navigate = useNavigate()
  const { employees, loading, error, showInactive, toggleInactive, reload } =
    useEmployeeList()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5">Employees</Typography>
        <FormControlLabel
          control={
            <Switch checked={showInactive} onChange={toggleInactive} />
          }
          label="Show inactive"
        />
      </Box>

      <DataTable
        data={employees}
        emptyMessage="No employees found"
        columns={[
          {
            label: 'Code',
            render: (row) => row.employeeCode,
          },
          {
            label: 'Name',
            render: (row) => (
              <Box
                sx={{ cursor: 'pointer', color: 'primary.main' }}
                onClick={() =>
                  navigate(`/admin/employees/${row.id}`)
                }
              >
                {row.displayName}
              </Box>
            ),
          },
          {
            label: 'Email',
            render: (row) => row.user.email,
          },
          {
            label: 'Designation',
            render: (row) => row.designation.name,
          },
          {
            label: 'Team',
            render: (row) => row.team?.name ?? '—',
          },
          {
            label: 'Status',
            render: (row) => (
              <Chip
                label={row.isActive ? 'Active' : 'Inactive'}
                color={row.isActive ? 'success' : 'default'}
                size="small"
              />
            ),
          },
        ]}
      />
    </Box>
  )
}

export default AdminEmployeeList