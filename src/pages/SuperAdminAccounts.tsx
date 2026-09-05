import React, { useEffect, useState } from "react"
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import LockResetIcon from "@mui/icons-material/LockReset"
import BlockIcon from "@mui/icons-material/Block"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import RefreshIcon from "@mui/icons-material/Refresh"
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { superadminApi } from "../api/superadmin.api"
import { clearAuth } from "../store/auth.slice"
import { useUser } from "../hooks/useAuth"
import type { SuperAdminUser } from "../types/superadmin.types"

const SuperAdminAccounts: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useUser()

  const [admins, setAdmins] = useState<SuperAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createEmail, setCreateEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [creating, setCreating] = useState(false)
  const [createdResult, setCreatedResult] = useState<{ email: string; tempPassword?: string } | null>(null)

  // Reset Password Modal
  const [resetOpen, setResetOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdminUser | null>(null)
  const [resetPassword, setResetPassword] = useState("")
  const [resetting, setResetting] = useState(false)
  const [resetResult, setResetResult] = useState<{ email: string; tempPassword?: string } | null>(null)

  // Deactivate Modal
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [adminToDeactivate, setAdminToDeactivate] = useState<SuperAdminUser | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await superadminApi.list()
      setAdmins(data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load SuperAdmin accounts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setActionSuccess("Copied to clipboard!")
    setTimeout(() => setActionSuccess(null), 3000)
  }

  // Create SuperAdmin
  const handleCreate = async () => {
    if (!createEmail.trim()) {
      setError("Email address is required")
      return
    }
    if (createPassword && createPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setCreating(true)
      setError(null)
      const res = await superadminApi.create({
        email: createEmail.trim(),
        password: createPassword.trim() || undefined,
      })
      setCreatedResult({
        email: res.user.email,
        tempPassword: res.temporaryPassword,
      })
      fetchAdmins()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create SuperAdmin")
    } finally {
      setCreating(false)
    }
  }

  // Reset Password
  const handleResetPassword = async () => {
    if (!selectedAdmin) return
    if (resetPassword && resetPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setResetting(true)
      setError(null)
      const res = await superadminApi.resetPassword(selectedAdmin.id, resetPassword.trim() || undefined)
      setResetResult({
        email: selectedAdmin.email,
        tempPassword: res.temporaryPassword,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to reset password")
    } finally {
      setResetting(false)
    }
  }

  // Deactivate SuperAdmin
  const handleDeactivate = async () => {
    if (!adminToDeactivate) return

    try {
      setDeactivating(true)
      setError(null)
      await superadminApi.deactivate(adminToDeactivate.id)

      // Amendment 4: Detect self-deactivation and redirect to login cleanly
      if (currentUser?.id === adminToDeactivate.id) {
        dispatch(clearAuth())
        navigate("/", { replace: true })
        return
      }

      setDeactivateOpen(false)
      const email = adminToDeactivate.email
      setAdminToDeactivate(null)
      setActionSuccess("SuperAdmin " + email + " has been deactivated")
      setTimeout(() => setActionSuccess(null), 4000)
      fetchAdmins()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to deactivate SuperAdmin")
      setDeactivateOpen(false)
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              SuperAdmin Accounts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage platform-level SuperAdmin credentials and permissions
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAdmins}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateEmail("")
              setCreatePassword("")
              setCreatedResult(null)
              setError(null)
              setCreateOpen(true)
            }}
          >
            Add SuperAdmin
          </Button>
        </Stack>
      </Box>

      {/* Alerts */}
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "grey.50" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created At</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No SuperAdmin accounts found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((adm) => {
                    const isSelf = currentUser?.id === adm.id
                    return (
                      <TableRow key={adm.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {adm.email}
                          </Typography>
                          {isSelf && (
                            <Chip
                              label="You"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ fontSize: "0.7rem", height: 18, mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={adm.role}
                            size="small"
                            color="secondary"
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={adm.isActive ? "Active" : "Deactivated"}
                            size="small"
                            color={adm.isActive ? "success" : "default"}
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(adm.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Reset Password">
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<LockResetIcon />}
                                onClick={() => {
                                  setSelectedAdmin(adm)
                                  setResetPassword("")
                                  setResetResult(null)
                                  setError(null)
                                  setResetOpen(true)
                                }}
                              >
                                Reset
                              </Button>
                            </Tooltip>
                            <Tooltip title={isSelf ? "Deactivating your own account will log you out" : "Deactivate SuperAdmin"}>
                              <span>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<BlockIcon />}
                                  disabled={!adm.isActive}
                                  onClick={() => {
                                    setAdminToDeactivate(adm)
                                    setDeactivateOpen(true)
                                  }}
                                >
                                  Deactivate
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create SuperAdmin Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AdminPanelSettingsIcon color="primary" /> Add New SuperAdmin
        </DialogTitle>
        <DialogContent dividers>
          {!createdResult ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Email Address"
                type="email"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="superadmin@example.com"
                fullWidth
                size="small"
              />
              <TextField
                label="Initial Password (Optional)"
                type="text"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Leave empty to auto-generate temporary password"
                helperText="Minimum 6 characters if provided manually"
                fullWidth
                size="small"
              />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
                SuperAdmin account created successfully!
              </Alert>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
                  {createdResult.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">Temporary Password</Typography>
                <TextField
                  value={createdResult.tempPassword || ""}
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleCopy(createdResult.tempPassword || "")}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!createdResult ? (
            <>
              <Button onClick={() => setCreateOpen(false)} color="inherit" disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} variant="contained" disabled={creating}>
                {creating ? <CircularProgress size={20} /> : "Create Account"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setCreateOpen(false)} variant="contained">
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetOpen}
        onClose={() => !resetting && setResetOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockResetIcon color="primary" /> Reset SuperAdmin Password
        </DialogTitle>
        <DialogContent dividers>
          {!resetResult ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Typography variant="body2">
                Reset password for SuperAdmin <strong>{selectedAdmin?.email}</strong>.
              </Typography>
              <TextField
                label="Custom New Password (Optional)"
                type="text"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Leave empty to auto-generate temporary password"
                helperText="Minimum 6 characters if provided manually"
                fullWidth
                size="small"
              />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
                Password reset successfully for {resetResult.email}!
              </Alert>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="caption" color="text.secondary">New Temporary Password</Typography>
                <TextField
                  value={resetResult.tempPassword || ""}
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleCopy(resetResult.tempPassword || "")}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!resetResult ? (
            <>
              <Button onClick={() => setResetOpen(false)} color="inherit" disabled={resetting}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} variant="contained" color="secondary" disabled={resetting}>
                {resetting ? <CircularProgress size={20} /> : "Confirm Reset"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setResetOpen(false)} variant="contained">
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={deactivateOpen}
        onClose={() => !deactivating && setDeactivateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main", display: "flex", alignItems: "center", gap: 1 }}>
          <BlockIcon /> Deactivate SuperAdmin
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to deactivate SuperAdmin account <strong>{adminToDeactivate?.email}</strong>?
          </Typography>
          {currentUser?.id === adminToDeactivate?.id && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Caution:</strong> You are about to deactivate your own account. You will be logged out immediately upon confirmation.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateOpen(false)} color="inherit" disabled={deactivating}>
            Cancel
          </Button>
          <Button onClick={handleDeactivate} variant="contained" color="error" disabled={deactivating}>
            {deactivating ? <CircularProgress size={20} /> : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SuperAdminAccounts
