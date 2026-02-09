import { Modal as MUIModal, Box, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  sx?: SxProps<Theme>
}

const Modal = ({ open, onClose, children, sx }: ModalProps) => {
  return (
    <MUIModal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          p: 'var(--space-4)',
          width: '90%',
          maxWidth: 480,
          ...sx,
        }}
      >
        {children}
      </Box>
    </MUIModal>
  )
}

export default Modal
