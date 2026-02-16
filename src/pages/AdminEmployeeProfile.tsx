// src/pages/AdminEmployeeProfile.tsx
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useEmployeeById } from '../hooks/useEmployee'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

const AdminEmployeeProfile = () => {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const { employee, loading, error } = useEmployeeById(employeeId)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!employee) return <ErrorState message="Employee not found" />

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/employees')}
        sx={{ mb: 2 }}
      >
        Back to list
      </Button>

      <Typography variant="h5" mb={3}>
        {employee.displayName}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Profile
            </Typography>
            <Typography>
              Email: {employee.user.email}
            </Typography>
            <Typography>
              Code: {employee.employeeCode}
            </Typography>
            <Typography>
              Designation: {employee.designation.name}
            </Typography>
            <Typography>
              Team: {employee.team?.name ?? '—'}
            </Typography>
            <Typography>
              Joined:{' '}
              {new Date(employee.joiningDate).toLocaleDateString()}
            </Typography>
            <Box mt={1}>
              <Chip
                label={employee.isActive ? 'Active' : 'Inactive'}
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
              Hierarchy
            </Typography>

            <Typography variant="body2" fontWeight={600}>
              Manager
            </Typography>
            <Typography mb={2}>
              {employee.manager?.displayName ?? 'None'}
            </Typography>

            <Typography variant="body2" fontWeight={600}>
              Reportees
            </Typography>
            {employee.subordinates && employee.subordinates.length > 0 ? (
              employee.subordinates.map((s) => (
                <Typography key={s.id}>{s.displayName}</Typography>
              ))
            ) : (
              <Typography color="text.secondary">
                No reportees
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminEmployeeProfile