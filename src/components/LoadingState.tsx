// src/components/LoadingState.tsx
import { Box, CircularProgress, Typography } from '@mui/material'

interface Props {
  message?: string
}

const LoadingState = ({ message = 'Loading...' }: Props) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      gap: 2,
    }}
  >
    <CircularProgress />
    <Typography color="text.secondary">{message}</Typography>
  </Box>
)

export default LoadingState