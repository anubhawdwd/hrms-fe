// src/components/AdminYearEndRolloverDialog.tsx
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import toast from 'react-hot-toast'
import { leaveApi } from '../api/leave.api'
import type {
  RolloverPreviewResult,
  RunRolloverResponse,
} from '../types/leave.types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type DialogStep = 'CONFIG' | 'PREVIEW' | 'SUCCESS'

export const AdminYearEndRolloverDialog = ({ open, onClose, onSuccess }: Props) => {
  const theme = useTheme()
  const currentYear = new Date().getFullYear()

  const [fromYear, setFromYear] = useState<number>(currentYear)
  const [toYear, setToYear] = useState<number>(currentYear + 1)
  const [step, setStep] = useState<DialogStep>('CONFIG')

  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const [commitLoading, setCommitLoading] = useState<boolean>(false)

  const [previewData, setPreviewData] = useState<RolloverPreviewResult | null>(null)
  const [commitResult, setCommitResult] = useState<RunRolloverResponse | null>(null)

  const [typedConfirmation, setTypedConfirmation] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const isOverwriteConfirmed = typedConfirmation === 'OVERWRITE'
  const isReasonProvided = reason.trim().length > 0

  const resetAll = () => {
    setStep('CONFIG')
    setPreviewLoading(false)
    setCommitLoading(false)
    setPreviewData(null)
    setCommitResult(null)
    setTypedConfirmation('')
    setReason('')
    setSearchQuery('')
  }

  const handleClose = () => {
    if (previewLoading || commitLoading) return
    resetAll()
    onClose()
  }

  /* ─── Step 1 -> 2: Dry Run Preview ─── */
  const handlePreview = async () => {
    if (toYear <= fromYear) {
      toast.error('To Year must be greater than From Year')
      return
    }

    setPreviewLoading(true)
    try {
      const res = await leaveApi.previewRollover({ fromYear, toYear })
      setPreviewData(res)
      setTypedConfirmation('')
      setStep('PREVIEW')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to generate dry-run preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  /* ─── Step 2 -> 3: Commit Rollover ─── */
  const handleCommitRollover = async () => {
    if (!previewData) return

    if (previewData.alreadyRolledOver) {
      if (!isOverwriteConfirmed) {
        toast.error('Please type OVERWRITE in capital letters to confirm')
        return
      }
      if (!isReasonProvided) {
        toast.error('Reason is mandatory when force-overwriting rollover data')
        return
      }
    }

    setCommitLoading(true)
    try {
      const res = await leaveApi.runRollover({
        fromYear,
        toYear,
        forceOverwrite: previewData.alreadyRolledOver ? true : false,
        reason: reason.trim() || undefined,
      })
      setCommitResult(res)
      setStep('SUCCESS')
      toast.success(`Year-End Rollover completed! Updated ${res.processedCount} balances.`)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Rollover failed')
    } finally {
      setCommitLoading(false)
    }
  }

  const filteredItems = (previewData?.items || []).filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.employeeName.toLowerCase().includes(q) ||
      String(item.employeeCode).includes(q) ||
      item.leaveTypeCode.toLowerCase().includes(q) ||
      item.leaveTypeName.toLowerCase().includes(q)
    )
  })

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={step === 'PREVIEW' ? 'md' : 'sm'}
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <AutorenewIcon color="primary" sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Year-End Leave Rollover (LEV-12)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step === 'CONFIG' && 'Configure target year and run an advance dry-run preview'}
            {step === 'PREVIEW' && `Dry-Run Preview: ${fromYear} → ${toYear} (Zero database mutations)`}
            {step === 'SUCCESS' && 'Rollover Execution Completed Successfully'}
          </Typography>
        </Box>
        {step === 'PREVIEW' && (
          <Chip
            label="Dry Run"
            size="small"
            color="info"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: '20px !important', pb: 2.5 }}>
        {/* ============================================================== */}
        {/* STEP 1: CONFIGURATION & DRY RUN TRIGGER                       */}
        {/* ============================================================== */}
        {step === 'CONFIG' && (
          <Stack spacing={2.5}>
            <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                How Year-End Rollover Works:
              </Typography>
              <Typography variant="caption" display="block">
                • <strong>Company Policies:</strong> Reads current company leave policies for yearly quota allocations, carry-forward allowance, and caps.
              </Typography>
              <Typography variant="caption" display="block">
                • <strong>Calculation Formula:</strong> {toYear} Remaining = Policy Quota + Carried Forward − {toYear} Used.
              </Typography>
              <Typography variant="caption" display="block">
                • <strong>Safe & Atomic:</strong> Preview computes all projected values without modifying the database.
              </Typography>
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="From Year (Closing)"
                type="number"
                size="small"
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                disabled={previewLoading}
                helperText="Source year for remaining balances"
              />
              <TextField
                label="To Year (Target)"
                type="number"
                size="small"
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
                disabled={previewLoading}
                helperText="Target year for new allocations & rollover"
              />
            </Box>
          </Stack>
        )}

        {/* ============================================================== */}
        {/* STEP 2: DRY RUN PREVIEW & CONFIRMATION                        */}
        {/* ============================================================== */}
        {step === 'PREVIEW' && previewData && (
          <Stack spacing={2.5}>
            {/* Summary Metrics */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 1.5,
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Active Employees
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {previewData.totalEmployees}
                </Typography>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.04),
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Eligible Balances
                </Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {previewData.eligibleBalancesCount}
                </Typography>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.04),
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Total Carried Forward
                </Typography>
                <Typography variant="h6" fontWeight={700} color="info.main">
                  {previewData.totalCarriedForwardDays} days
                </Typography>
              </Paper>
            </Box>

            {/* Idempotency / Already Rolled Over Warning */}
            {previewData.alreadyRolledOver && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  ⚠️ Rollover Has Already Been Run for {toYear} (Company Admin Only)
                </Typography>
                <Typography variant="body2" sx={{ my: 0.5 }}>
                  Found <strong>{previewData.alreadyRolledOverCount}</strong> leave balance(s) in {toYear} that already have carried-forward values. Overwriting is irreversible and requires explicit confirmation.
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  <TextField
                    label="Type OVERWRITE to confirm"
                    size="small"
                    fullWidth
                    value={typedConfirmation}
                    onChange={(e) => setTypedConfirmation(e.target.value)}
                    placeholder="OVERWRITE"
                    error={typedConfirmation.length > 0 && typedConfirmation !== "OVERWRITE"}
                    helperText={
                      typedConfirmation === "OVERWRITE"
                        ? "✓ Overwrite confirmed"
                        : "Type OVERWRITE in uppercase to enable the action button"
                    }
                    FormHelperTextProps={{
                      sx: { color: typedConfirmation === "OVERWRITE" ? "success.main" : "error.main", fontWeight: 600 },
                    }}
                    sx={{ bgcolor: "background.paper", borderRadius: 1 }}
                  />
                </Box>
              </Alert>
            )}

            {/* Search Filter & Table */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Itemized Employee Breakdown ({filteredItems.length} records)
                </Typography>
                <TextField
                  placeholder="Filter by employee / type..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 260 }}
                />
              </Box>

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ maxHeight: 300, borderRadius: 2 }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                        {fromYear} Left
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                        Carried Over
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                        Policy Quota
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                        {toYear} Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No matching preview records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item, idx) => (
                        <TableRow key={`${item.employeeId}-${item.leaveTypeId}-${idx}`} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.employeeName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              #{item.employeeCode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.leaveTypeCode}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {item.fromYearRemaining}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color={item.carryForwardDays > 0 ? 'success.main' : 'text.secondary'}>
                              +{item.carryForwardDays}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {item.policyAllocated}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              {item.toYearProjectedRemaining}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Reason / Notes (Mandatory if already rolled over) */}
            <TextField
              label={
                previewData.alreadyRolledOver
                  ? "Rollover Reason / Notes (Mandatory for Overwrite) *"
                  : "Rollover Reason / Notes (Recorded in Audit Log)"
              }
              placeholder={
                previewData.alreadyRolledOver
                  ? "e.g. Corrected 2027 policy allocations requiring fresh rollover"
                  : "e.g. Annual Year-End Leave Rollover"
              }
              size="small"
              fullWidth
              required={previewData.alreadyRolledOver}
              error={previewData.alreadyRolledOver && reason.length > 0 && !isReasonProvided}
              helperText={
                previewData.alreadyRolledOver
                  ? "A justification note is mandatory when force-overwriting rollover data"
                  : "Optional description stored in the permanent audit trail"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={commitLoading}
            />
          </Stack>
        )}

        {/* ============================================================== */}
        {/* STEP 3: SUCCESS CONFIRMATION                                  */}
        {/* ============================================================== */}
        {step === 'SUCCESS' && commitResult && (
          <Stack spacing={2.5}>
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Year-End Rollover Successfully Executed!
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                • <strong>{commitResult.processedCount}</strong> leave balances updated for <strong>{commitResult.toYear}</strong>.
              </Typography>
              <Typography variant="body2">
                • <strong>{commitResult.totalCarriedForwardDays}</strong> total days carried forward across {commitResult.totalEmployees} employees.
              </Typography>
              <Typography variant="body2">
                • Audit log entry recorded with permanent verification snapshot.
              </Typography>
            </Alert>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === 'CONFIG' && (
          <>
            <Button onClick={handleClose} disabled={previewLoading} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePreview}
              disabled={previewLoading || toYear <= fromYear}
              startIcon={previewLoading ? <CircularProgress size={18} color="inherit" /> : <AutorenewIcon />}
              sx={{ fontWeight: 600 }}
            >
              {previewLoading ? 'Generating Preview...' : `Preview Rollover (${fromYear} → ${toYear})`}
            </Button>
          </>
        )}

        {step === 'PREVIEW' && (
          <>
            <Button
              onClick={() => setStep('CONFIG')}
              disabled={commitLoading}
              startIcon={<ArrowBackIcon />}
              color="inherit"
            >
              Back to Config
            </Button>
            <Button
              variant="contained"
              color={previewData?.alreadyRolledOver ? 'error' : 'primary'}
              onClick={handleCommitRollover}
              disabled={
                commitLoading ||
                (Boolean(previewData?.alreadyRolledOver) && (!isOverwriteConfirmed || !isReasonProvided))
              }
              startIcon={commitLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
              sx={{ fontWeight: 600 }}
            >
              {commitLoading
                ? 'Executing Rollover...'
                : previewData?.alreadyRolledOver
                ? 'Confirm & Overwrite Rollover'
                : 'Confirm & Execute Rollover'}
            </Button>
          </>
        )}

        {step === 'SUCCESS' && (
          <Button variant="contained" color="primary" onClick={handleClose} sx={{ fontWeight: 600 }}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
