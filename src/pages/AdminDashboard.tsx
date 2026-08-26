// src/pages/AdminDashboard.tsx
import { Box, Typography, Paper, Grid, Button } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CelebrationIcon from '@mui/icons-material/Celebration'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const AdminDashboard = () => {
  const navigate = useNavigate()

  const cards = [
    {
      title: 'Employees',
      subtitle: 'View, search, and manage employee directory, roles, and hierarchy',
      path: '/admin/employees',
      icon: <PeopleIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Attendance Administration',
      subtitle: 'Review violations, manual day overrides, and event punch logs',
      path: '/admin/attendance',
      icon: <HowToRegIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Leave Approvals',
      subtitle: 'Approve or reject employee leave applications and audit status',
      path: '/admin/leave-approvals',
      icon: <EventAvailableIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Geo-Fencing Settings',
      subtitle: 'Configure office coordinates and toggle perimeter checks',
      path: '/admin/geo-settings',
      icon: <LocationOnIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Holidays',
      subtitle: 'Manage company annual holiday calendar and non-working days',
      path: '/admin/holidays',
      icon: <CelebrationIcon color="primary" sx={{ fontSize: 36 }} />,
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Operational overview and management modules for HR and Company Administrators"
      />

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
                transition: 'all 0.2s ease',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              <Box>
                <Box sx={{ mb: 2 }}>{card.icon}</Box>
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
                endIcon={<ArrowForwardIcon />}
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
