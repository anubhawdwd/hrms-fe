import { useParams } from 'react-router-dom'
import { Typography, CircularProgress } from '@mui/material'
import { useAdminEmployeeById } from '../../modules/employee/hooks.admin'

const EmployeeProfileView = () => {
  const { employeeId } = useParams<{ employeeId: string }>()
  const { data, loading, error } = useAdminEmployeeById(employeeId)

  if (loading) {
    return <CircularProgress />
  }

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  if (!data) {
    return <Typography>No employee found</Typography>
  }

  return (
    <div>
      <Typography variant="h5">{data.name}</Typography>
      <Typography>Email: {data.email}</Typography>
      <Typography>Designation: {data.designation ?? '—'}</Typography>
      <Typography>Department: {data.department ?? '—'}</Typography>
      <Typography>Team: {data.team ?? '—'}</Typography>
      <Typography>
        Status: {data.isActive ? 'Active' : 'Inactive'}
      </Typography>
    </div>
  )
}

export default EmployeeProfileView
