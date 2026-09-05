// src/pages/AdminHolidays.tsx
import { useState } from "react"
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  MenuItem,
  Chip,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import EventBusyIcon from "@mui/icons-material/EventBusy"
import dayjs from "dayjs"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import toast from "react-hot-toast"
import { useHolidays } from "../hooks/useLeave"
import { leaveApi } from "../api/leave.api"
import type { HolidayType } from "../types/leave.types"
import PageHeader from "../components/PageHeader"
import LoadingState from "../components/LoadingState"

const AdminHolidays = () => {
  const { holidays, loading, reload } = useHolidays()
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [type, setType] = useState<HolidayType>("NORMAL")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !date) {
      toast.error("Name and date required")
      return
    }

    setCreating(true)
    try {
      await leaveApi.createHoliday({ name: name.trim(), date, type })
      toast.success("Holiday added successfully")
      setName("")
      setDate("")
      setType("NORMAL")
      reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create holiday")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await leaveApi.deleteHoliday(id)
      toast.success("Holiday removed")
      reload()
    } catch {
      toast.error("Failed to delete")
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
          { label: "Admin", path: "/admin" },
          { label: "Holidays" },
        ]}
      />

      {/* Create form */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Add Company Holiday
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            label="Holiday Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            placeholder="e.g. Diwali, Good Friday"
            sx={{ minWidth: 240, flex: 1 }}
          />
          <DatePicker
            label="Date"
            value={date ? dayjs(date) : null}
            onChange={(newValue) => setDate(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 170 },
              },
            }}
          />
          <TextField
            select
            label="Holiday Type"
            value={type}
            onChange={(e) => setType(e.target.value as HolidayType)}
            size="small"
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="NORMAL">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Normal</span>
                <Typography variant="caption" color="text.secondary">
                  (Office Closed)
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="RESTRICTED">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Restricted</span>
                <Typography variant="caption" color="text.secondary">
                  (Optional / RH)
                </Typography>
              </Box>
            </MenuItem>
          </TextField>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <EventBusyIcon />}
            sx={{ height: 40, px: 3, fontWeight: 600, textTransform: "none" }}
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
          holidays.map((h: any) => {
            const isRestricted = h.type === "RESTRICTED"

            return (
              <Box
                key={h.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {h.name}
                      </Typography>
                      {isRestricted ? (
                        <Chip
                          label="Restricted"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 600 }}
                        />
                      ) : (
                        <Chip
                          label="Normal"
                          size="small"
                          color="default"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(h.date).format("DD MMMM YYYY (dddd)")}
                    </Typography>
                  </Box>
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
            )
          })
        )}
      </Paper>
    </Box>
  )
}

export default AdminHolidays
