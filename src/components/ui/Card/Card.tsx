import { Box, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'

interface CardProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  sx?: SxProps<Theme>
  className?: string
}

const Card = ({ header, footer, children, sx, className }: CardProps) => {
  return (
    <Box
      className={className}
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        ...sx,
      }}
    >
      {header && <Box>{header}</Box>}
      <Box>{children}</Box>
      {footer && <Box>{footer}</Box>}
    </Box>
  )
}

export default Card
