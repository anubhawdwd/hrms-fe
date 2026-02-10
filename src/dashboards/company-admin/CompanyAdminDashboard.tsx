import Container from '../../components/ui/Container/Container'
import Typography from '../../components/ui/Typography/Typography'
import Box from '@mui/material/Box'

const CompanyAdminDashboard = () => {
  return (
    <Container>
      <Box mb={3}>
        <Typography variant="h5">
          Company Administration
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          mt={0.5}
        >
          Manage employees, leaves, attendance, and organization
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
          },
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add, update, and manage employee profiles
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Leaves & Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Approve leaves and manage attendance records
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Organization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Departments, teams, designations, holidays
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default CompanyAdminDashboard
