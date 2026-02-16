// src/components/EmptyState.tsx
import { Box, Typography } from '@mui/material'

interface Props {
  title: string
  subtitle?: string
}

const EmptyState = ({ title, subtitle }: Props) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    {subtitle && (
      <Typography color="text.secondary">{subtitle}</Typography>
    )}
  </Box>
)

export default EmptyState