import Card from '../../../components/ui/Card/Card'
import Typography from '../../../components/ui/Typography/Typography'
import Box from '@mui/material/Box'
import type { EmployeeMini } from '../types'
import LeaveStatusBadge from './LeaveStatusBadge'

interface Props {
  peers: EmployeeMini[]
}

const PeerList = ({ peers }: Props) => {
  return (
    <Card>
      <Box sx={{ p: 2 }}>
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            My Team
          </Typography>
        </Box>

        {peers.length === 0 && (
          <Typography color="text.secondary">
            No teammates found in your team.
          </Typography>
        )}

        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {peers.map(peer => (
            <Box key={peer.id}>
              <Typography>{peer.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {peer.designation ?? '-'}
              </Typography>
              <LeaveStatusBadge isOnLeave={peer.isOnLeaveToday} />
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  )
}

export default PeerList
