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
import GroupIcon from "@mui/icons-material/Group"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import RefreshIcon from "@mui/icons-material/Refresh"
import BusinessIcon from "@mui/icons-material/Business"
import { companyApi } from "../api/company.api"
import type { Company } from "../types/company.types"
import type { User } from "../types/user.types"

const SuperAdminDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Provisioning Modal State
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [createdSummary, setCreatedSummary] = useState<{
    companyName: string
    adminEmail: string
    tempPassword?: string
  } | null>(null)

  // Reset Primary Admin Password Dialog State
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<{
    userId: string
    email: string
    companyName: string
  } | null>(null)
  const [manualPassword, setManualPassword] = useState("")
  const [resetting, setResetting] = useState(false)
  const [resetResult, setResetResult] = useState<{
    email: string
    tempPassword?: string
  } | null>(null)

  // Company Users Directory Modal State (Module B)
  const [usersDialogOpen, setUsersDialogOpen] = useState(false)
  const [selectedCompanyForUsers, setSelectedCompanyForUsers] = useState<Company | null>(null)
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userResetModalOpen, setUserResetModalOpen] = useState(false)
  const [userToReset, setUserToReset] = useState<User | null>(null)
  const [userResetManualPassword, setUserResetManualPassword] = useState("")
  const [userResetting, setUserResetting] = useState(false)
  const [userResetResult, setUserResetResult] = useState<{ email: string; tempPassword?: string } | null>(null)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await companyApi.list()
      setCompanies(data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load companies")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setActionSuccess("Copied to clipboard!")
    setTimeout(() => setActionSuccess(null), 3000)
  }

  // Create Company Provisioning
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setError("Company Name is required")
      return
    }
    if (adminPassword && adminPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setCreating(true)
      setError(null)
      const res: any = await companyApi.create({
        name: companyName.trim(),
        adminEmail: adminEmail.trim() || undefined,
        adminPassword: adminPassword.trim() || undefined,
      })

      const primaryAdminEmail =
        res.admins?.[0]?.email ||
        res.adminUser?.email ||
        res.adminEmail ||
        adminEmail.trim()

      const generatedPassword =
        res.temporaryPassword ||
        res.adminPassword ||
        res.tempPassword ||
        adminPassword.trim()

      setCreatedSummary({
        companyName: res.name || res.company?.name || companyName,
        adminEmail: primaryAdminEmail,
        tempPassword: generatedPassword,
      })

      setCreateOpen(false)
      setCompanyName("")
      setAdminEmail("")
      setAdminPassword("")
      fetchCompanies()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to provision company")
    } finally {
      setCreating(false)
    }
  }

  // Open Reset Dialog for Primary Admin
  const handleOpenResetDialog = (company: Company) => {
    const admin = company.users?.[0]
    if (!admin) return

    setSelectedAdmin({
      userId: admin.id,
      email: admin.email,
      companyName: company.name,
    })
    setManualPassword("")
    setResetResult(null)
    setResetDialogOpen(true)
  }

  // Perform Reset for Primary Admin
  const handlePerformReset = async () => {
    if (!selectedAdmin) return
    if (manualPassword && manualPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setResetting(true)
      setError(null)
      const res = await companyApi.resetAdminPassword(
        selectedAdmin.userId,
        manualPassword.trim() || undefined
      )
      setResetResult({
        email: selectedAdmin.email,
        tempPassword: res.temporaryPassword,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to reset administrator password")
    } finally {
      setResetting(false)
    }
  }

  // Open Users Directory (Module B)
  const handleOpenUsersDirectory = async (company: Company) => {
    setSelectedCompanyForUsers(company)
    setUsersDialogOpen(true)
    setCompanyUsers([])
    setLoadingUsers(true)
    try {
      const users = await companyApi.getCompanyUsers(company.id)
      setCompanyUsers(users)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load company users")
    } finally {
      setLoadingUsers(false)
    }
  }

  // Reset Password for a Company User (Module B)
  const handleOpenUserReset = (user: User) => {
    setUserToReset(user)
    setUserResetManualPassword("")
    setUserResetResult(null)
    setUserResetModalOpen(true)
  }

  const handlePerformUserReset = async () => {
    if (!selectedCompanyForUsers || !userToReset) return
    if (userResetManualPassword && userResetManualPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setUserResetting(true)
      setError(null)
      const res = await companyApi.resetCompanyUserPassword(
        selectedCompanyForUsers.id,
        userToReset.id,
        userResetManualPassword.trim() || undefined
      )
      setUserResetResult({
        email: userToReset.email,
        tempPassword: res.temporaryPassword,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to reset password for company user")
    } finally {
      setUserResetting(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <BusinessIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Tenant Organizations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provision and manage customer tenant organizations and credentials
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCompanies}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreatedSummary(null)
              setError(null)
              setCreateOpen(true)
            }}
          >
            Provision Company
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

      {/* Main Company Table */}
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
                  <TableCell sx={{ fontWeight: 700 }}>Company Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Primary Admin</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No tenant organizations found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((c) => {
                    const primaryAdmin = c.users?.[0]
                    return (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {c.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            ID: {c.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.isActive ? "Active" : "Inactive"}
                            color={c.isActive ? "success" : "default"}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          {primaryAdmin ? (
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {primaryAdmin.email}
                              </Typography>
                              <Chip
                                label={primaryAdmin.isActive ? "Active" : "Inactive"}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary" fontStyle="italic">
                              No Admin Assigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(c.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="View All Users in Organization">
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<GroupIcon />}
                                onClick={() => handleOpenUsersDirectory(c)}
                              >
                                Users
                              </Button>
                            </Tooltip>
                            {primaryAdmin && (
                              <Tooltip title="Reset Primary Admin Password">
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  size="small"
                                  startIcon={<LockResetIcon />}
                                  onClick={() => handleOpenResetDialog(c)}
                                >
                                  Reset Admin
                                </Button>
                              </Tooltip>
                            )}
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

      {/* Company Provisioning Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCreateCompany}>
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessIcon color="primary" /> Provision Tenant Organization
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Company Name"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corporation"
                fullWidth
                size="small"
              />
              <TextField
                label="Primary Admin Email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@acme.com (leave blank to auto-generate)"
                fullWidth
                size="small"
              />
              <TextField
                label="Primary Admin Password"
                type="text"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Leave blank to auto-generate temporary password"
                helperText="Minimum 6 characters if specified manually"
                fullWidth
                size="small"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)} color="inherit" disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? <CircularProgress size={20} /> : "Provision Company"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Onboarding Success Dialog */}
      <Dialog
        open={Boolean(createdSummary)}
        onClose={() => setCreatedSummary(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "success.main" }}>
          <CheckCircleOutlineIcon /> Company Successfully Provisioned
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            The tenant workspace and primary administrator have been created. Please share these initial login credentials with the company administrator:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Company Name
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {createdSummary?.companyName}
              </Typography>
            </Box>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Admin Email
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {createdSummary?.adminEmail}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Temporary / Initial Password
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <TextField
                  value={createdSummary?.tempPassword || ""}
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(createdSummary?.tempPassword || "")}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatedSummary(null)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Admin Password Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockResetIcon color="primary" /> Reset Company Admin Password
        </DialogTitle>
        <DialogContent dividers>
          {!resetResult ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Typography variant="body2">
                Reset password for administrator{" "}
                <strong>{selectedAdmin?.email}</strong> ({selectedAdmin?.companyName}).
              </Typography>
              <TextField
                label="Custom New Password"
                type="text"
                placeholder="Leave blank to auto-generate temporary password"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                size="small"
                helperText="Minimum 6 characters if specified manually"
                fullWidth
              />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity="success">
                Password successfully updated for {resetResult.email}!
              </Alert>
              <Typography variant="caption" color="text.secondary">
                Temporary Password:
              </Typography>
              <TextField
                value={resetResult.tempPassword || ""}
                size="small"
                fullWidth
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(resetResult.tempPassword || "")}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!resetResult ? (
            <>
              <Button onClick={() => setResetDialogOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={handlePerformReset}
                variant="contained"
                color="secondary"
                disabled={resetting}
                startIcon={resetting ? <CircularProgress size={16} /> : <LockResetIcon />}
              >
                {resetting ? "Resetting..." : "Confirm Reset"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setResetDialogOpen(false)} variant="contained">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Module B: Company Users Directory Dialog */}
      <Dialog
        open={usersDialogOpen}
        onClose={() => setUsersDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GroupIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              {selectedCompanyForUsers?.name} — User Directory
            </Typography>
          </Box>
          <Chip
            label={`Total: ${companyUsers.length} Users`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {loadingUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companyUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No users registered for this organization.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    companyUsers.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {u.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.role}
                            size="small"
                            color={u.role === "COMPANY_ADMIN" ? "primary" : u.role === "HR" ? "secondary" : "default"}
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.isActive ? "Active" : "Inactive"}
                            size="small"
                            color={u.isActive ? "success" : "default"}
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            startIcon={<LockResetIcon />}
                            onClick={() => handleOpenUserReset(u)}
                          >
                            Reset Password
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsersDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Module B: Reset Password for Specific Company User Dialog */}
      <Dialog
        open={userResetModalOpen}
        onClose={() => !userResetting && setUserResetModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockResetIcon color="primary" /> Reset User Password
        </DialogTitle>
        <DialogContent dividers>
          {!userResetResult ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Typography variant="body2">
                Reset password for user <strong>{userToReset?.email}</strong> in organization <strong>{selectedCompanyForUsers?.name}</strong>.
              </Typography>
              <TextField
                label="Custom New Password (Optional)"
                type="text"
                placeholder="Leave blank to auto-generate temporary password"
                value={userResetManualPassword}
                onChange={(e) => setUserResetManualPassword(e.target.value)}
                size="small"
                helperText="Minimum 6 characters if specified manually"
                fullWidth
              />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity="success">
                Password successfully updated for {userResetResult.email}!
              </Alert>
              <Typography variant="caption" color="text.secondary">
                Temporary Password:
              </Typography>
              <TextField
                value={userResetResult.tempPassword || ""}
                size="small"
                fullWidth
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(userResetResult.tempPassword || "")}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!userResetResult ? (
            <>
              <Button onClick={() => setUserResetModalOpen(false)} color="inherit" disabled={userResetting}>
                Cancel
              </Button>
              <Button
                onClick={handlePerformUserReset}
                variant="contained"
                color="secondary"
                disabled={userResetting}
                startIcon={userResetting ? <CircularProgress size={16} /> : <LockResetIcon />}
              >
                {userResetting ? "Resetting..." : "Confirm Reset"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setUserResetModalOpen(false)} variant="contained">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SuperAdminDashboard
