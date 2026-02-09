import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={2}
    >
      <Box textAlign="center">
        <Typography variant="h4" fontWeight={600}>
          404
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Page not found
        </Typography>

        <Button variant="outlined" onClick={() => navigate('/')}>
          Go Home
        </Button>
      </Box>
    </Box>
  )
}

export default NotFound
