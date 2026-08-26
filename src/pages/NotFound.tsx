// src/pages/NotFound.tsx
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useAuth'
import { getDashboardRoute } from '../utils/dashboard'

const NotFound = () => {
  const navigate = useNavigate()
  const user = useUser()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography variant="h2" fontWeight={800} color="primary.main" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Page Not Found
      </Typography>
      <Typography color="text.secondary" mb={4} maxWidth={400}>
        The page you are looking for does not exist or you may not have sufficient permissions to view it.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate(getDashboardRoute(user?.role))}
        size="large"
      >
        Back to Application Home
      </Button>
    </Box>
  )
}

export default NotFound
