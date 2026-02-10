import Card from '../../../components/ui/Card/Card'
import Typography from '../../../components/ui/Typography/Typography'
import Box from '@mui/material/Box'
import type { EmployeeProfile } from '../types'

interface Props {
  profile: EmployeeProfile
}

const ProfileCard = ({ profile }: Props) => {
  return (
    <Card>
      <Box sx={{ p: 2 }}>
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            My Profile
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography>Name: {profile.name}</Typography>
          <Typography>Email: {profile.email}</Typography>
          <Typography>Designation: {profile.designation ?? '-'}</Typography>
          <Typography>Department: {profile.department ?? '-'}</Typography>
          <Typography>Team: {profile.team ?? '-'}</Typography>
        </Box>
      </Box>
    </Card>
  )
}

export default ProfileCard
