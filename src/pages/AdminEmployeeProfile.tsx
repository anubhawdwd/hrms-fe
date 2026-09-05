// src/pages/AdminEmployeeProfile.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  Divider,
} from '@mui/material'
import dayjs from 'dayjs'
import { useEmployeeById } from '../hooks/useEmployee'
import PageHeader from '../components/PageHeader'
import { ResetPasswordDialog } from '../components/ResetPasswordDialog'
import { OffboardEmployeeModal } from '../components/OffboardEmployeeModal'
import { ReactivateEmployeeDialog } from '../components/ReactivateEmployeeDialog'
import AdminEmployeeQuickEditModal from '../components/AdminEmployeeQuickEditModal'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import RestoreIcon from '@mui/icons-material/Restore'
import LockResetIcon from '@mui/icons-material/LockReset'
import EditIcon from '@mui/icons-material/Edit'
import { useUser } from '../hooks/useAuth'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

const AdminEmployeeProfile = () => {
  const { employeeId } = useParams<{ employeeId: string }>()
  const currentUser = useUser()
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [offboardModalOpen, setOffboardModalOpen] = useState(false)
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false)
  const [quickEditOpen, setQuickEditOpen] = useState(false)
  const isHrOrAdmin = currentUser?.role === 'HR' || currentUser?.role === 'COMPANY_ADMIN'
  const { employee, loading, error, reload } = useEmployeeById(employeeId)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!employee) return <ErrorState message="Employee not found" />

  return (
    <Box>
      <PageHeader
        title={employee.displayName}
        subtitle={`${employee.designation?.name || 'Employee'} • Employee Code: #${employee.employeeCode}`}
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
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setQuickEditOpen(true)}
                >
                  Quick Edit
                </Button>

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
        {/* Profile Details Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} color="primary" mb={2}>
              Profile & Contact Master Data
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Full Legal Name</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {[employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(' ')}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Display Name</Typography>
                <Typography variant="body1" fontWeight={600}>{employee.displayName}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Employee Code</Typography>
                <Typography variant="body1" fontWeight={700} color="primary">#{employee.employeeCode}</Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Company Email</Typography>
                <Typography variant="body1">{employee.user?.email || '—'}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Personal Email</Typography>
                <Typography variant="body1">{employee.user?.personalEmail || '—'}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1">{employee.phone || '—'}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Gender</Typography>
                <Typography variant="body1">{employee.gender || 'Not Specified'}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                <Typography variant="body1">
                  {employee.dateOfBirth ? dayjs(employee.dateOfBirth).format('DD MMMM YYYY') : '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Designation</Typography>
                <Typography variant="body1" fontWeight={600}>{employee.designation?.name || '—'}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Department</Typography>
                <Typography variant="body1">{employee.department?.name ?? '—'}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Team</Typography>
                <Typography variant="body1">{employee.team?.name ?? 'No Team Assigned'}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Joining Date</Typography>
                <Typography variant="body1">
                  {employee.joiningDate ? dayjs(employee.joiningDate).format('DD MMMM YYYY') : '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Employment Status</Typography>
                <Stack direction="row" spacing={1} mt={0.5}>
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
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Hierarchy & Reporting Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} color="primary" mb={2}>
              Organizational Hierarchy & Reportees
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Primary Reporting Manager</Typography>
                <Typography variant="body1" fontWeight={600} mt={0.5}>
                  {employee.manager ? `${employee.manager.displayName} (#${employee.manager.employeeCode || ''})` : 'None (Top of Hierarchy)'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Secondary Reporting Manager</Typography>
                <Typography variant="body1" fontWeight={600} mt={0.5}>
                  {employee.secondaryManager ? `${employee.secondaryManager.displayName} (#${employee.secondaryManager.employeeCode || ''})` : 'None Assigned'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Direct Reportees ({employee.subordinates?.length || 0})
                </Typography>
                {employee.subordinates && employee.subordinates.length > 0 ? (
                  employee.subordinates.map((s) => (
                    <Typography key={s.id} variant="body2" sx={{ py: 0.5 }}>
                      • {s.displayName} {s.employeeCode ? `(#${s.employeeCode})` : ''}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No direct reportees
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Secondary Reportees ({employee.secondarySubordinates?.length || 0})
                </Typography>
                {employee.secondarySubordinates && employee.secondarySubordinates.length > 0 ? (
                  employee.secondarySubordinates.map((s) => (
                    <Typography key={s.id} variant="body2" sx={{ py: 0.5 }}>
                      • {s.displayName} {s.employeeCode ? `(#${s.employeeCode})` : ''}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No secondary reportees
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Edit Modal */}
      {quickEditOpen && (
        <AdminEmployeeQuickEditModal
          open={quickEditOpen}
          onClose={() => {
            setQuickEditOpen(false)
          }}
          employee={employee}
          onEmployeeUpdated={() => {
            reload()
          }}
          usesTeams={true}
        />
      )}

      {/* Reset Password Dialog */}
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
        onSuccess={() => reload()}
      />

      {/* Reactivate Dialog */}
      <ReactivateEmployeeDialog
        open={reactivateModalOpen}
        employee={employee}
        onClose={() => setReactivateModalOpen(false)}
        onSuccess={() => reload()}
      />
    </Box>
  )
}

export default AdminEmployeeProfile
