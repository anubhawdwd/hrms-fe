import Card from '../../../components/ui/Card/Card'
import Typography from '../../../components/ui/Typography/Typography'
import Box from '@mui/material/Box'
import type { EmployeeMini } from '../types'
import LeaveStatusBadge from './LeaveStatusBadge'

interface Props {
  reportees: EmployeeMini[]
}

const ReporteeList = ({ reportees }: Props) => {
  return (
    <Card>
      <Box sx={{ p: 2 }}>
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            My Reportees
          </Typography>
        </Box>

        {reportees.length === 0 && (
          <Typography color="text.secondary">
            You don’t have direct reportees yet.
          </Typography>
        )}

        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {reportees.map(rep => (
            <Box key={rep.id}>
              <Typography>{rep.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {rep.designation ?? '-'}
              </Typography>
              <LeaveStatusBadge isOnLeave={rep.isOnLeaveToday} />
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  )
}

export default ReporteeList
