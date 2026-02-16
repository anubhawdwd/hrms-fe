import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material'
import toast from 'react-hot-toast'
import { apiClient } from '../api/client'
import type { Company } from '../types/company.types'
import LoadingState from '../components/LoadingState'

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get<Company[]>('/api/company/')
      setCompanies(data)
    } catch {
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Company name required')
      return
    }

    setCreating(true)
    try {
      await apiClient.post('/api/company/', { name: name.trim() })
      toast.success('Company created')
      setName('')
      loadCompanies()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Failed to create company'
      )
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Super Admin — Companies
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Onboard New Company
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            sx={{ maxWidth: 400 }}
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
            startIcon={
              creating ? <CircularProgress size={18} /> : null
            }
          >
            Create
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          All Companies ({companies.length})
        </Typography>

        {companies.length === 0 ? (
          <Typography color="text.secondary">
            No companies found
          </Typography>
        ) : (
          companies.map((c) => (
            <Box
              key={c.id}
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
                <Typography fontWeight={600}>{c.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Created:{' '}
                  {new Date(c.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Chip
                label={c.isActive ? 'Active' : 'Inactive'}
                color={c.isActive ? 'success' : 'default'}
                size="small"
              />
            </Box>
          ))
        )}
      </Paper>
    </Box>
  )
}

export default SuperAdminDashboard