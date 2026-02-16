// src/components/ErrorState.tsx
import { Box, Typography, Button } from '@mui/material'

interface Props {
  message: string
  onRetry?: () => void
}

const ErrorState = ({ message, onRetry }: Props) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Typography variant="h6" color="error" gutterBottom>
      Something went wrong
    </Typography>
    <Typography color="text.secondary" gutterBottom>
      {message}
    </Typography>
    {onRetry && (
      <Button variant="outlined" onClick={onRetry} sx={{ mt: 2 }}>
        Retry
      </Button>
    )}
  </Box>
)

export default ErrorState