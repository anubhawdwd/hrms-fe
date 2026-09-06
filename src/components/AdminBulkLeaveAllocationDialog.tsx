// src/components/AdminBulkLeaveAllocationDialog.tsx
import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Chip,
} from '@mui/material'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import toast from 'react-hot-toast'
import { leaveApi } from '../api/leave.api'
import { employeeApi } from '../api/employee.api'
import type { LeaveType, BulkAllocateResult } from '../types/leave.types'
import type { EmployeeListItem } from '../types/employee.types'

interface Props {
  open: boolean
  onClose: () => void
  leaveTypes: LeaveType[]
  initialYear?: number
  onSuccess?: () => void
}

export const AdminBulkLeaveAllocationDialog = ({
  open,
  onClose,
  leaveTypes,
  initialYear,
  onSuccess,
}: Props) => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(initialYear || currentYear)
  const [leaveTypeId, setLeaveTypeId] = useState<string>('')
  const [allocated, setAllocated] = useState<number | string>(12)
  const [scope, setScope] = useState<'ALL_ACTIVE' | 'BY_EMPLOYMENT_TYPE' | 'SPECIFIC_EMPLOYEES'>('ALL_ACTIVE')
  const [employmentType, setEmploymentType] = useState<'PERMANENT' | 'PROBATION'>('PERMANENT')
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeListItem[]>([])
  const [allEmployees, setAllEmployees] = useState<EmployeeListItem[]>([])
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false)
  const [reason, setReason] = useState<string>('')

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [result, setResult] = useState<BulkAllocateResult | null>(null)

  useEffect(() => {
    if (open) {
      setYear(initialYear || currentYear)
      if (leaveTypes.length > 0 && !leaveTypeId) {
        setLeaveTypeId(leaveTypes[0].id)
      }
      setResult(null)
      loadEmployees()
    }
  }, [open, initialYear, leaveTypes])

  const loadEmployees = async () => {
    setEmployeesLoading(true)
    try {
      const data = await employeeApi.list()
      setAllEmployees(data.filter((e) => e.isActive))
    } catch {
      toast.error('Failed to load employee directory')
    } finally {
      setEmployeesLoading(false)
    }
  }

  // Calculate estimated target count
  const estimatedTargetCount = useMemo(() => {
    if (scope === 'ALL_ACTIVE') return allEmployees.length
    if (scope === 'BY_EMPLOYMENT_TYPE') {
      return allEmployees.filter((e) =>
        employmentType === 'PROBATION' ? e.isProbation : !e.isProbation
      ).length
    }
    return selectedEmployees.length
  }, [scope, employmentType, selectedEmployees, allEmployees])

  const selectedTypeName = leaveTypes.find((t) => t.id === leaveTypeId)?.name || 'Leave'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAlloc = Number(allocated)
    if (isNaN(numAlloc) || numAlloc < 0) {
      toast.error('Please enter a valid allocation (>= 0)')
      return
    }

    if (!leaveTypeId) {
      toast.error('Please select a leave type')
      return
    }

    if (scope === 'SPECIFIC_EMPLOYEES' && selectedEmployees.length === 0) {
      toast.error('Please select at least one employee')
      return
    }

    setSubmitting(true)
    setResult(null)
    try {
      const res = await leaveApi.bulkAllocateBalances({
        leaveTypeId,
        year,
        allocated: numAlloc,
        scope,
        isProbation: scope === 'BY_EMPLOYMENT_TYPE' ? employmentType === 'PROBATION' : undefined,
        employeeIds: scope === 'SPECIFIC_EMPLOYEES' ? selectedEmployees.map((e) => e.id) : undefined,
        reason: reason.trim() || undefined,
      })

      setResult(res)
      toast.success(`Bulk allocated ${numAlloc} days of ${selectedTypeName} to ${res.successCount} employees!`)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Bulk allocation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    setResult(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2.5 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <GroupAddIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Bulk Leave Allocation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Grant or update quota for multiple employees simultaneously
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3, pt: '24px !important', pb: 2.5 }}>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              Existing <strong>carried-forward balances</strong> from year-end rollover will be preserved.
              Remaining balances will be automatically recalculated.
            </Alert>

            {/* Leave Type & Year */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Leave Type"
                size="small"
                required
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                disabled={submitting}
              >
                {leaveTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Target Year"
                size="small"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={submitting}
              >
                {[2025, 2026, 2027, 2028, 2029].map((yr) => (
                  <MenuItem key={yr} value={yr}>
                    {yr}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Allocated Days */}
            <TextField
              label="Total Allocated Days (per employee)"
              type="number"
              size="small"
              required
              inputProps={{ min: 0, step: 0.5 }}
              value={allocated}
              onChange={(e) => setAllocated(e.target.value)}
              disabled={submitting}
              helperText="Sets the annual allocated quota for each targeted employee"
            />

            {/* Scope Selection */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                Target Employee Scope
              </Typography>
              <RadioGroup
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
              >
                <FormControlLabel
                  value="ALL_ACTIVE"
                  control={<Radio size="small" />}
                  label={`All Active Employees (${allEmployees.length} total)`}
                  disabled={submitting}
                />
                <FormControlLabel
                  value="BY_EMPLOYMENT_TYPE"
                  control={<Radio size="small" />}
                  label="Filter by Employment Type (Permanent / Probation)"
                  disabled={submitting}
                />
                <FormControlLabel
                  value="SPECIFIC_EMPLOYEES"
                  control={<Radio size="small" />}
                  label="Select Specific Employees"
                  disabled={submitting}
                />
              </RadioGroup>
            </Box>

            {/* Employment Type Sub-Selector */}
            {scope === 'BY_EMPLOYMENT_TYPE' && (
              <Box sx={{ pl: 4 }}>
                <TextField
                  select
                  size="small"
                  label="Employment Status"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  fullWidth
                  disabled={submitting}
                >
                  <MenuItem value="PERMANENT">
                    Permanent Employees Only ({allEmployees.filter((e) => !e.isProbation).length} matches)
                  </MenuItem>
                  <MenuItem value="PROBATION">
                    Probation Employees Only ({allEmployees.filter((e) => e.isProbation).length} matches)
                  </MenuItem>
                </TextField>
              </Box>
            )}

            {/* Specific Employees Multi-Select */}
            {scope === 'SPECIFIC_EMPLOYEES' && (
              <Box sx={{ pl: 4 }}>
                <Autocomplete
                  multiple
                  options={allEmployees}
                  getOptionLabel={(opt) => `#${opt.employeeCode} - ${opt.displayName}`}
                  value={selectedEmployees}
                  onChange={(_, val) => setSelectedEmployees(val)}
                  disabled={submitting || employeesLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select Employees"
                      placeholder="Search by name or code..."
                    />
                  )}
                  renderTags={(val, getTagProps) =>
                    val.map((opt, idx) => (
                      <Chip
                        {...getTagProps({ index: idx })}
                        key={opt.id}
                        size="small"
                        label={`#${opt.employeeCode} ${opt.displayName}`}
                      />
                    ))
                  }
                />
              </Box>
            )}

            {/* Optional Reason */}
            <TextField
              label="Audit Reason / Notes (Optional)"
              placeholder="e.g. Annual company-wide quota grant / Q1 allocation"
              size="small"
              multiline
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />

            {/* Result Summary */}
            {result && (
              <Box sx={{ mt: 1 }}>
                <Divider sx={{ mb: 2 }} />
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Bulk Allocation Successful!
                  </Typography>
                  <Typography variant="body2">
                    • <strong>{result.successCount}</strong> employees received {allocated} days of {selectedTypeName}.
                  </Typography>
                  {result.skippedCount > 0 && (
                    <Typography variant="body2" color="warning.main">
                      • {result.skippedCount} employees skipped (already used more days than new allocation).
                    </Typography>
                  )}
                  {result.errors.length > 0 && (
                    <Typography variant="body2" color="error">
                      • Encountered {result.errors.length} errors.
                    </Typography>
                  )}
                </Alert>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={submitting} color="inherit">
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || estimatedTargetCount === 0}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <GroupAddIcon />}
              sx={{ fontWeight: 600 }}
            >
              {submitting ? 'Allocating...' : `Allocate to ${estimatedTargetCount} Employee${estimatedTargetCount === 1 ? '' : 's'}`}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}
