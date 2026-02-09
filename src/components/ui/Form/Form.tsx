import { Box, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'

interface FormProps {
  children: ReactNode
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  sx?: SxProps<Theme>
}

const Form = ({ children, onSubmit, sx }: FormProps) => {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export default Form
