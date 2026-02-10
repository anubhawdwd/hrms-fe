import Typography from '../../../components/ui/Typography/Typography'

interface Props {
  isOnLeave?: boolean
}

const LeaveStatusBadge = ({ isOnLeave }: Props) => {
  if (!isOnLeave) return null

  return (
    <Typography color="warning.main" variant="caption">
      On Leave
    </Typography>
  )
}

export default LeaveStatusBadge
