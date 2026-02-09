import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const navigate = useNavigate()

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={2}
    >
      <Box textAlign="center" maxWidth={320} width="100%">
        <Typography variant="h5" fontWeight={600} mb={1}>
          HRMS Login
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Authentication module will be wired in Station 2
        </Typography>

        {/* Temporary bypass button */}
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/')}
        >
          Continue (Placeholder)
        </Button>
      </Box>
    </Box>
  )
}

export default LoginPage
