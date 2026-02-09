import { Box, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  sx?: SxProps<Theme>
}

const Container = ({ children, sx }: ContainerProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        mx: 'auto',
        px: {
          xs: 'var(--space-3)',
          sm: 'var(--space-4)',
          md: 'var(--space-6)',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export default Container
