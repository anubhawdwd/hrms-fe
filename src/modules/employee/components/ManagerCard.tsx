import Card from '../../../components/ui/Card/Card'
import Typography from '../../../components/ui/Typography/Typography'
import Box from '@mui/material/Box'
import type { EmployeeMini } from '../types'

interface Props {
  manager?: EmployeeMini
}

const ManagerCard = ({ manager }: Props) => {
  return (
    <Card>
      <Box sx={{ p: 2 }}>
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Reporting Manager
          </Typography>
        </Box>

        {manager ? (
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography>{manager.name}</Typography>
            <Typography color="text.secondary">
              {manager.designation ?? '-'}
            </Typography>
          </Box>
        ) : (
          <Typography color="text.secondary">
            No reporting manager
          </Typography>
        )}
      </Box>
    </Card>
  )
}

export default ManagerCard
