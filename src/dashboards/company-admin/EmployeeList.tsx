import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import Container from '../../components/ui/Container/Container'
import Typography from '../../components/ui/Typography/Typography'
import Card from '../../components/ui/Card/Card'
import Table from '../../components/ui/Table/Table'

import { useIsMobile } from '../../utils/responsive'
import { useAdminEmployeeList } from '../../modules/employee/hooks.admin'

const EmployeeList = () => {
  const isMobile = useIsMobile()

  const {
    employees,
    loading,
    error,
    showInactive,
    toggleShowInactive,
  } = useAdminEmployeeList()

  return (
    <Container>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h6">
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Company employee directory
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={showInactive}
              onChange={toggleShowInactive}
            />
          }
          label="Show inactive"
        />
      </Box>

      {/* States */}
      {loading && (
        <Typography>Loading employees…</Typography>
      )}

      {error && (
        <Typography color="error">
          {error}
        </Typography>
      )}

      {!loading && !error && employees.length === 0 && (
        <Typography color="text.secondary">
          No employees found
        </Typography>
      )}

      {/* Mobile view */}
      {!loading && !error && isMobile && (
        <Box display="flex" flexDirection="column" gap={2}>
          {employees.map(emp => (
            <Card key={emp.id}>
              <Typography fontWeight={600}>
                {emp.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {emp.designation || '—'}
              </Typography>

              <Typography
                variant="caption"
                color={emp.isActive ? 'success.main' : 'text.secondary'}
              >
                {emp.isActive ? 'Active' : 'Inactive'}
              </Typography>
            </Card>
          ))}
        </Box>
      )}

      {/* Tablet / Desktop view */}
      {!loading && !error && !isMobile && (
        <Table
          headers={[
             'Name' ,
             'Designation' ,
             'Team' ,
             'Status' ,
          ]}
          rows={employees.map(emp => ([
             emp.id,
             emp.name,
             emp.designation || '—',
             emp.team || '—',
             emp.isActive ? 'Active' : 'Inactive',
          ]))}
        />
      )}
    </Container>
  )
}

export default EmployeeList