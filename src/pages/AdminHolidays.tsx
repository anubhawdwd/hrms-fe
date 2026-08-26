// src/pages/AdminHolidays.tsx
import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { useHolidays } from '../hooks/useLeave'
import { leaveApi } from '../api/leave.api'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'

const AdminHolidays = () => {
  const { holidays, loading, reload } = useHolidays()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !date) {
      toast.error('Name and date required')
      return
    }

    setCreating(true)
    try {
      await leaveApi.createHoliday({ name: name.trim(), date })
      toast.success('Holiday added')
      setName('')
      setDate('')
      reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await leaveApi.deleteHoliday(id)
      toast.success('Holiday removed')
      reload()
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) return <LoadingState />

  return (
    <Box>
      <PageHeader
        title="Company Holidays"
        subtitle="Manage company annual holiday calendar and non-working days"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Holidays' },
        ]}
      />

      {/* Create form */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Add Holiday
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Holiday Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
            startIcon={
              creating ? <CircularProgress size={18} /> : null
            }
          >
            Add Holiday
          </Button>
        </Box>
      </Paper>

      {/* List */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Scheduled Holidays ({holidays.length})
        </Typography>

        {holidays.length === 0 ? (
          <Typography color="text.secondary">
            No holidays configured
          </Typography>
        ) : (
          holidays.map((h) => (
            <Box
              key={h.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {h.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(h.date).format('DD MMMM YYYY (dddd)')}
                </Typography>
              </Box>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(h.id)}
                aria-label="Delete holiday"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  )
}

export default AdminHolidays
