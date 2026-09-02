// src/components/ReactivateEmployeeDialog.tsx
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import RestoreIcon from '@mui/icons-material/Restore'
import toast from 'react-hot-toast'
import { employeeApi } from '../api/employee.api'

interface ReactivateEmployeeDialogProps {
  open: boolean
  onClose: () => void
  employee: {
    id: string
    displayName: string
    employeeCode: number
  } | null
  onSuccess: () => void
}

export const ReactivateEmployeeDialog = ({
  open,
  onClose,
  employee,
  onSuccess,
}: ReactivateEmployeeDialogProps) => {
  const [loading, setLoading] = useState(false)

  if (!employee) return null

  const handleReactivate = async () => {
    setLoading(true)
    try {
      await employeeApi.reactivate(employee.id)
      toast.success(
        `${employee.displayName} (#${employee.employeeCode}) reactivated successfully`
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to reactivate employee'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2.5 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <RestoreIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Reactivate Employee
          </Typography>
          <Typography variant="body2" color="text.secondary">
            #{employee.employeeCode} • {employee.displayName}
          </Typography>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2.5 }}>
        <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
          Reactivating this employee will restore both the employee profile and user login account to Active status.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          All previous attendance records, leave history, and profile data will remain fully intact.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleReactivate}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : <RestoreIcon />
          }
          sx={{ fontWeight: 600 }}
        >
          {loading ? 'Reactivating...' : 'Reactivate'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
