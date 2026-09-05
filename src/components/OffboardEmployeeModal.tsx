// src/components/OffboardEmployeeModal.tsx
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import toast from 'react-hot-toast'
import { employeeApi } from '../api/employee.api'

interface OffboardEmployeeModalProps {
  open: boolean
  onClose: () => void
  employee: {
    id: string
    displayName: string
    employeeCode: number
  } | null
  onSuccess: () => void
}

export const OffboardEmployeeModal = ({
  open,
  onClose,
  employee,
  onSuccess,
}: OffboardEmployeeModalProps) => {
  const [effectiveDate, setEffectiveDate] = useState(
    dayjs().format('YYYY-MM-DD')
  )
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!employee) return null

  const handleConfirmOffboard = async () => {
    setLoading(true)
    try {
      await employeeApi.offboard(employee.id, {
        effectiveDate,
        reason: reason.trim() || undefined,
      })
      toast.success(
        `${employee.displayName} (#${employee.employeeCode}) offboarded successfully`
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to offboard employee'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2.5 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <PersonOffIcon color="error" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Deactivate & Offboard Employee
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {employee.displayName} • Employee Code: #{employee.employeeCode}
          </Typography>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2.5 }}>
        <Stack spacing={2.5}>
          <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Immediate Soft Offboarding Actions:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.8125rem' }}>
              <li>Employee and associated user account will be deactivated immediately.</li>
              <li>Login access and active sessions will be revoked.</li>
              <li>Any open attendance session for today will be closed at the current time.</li>
              <li>Pending leave requests will be auto-rejected; future approved leaves will be auto-cancelled.</li>
              <li>All historical attendance, leave, and organization records are safely preserved.</li>
            </Box>
          </Alert>

          <DatePicker
            label="Effective Offboarding Date"
            value={effectiveDate ? dayjs(effectiveDate) : null}
            onChange={(newValue) => setEffectiveDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
            disabled={loading}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                size: 'small',
                helperText: 'Record-keeping date (deactivation takes effect immediately)',
              },
            }}
          />

          <TextField
            label="Offboarding Reason / Notes (Optional)"
            placeholder="e.g. Resignation, Contract Completion, Mutual Separation"
            fullWidth
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirmOffboard}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : <PersonOffIcon />
          }
          sx={{ fontWeight: 600 }}
        >
          {loading ? 'Offboarding...' : 'Confirm Offboard'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
