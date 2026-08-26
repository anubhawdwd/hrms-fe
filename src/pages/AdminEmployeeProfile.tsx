// src/pages/AdminEmployeeProfile.tsx
import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
} from '@mui/material'
import { useEmployeeById } from '../hooks/useEmployee'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

const AdminEmployeeProfile = () => {
  const { employeeId } = useParams<{ employeeId: string }>()
  const { employee, loading, error } = useEmployeeById(employeeId)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!employee) return <ErrorState message="Employee not found" />

  return (
    <Box>
      <PageHeader
        title={employee.displayName}
        subtitle={`${employee.designation.name} • Employee Code: #${employee.employeeCode}`}
        backTo="/admin/employees"
        backLabel="Back to Employees"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Employees', path: '/admin/employees' },
          { label: employee.displayName },
        ]}
        action={
          <Chip
            label={employee.isActive ? 'Active' : 'Inactive'}
            color={employee.isActive ? 'success' : 'default'}
            size="small"
          />
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Profile Details
            </Typography>
            <Typography mb={1}>
              <strong>Email:</strong> {employee.user.email}
            </Typography>
            <Typography mb={1}>
              <strong>Code:</strong> #{employee.employeeCode}
            </Typography>
            <Typography mb={1}>
              <strong>Designation:</strong> {employee.designation.name}
            </Typography>
            <Typography mb={1}>
              <strong>Team:</strong> {employee.team?.name ?? '—'}
            </Typography>
            <Typography mb={1}>
              <strong>Joining Date:</strong>{' '}
              {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '—'}
            </Typography>
            <Box mt={2}>
              <Chip
                label={employee.isActive ? 'Active Status' : 'Inactive Status'}
                color={employee.isActive ? 'success' : 'default'}
                size="small"
              />
              {employee.isProbation && (
                <Chip
                  label="Probation"
                  color="warning"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Organizational Hierarchy
            </Typography>

            <Typography variant="body2" fontWeight={600}>
              Reporting Manager
            </Typography>
            <Typography mb={2}>
              {employee.manager?.displayName ?? 'None (Top of Hierarchy)'}
            </Typography>

            <Typography variant="body2" fontWeight={600}>
              Direct Reportees
            </Typography>
            {employee.subordinates && employee.subordinates.length > 0 ? (
              employee.subordinates.map((s) => (
                <Typography key={s.id} sx={{ py: 0.5 }}>
                  • {s.displayName}
                </Typography>
              ))
            ) : (
              <Typography color="text.secondary">
                No direct reportees
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminEmployeeProfile
