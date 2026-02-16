// src/pages/AdminDashboard.tsx
import { Box, Typography, Paper, Grid, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const navigate = useNavigate()

  const cards = [
    {
      title: 'Employees',
      subtitle: 'View and manage employee profiles',
      path: '/admin/employees',
    },
    {
      title: 'Leave Approvals',
      subtitle: 'Approve or reject leave requests',
      path: '/admin/leave-approvals',
    },
    {
      title: 'Attendance',
      subtitle: 'View attendance and overrides',
      path: '/admin/attendance',
    },
    {
      title: 'Holidays',
      subtitle: 'Manage company holidays',
      path: '/admin/holidays',
    },
  ]

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.path}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {card.title}
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                mb={2}
              >
                {card.subtitle}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(card.path)}
              >
                Open
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default AdminDashboard