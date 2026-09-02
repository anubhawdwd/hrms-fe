import { useState } from 'react'
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
import { ResetPasswordDialog } from '../components/ResetPasswordDialog'
import { OffboardEmployeeModal } from '../components/OffboardEmployeeModal'
import { ReactivateEmployeeDialog } from '../components/ReactivateEmployeeDialog'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import RestoreIcon from '@mui/icons-material/Restore'
import LockResetIcon from '@mui/icons-material/LockReset'
import { useUser } from '../hooks/useAuth'
import { Button, Stack } from '@mui/material'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

const AdminEmployeeProfile = () => {
  const { employeeId } = useParams<{ employeeId: string }>()
  const currentUser = useUser()
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [offboardModalOpen, setOffboardModalOpen] = useState(false)
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false)
  const isHrOrAdmin = currentUser?.role === 'HR' || currentUser?.role === 'COMPANY_ADMIN'
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
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isHrOrAdmin && (
              <>
                {employee.isActive ? (
                  <>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      startIcon={<LockResetIcon />}
                      onClick={() => setResetModalOpen(true)}
                    >
                      Reset Password
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<PersonOffIcon />}
                      onClick={() => setOffboardModalOpen(true)}
                    >
                      Deactivate / Offboard
                    </Button>
                  </>
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
              </>
            )}
            <Chip
              label={employee.isActive ? 'Active' : 'Inactive'}
              color={employee.isActive ? 'success' : 'default'}
              size="small"
            />
          </Stack>
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
              <strong>Department:</strong> {employee.department?.name ?? '—'}
            </Typography>
            {employee.team && (
              <Typography mb={1}>
                <strong>Team:</strong> {employee.team.name}
              </Typography>
            )}
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
      <ResetPasswordDialog
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        userId={employee.userId}
        employeeName={employee.displayName}
        email={employee.user.email}
      />

      {/* Offboard Modal */}
      <OffboardEmployeeModal
        open={offboardModalOpen}
        employee={employee}
        onClose={() => setOffboardModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Reactivate Dialog */}
      <ReactivateEmployeeDialog
        open={reactivateModalOpen}
        employee={employee}
        onClose={() => setReactivateModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </Box>
  )
}

export default AdminEmployeeProfile
