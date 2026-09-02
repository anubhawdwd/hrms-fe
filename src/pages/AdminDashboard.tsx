import SummarizeIcon from '@mui/icons-material/Summarize'
// src/pages/AdminDashboard.tsx
import { Box, Typography, Paper, Grid, Button } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import BeachAccessIcon from '@mui/icons-material/BeachAccess'
import BusinessIcon from '@mui/icons-material/Business'
import CorporateFareIcon from '@mui/icons-material/CorporateFare'
import CelebrationIcon from '@mui/icons-material/Celebration'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const AdminDashboard = () => {
  const navigate = useNavigate()

  const cards = [
    {
      title: 'User Accounts',
      subtitle: 'View company user accounts, system roles, authentication methods, and security flags',
      path: '/admin/users',
      icon: <ManageAccountsIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Employees',
      subtitle: 'View, search, and manage employee directory, roles, and hierarchy',
      path: '/admin/employees',
      icon: <PeopleIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Attendance Dashboard',
      subtitle: 'Monthly employee attendance overview, presence matrix, and daily statistics',
      path: '/admin/attendance-dashboard',
      icon: <HowToRegIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Attendance Administration',
      subtitle: 'Manual attendance corrections, punch event management, and geo-fence violations',
      path: '/admin/attendance',
      icon: <CalendarMonthIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Leave Dashboard',
      subtitle: 'Overview of employees on leave today, pending approvals, and recently approved leaves',
      path: '/admin/leave-dashboard',
      icon: <BeachAccessIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Organization Management',
      subtitle: 'Manage departments, teams, designations, and designation-level attendance policies',
      path: '/admin/organization',
      icon: <CorporateFareIcon color="primary" sx={{ fontSize: 36 }} />,
    },
    {
      title: 'Workplace Settings',
      subtitle: 'Configure working hours, lunch/break schedules, grace period, and office geo-fencing',
      path: '/admin/workplace-settings',
      icon: <BusinessIcon color="primary" sx={{ fontSize: 36 }} />,
    },
        {
      title: 'Reports Dashboard',
      subtitle: 'Generate, preview, and export company-scoped employee directories and dynamic leave reports',
      path: '/admin/reports',
      icon: <SummarizeIcon color="primary" sx={{ fontSize: 36 }} />,
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
