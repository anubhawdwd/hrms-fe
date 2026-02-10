import Container from '../../../components/ui/Container/Container'
import Typography from '../../../components/ui/Typography/Typography'
import Box from '@mui/material/Box'

import {
  useEmployeeBootstrap,
  useEmployeeProfile,
  useEmployeeHierarchy,
  useEmployeeLoading,
  useEmployeeError,
} from '../hooks'

import ProfileCard from '../components/ProfileCard'
import ManagerCard from '../components/ManagerCard'
import PeerList from '../components/PeerList'
import ReporteeList from '../components/ReporteeList'

const EmployeeDashboard = () => {
  useEmployeeBootstrap()

  const profile = useEmployeeProfile()
  const hierarchy = useEmployeeHierarchy()
  const loading = useEmployeeLoading()
  const error = useEmployeeError()

  if (loading) {
    return (
      <Container>
        <Box mt={6} textAlign="center">
          <Typography variant="h6">
            Loading your dashboard…
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={1}
          >
            Fetching profile, team, and hierarchy
          </Typography>
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Box mt={6} textAlign="center">
          <Typography variant="h6" color="error">
            Something went wrong
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={1}
          >
            {error}
          </Typography>
        </Box>
      </Container>
    )
  }

  if (!profile || !hierarchy) {
    return (
      <Container>
        <Box mt={6} textAlign="center">
          <Typography variant="h6">
            No employee data found
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={1}
          >
            Please contact HR if this looks incorrect.
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container>
      {/* Page Title */}
      <Box mb={3}>
        <Typography variant="h5">
          Employee Dashboard
        </Typography>
      </Box>

      {/* Responsive Grid */}
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
        <Box sx={{ display: 'grid', gap: 'var(--space-4)' }}>
          <ProfileCard profile={profile} />
          <ManagerCard manager={hierarchy.manager} />
        </Box>

        <Box sx={{ display: 'grid', gap: 'var(--space-4)' }}>
          <PeerList peers={hierarchy.peers} />
          <ReporteeList reportees={hierarchy.reportees} />
        </Box>
      </Box>
    </Container>
  )
}

export default EmployeeDashboard
