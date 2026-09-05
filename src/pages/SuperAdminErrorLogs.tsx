import dayjs from "dayjs"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import React, { useEffect, useState, useCallback } from "react"
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
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Checkbox,
  Tooltip,
} from "@mui/material"
import BugReportIcon from "@mui/icons-material/BugReport"
import RefreshIcon from "@mui/icons-material/Refresh"
import FilterListIcon from "@mui/icons-material/FilterList"
import RestartAltIcon from "@mui/icons-material/RestartAlt"
import DeleteIcon from "@mui/icons-material/Delete"
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep"
import VisibilityIcon from "@mui/icons-material/Visibility"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import { errorLogApi } from "../api/error-log.api"
import { companyApi } from "../api/company.api"
import type { ErrorLogItem } from "../types/error-log.types"
import type { Company } from "../types/company.types"

const SuperAdminErrorLogs: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Company List for Filter
  const [companies, setCompanies] = useState<Company[]>([])

  // Pagination
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(25)

  // Filters State
  const [source, setSource] = useState<"ALL" | "BACKEND" | "FRONTEND">("ALL")
  const [statusCode, setStatusCode] = useState<string>("")
  const [companyId, setCompanyId] = useState<string>("") // "" = All, "SYSTEM" = System / Unauth, or UUID
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  // Selection for Manual Deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Details Modal
  const [selectedLog, setSelectedLog] = useState<ErrorLogItem | null>(null)

  // Confirmation Modals
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const [deleteBulkOpen, setDeleteBulkOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load Companies
  useEffect(() => {
    companyApi
      .list()
      .then((data) => setCompanies(data))
      .catch(() => {
        // non-blocking
      })
  }, [])

  const fetchLogs = useCallback(async (targetPage = page, targetLimit = limit) => {
    try {
      setLoading(true)
      setError(null)
      const res = await errorLogApi.list({
        page: targetPage + 1,
        limit: targetLimit,
        source: source === "ALL" ? undefined : source,
        statusCode: statusCode ? Number(statusCode) : undefined,
        companyId: companyId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
      })

      setLogs(res.items)
      setTotal(res.pagination.total)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load error logs")
    } finally {
      setLoading(false)
    }
  }, [page, limit, source, statusCode, companyId, startDate, endDate, search])

  useEffect(() => {
    fetchLogs(page, limit)
    setSelectedIds([]) // Reset selection on page / filter changes
  }, [page, limit])

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPage(0)
    setSelectedIds([])
    fetchLogs(0, limit)
  }

  const handleResetFilters = () => {
    setSource("ALL")
    setStatusCode("")
    setCompanyId("")
    setStartDate("")
    setEndDate("")
    setSearch("")
    setPage(0)
    setSelectedIds([])

    // Trigger immediate fetch with cleared parameters
    setLoading(true)
    setError(null)
    errorLogApi
      .list({ page: 1, limit })
      .then((res) => {
        setLogs(res.items)
        setTotal(res.pagination.total)
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || err.message || "Failed to load error logs")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setActionSuccess("Copied to clipboard!")
    setTimeout(() => setActionSuccess(null), 3000)
  }

  // Checkbox selection
  const isAllPageSelected = logs.length > 0 && logs.every((l) => selectedIds.includes(l.id))
  const isSomePageSelected = logs.some((l) => selectedIds.includes(l.id)) && !isAllPageSelected

  const handleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(logs.map((l) => l.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
    } else {
      const pageIds = logs.map((l) => l.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleToggleRowSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Delete Selected
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    try {
      setDeleting(true)
      setError(null)
      const res = await errorLogApi.deleteSelected(selectedIds)
      setDeleteSelectedOpen(false)
      setSelectedIds([])
      setActionSuccess(`Successfully deleted ${res.deletedCount} selected error log(s)`)
      setTimeout(() => setActionSuccess(null), 4000)
      fetchLogs(page, limit)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to delete selected error logs")
      setDeleteSelectedOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  // Delete Bulk matching filters
  const handleDeleteBulk = async () => {
    try {
      setDeleting(true)
      setError(null)
      const res = await errorLogApi.deleteBulk({
        source: source === "ALL" ? undefined : source,
        statusCode: statusCode ? Number(statusCode) : undefined,
        companyId: companyId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
      })
      setDeleteBulkOpen(false)
      setSelectedIds([])
      setActionSuccess(`Successfully deleted ${res.deletedCount} error log(s) matching active filter`)
      setTimeout(() => setActionSuccess(null), 4000)
      setPage(0)
      fetchLogs(0, limit)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to bulk delete error logs")
      setDeleteBulkOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusChipColor = (status: number | null) => {
    if (!status) return "default"
    if (status >= 500) return "error"
    if (status >= 400) return "warning"
    return "info"
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <BugReportIcon color="error" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              System Error & Telemetry Logs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Centralized platform error monitoring, inspection, and maintenance
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteSelectedOpen(true)}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setDeleteBulkOpen(true)}
            disabled={total === 0}
          >
            Delete All Filtered ({total})
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchLogs(page, limit)}
            disabled={loading}
          >
            Refresh
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

      {/* Interactive Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <form onSubmit={handleApplyFilters}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1.2fr 1fr 1.5fr 1.2fr 1.2fr 1.8fr auto",
              },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            {/* Source */}
            <TextField
              select
              size="small"
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
            >
              <MenuItem value="ALL">All Sources</MenuItem>
              <MenuItem value="BACKEND">Backend Server</MenuItem>
              <MenuItem value="FRONTEND">Frontend Web App</MenuItem>
            </TextField>

            {/* Status Code */}
            <TextField
              size="small"
              label="Status Code"
              placeholder="500, 404..."
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
            />

            {/* Organization Dropdown */}
            <TextField
              select
              size="small"
              label="Organization"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <MenuItem value="">All Organizations</MenuItem>
              <MenuItem value="SYSTEM">System / Unauthenticated</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>

            {/* From Date */}
            <DatePicker
              label="From Date"
              value={startDate ? dayjs(startDate) : null}
              onChange={(newValue) => setStartDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  size: 'small',
                },
              }}
            />

            {/* To Date */}
            <DatePicker
              label="To Date"
              value={endDate ? dayjs(endDate) : null}
              minDate={startDate ? dayjs(startDate) : undefined}
              onChange={(newValue) => setEndDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  size: 'small',
                },
              }}
            />

            {/* Free Search */}
            <TextField
              size="small"
              label="Search"
              placeholder="Search message, endpoint, stack..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Filter Actions */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                size="medium"
                startIcon={<FilterListIcon />}
              >
                Filter
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="medium"
                startIcon={<RestartAltIcon />}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* Log Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.50" }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={isSomePageSelected}
                        checked={isAllPageSelected}
                        onChange={handleSelectAllPage}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 160 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 100 }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 90 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 160 }}>Organization</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 220 }}>Endpoint / Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: 80 }}>Inspect</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No error logs found matching the selected criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => {
                      const isSelected = selectedIds.includes(log.id)
                      return (
                        <TableRow
                          key={log.id}
                          hover
                          selected={isSelected}
                          onClick={() => setSelectedLog(log)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleRowSelect(log.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.source}
                              size="small"
                              color={log.source === "BACKEND" ? "primary" : "secondary"}
                              sx={{ fontWeight: 600, fontSize: "0.7rem", height: 20 }}
                            />
                          </TableCell>
                          <TableCell>
                            {log.statusCode ? (
                              <Chip
                                label={log.statusCode}
                                size="small"
                                color={getStatusChipColor(log.statusCode)}
                                sx={{ fontWeight: 600, fontSize: "0.7rem", height: 20 }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={log.companyId ? `ID: ${log.companyId}` : "Platform system level"}>
                              <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 150 }}>
                                {log.companyName || "System / Unauthenticated"}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: "monospace" }} noWrap display="block">
                              {log.method ? `[${log.method}] ` : ""}
                              {log.endpoint || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 360,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.message}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => setSelectedLog(log)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => {
                setPage(newPage)
                fetchLogs(newPage, limit)
              }}
              rowsPerPage={limit}
              onRowsPerPageChange={(e) => {
                const newLimit = parseInt(e.target.value, 10)
                setLimit(newLimit)
                setPage(0)
                fetchLogs(0, newLimit)
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Paper>

      {/* Log Details Modal */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BugReportIcon color="error" />
            <Typography variant="h6" fontWeight={700}>
              Error Log Details
            </Typography>
          </Box>
          {selectedLog && (
            <Stack direction="row" spacing={1}>
              <Chip
                label={selectedLog.source}
                size="small"
                color={selectedLog.source === "BACKEND" ? "primary" : "secondary"}
                sx={{ fontWeight: 700 }}
              />
              {selectedLog.statusCode && (
                <Chip
                  label={`HTTP ${selectedLog.statusCode}`}
                  size="small"
                  color={getStatusChipColor(selectedLog.statusCode)}
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {selectedLog && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Message Header */}
              <Alert severity={selectedLog.statusCode && selectedLog.statusCode >= 500 ? "error" : "warning"}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {selectedLog.message}
                </Typography>
              </Alert>

              {/* Context Meta Grid */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(selectedLog.createdAt).toISOString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">HTTP Method & Endpoint</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "monospace" }}>
                      {selectedLog.method || "N/A"} {selectedLog.endpoint || "N/A"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Organization</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedLog.companyName || "System / Unauthenticated"}
                    </Typography>
                    {selectedLog.companyId && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                        ID: {selectedLog.companyId}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">User ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {selectedLog.userId || "Unauthenticated"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">IP Address</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {selectedLog.ipAddress || "N/A"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">User Agent</Typography>
                    <Typography variant="caption" display="block" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                      {selectedLog.userAgent || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Stack Trace */}
              {(selectedLog.stackTrace || (selectedLog as any).stack) && (
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Stack Trace
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon fontSize="small" />}
                      onClick={() => handleCopy(selectedLog.stackTrace || (selectedLog as any).stack || "")}
                    >
                      Copy
                    </Button>
                  </Box>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: "grey.900",
                      color: "error.light",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      overflowX: "auto",
                      maxHeight: 250,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedLog.stackTrace || (selectedLog as any).stack}
                  </Paper>
                </Box>
              )}

              {/* Request Body / Data */}
              {(selectedLog.requestBody || (selectedLog as any).requestData) && (
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Sanitized Request Data
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon fontSize="small" />}
                      onClick={() => handleCopy(JSON.stringify(selectedLog.requestBody || (selectedLog as any).requestData, null, 2))}
                    >
                      Copy JSON
                    </Button>
                  </Box>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: "grey.900",
                      color: "grey.100",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      overflowX: "auto",
                      maxHeight: 200,
                    }}
                  >
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(selectedLog.requestBody || (selectedLog as any).requestData, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Selected Dialog */}
      <Dialog
        open={deleteSelectedOpen}
        onClose={() => !deleting && setDeleteSelectedOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main", display: "flex", alignItems: "center", gap: 1 }}>
          <DeleteIcon /> Delete Selected Error Logs
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to permanently delete <strong>{selectedIds.length}</strong> selected error log entries?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSelectedOpen(false)} color="inherit" disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSelected} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : "Delete Selected"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Bulk Filtered Dialog */}
      <Dialog
        open={deleteBulkOpen}
        onClose={() => !deleting && setDeleteBulkOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main", display: "flex", alignItems: "center", gap: 1 }}>
          <DeleteSweepIcon /> Delete All Filtered Logs
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to permanently delete all <strong>{total}</strong> error log entries matching your current filter?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteBulkOpen(false)} color="inherit" disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteBulk} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : "Delete All"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SuperAdminErrorLogs
