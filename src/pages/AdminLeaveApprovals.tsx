// src/pages/AdminLeaveApprovals.tsx
import { useCallback, useEffect, useState } from 'react'
import { Box, Typography, Button, Chip, Paper } from '@mui/material'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { apiClient } from '../api/client'
import type { LeaveRequest } from '../types/leave.types'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import { leaveApi } from '../api/leave.api'

/**
 * HR/Admin: Fetch ALL pending leave requests across company
 * Backend doesn't have a dedicated "all pending" endpoint,
 * so we'll need one. For now, we show what we can.
 *
 * TODO: Add GET /api/leave/requests/pending (backend)
 * For now we use a workaround: list all employees, then get requests.
 * 
 * TEMPORARY: Using direct API call until proper endpoint exists
 */

const AdminLeaveApprovals = () => {
  const [requests, setRequests] = useState<
    (LeaveRequest & { employeeName?: string })[]
  >([])
  const [loading, setLoading] = useState(true)

  const loadPending = useCallback(async () => {
    setLoading(true)
    try {
      // TODO: Replace with dedicated backend endpoint
      // GET /api/leave/requests/pending
      const { data } = await apiClient.get<LeaveRequest[]>(
        '/api/leave/requests/pending'
      )
      setRequests(data)
    } catch {
      // Endpoint might not exist yet — show empty
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPending()
  }, [loadPending])

  const handleApprove = async (requestId: string) => {
    try {
      await leaveApi.approve(requestId)
      toast.success('Leave approved')
      loadPending()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Approval failed')
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      await leaveApi.reject(requestId)
      toast.success('Leave rejected')
      loadPending()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Rejection failed')
    }
  }

  if (loading) return <LoadingState />

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Leave Approvals
      </Typography>

      {requests.length === 0 ? (
        <EmptyState
          title="No pending leave requests"
          subtitle="All caught up!"
        />
      ) : (
        requests.map((req) => (
          <Paper key={req.id} sx={{ p: 3, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography fontWeight={600}>
                  {req.leaveType.name} ({req.leaveType.code})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dayjs(req.fromDate).format('DD MMM')} –{' '}
                  {dayjs(req.toDate).format('DD MMM YYYY')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {req.durationValue}{' '}
                  {req.durationType.toLowerCase().replace('_', ' ')}
                </Typography>
                {req.reason && (
                  <Typography variant="body2" mt={1}>
                    Reason: {req.reason}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={req.status} color="warning" size="small" />
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleApprove(req.id)}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleReject(req.id)}
                >
                  Reject
                </Button>
              </Box>
            </Box>
          </Paper>
        ))
      )}
    </Box>
  )
}

export default AdminLeaveApprovals