// src/pages/AdminDashboard.tsx
import { Box, Typography, Paper, Grid, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const navigate = useNavigate()

  const cards = [
    {
      title: 'Employees',
      subtitle: 'View and manage employee profiles and hierarchy',
      path: '/admin/employees',
    },
    {
      title: 'Attendance Administration',
      subtitle: 'Review violations, manual day overrides, and event punch logs',
      path: '/admin/attendance',
    },
    {
      title: 'Leave Approvals',
      subtitle: 'Approve or reject employee leave applications',
      path: '/admin/leave-approvals',
    },
    {
      title: 'Geo-Fencing Settings',
      subtitle: 'Configure office premises coordinates and toggle perimeter checks',
      path: '/admin/organization/geo-settings',
    },
    {
      title: 'Holidays',
      subtitle: 'Manage company annual holiday calendar',
      path: '/admin/holidays',
    },
  ]

  return (
    <Box>
      <Typography variant="h5" mb={3} fontWeight={700}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.path}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 2,
              }}
            >
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {card.title}
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  mb={2}
                >
                  {card.subtitle}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(card.path)}
                sx={{ alignSelf: 'flex-start' }}
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
