// src/pages/AdminGeoSettings.tsx
import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SaveIcon from '@mui/icons-material/Save'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { organizationApi } from '../api/organization.api'
import { getCurrentLocation } from '../utils/geo'
import { updateGeoFencingEnabled } from '../store/auth.slice'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

const RADIUS_PRESETS = [50, 100, 200, 500, 1000, 5000]

const AdminGeoSettings = () => {
    const dispatch = useDispatch()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [radiusM, setRadiusM] = useState<string>('200')
  const [geoFencingEnabled, setGeoFencingEnabled] = useState<boolean>(false)
  // officeId managed on backend
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Load existing office location
  const loadOfficeLocation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const office = await organizationApi.getOfficeLocation()
      if (office) {
        // loaded
        setLatitude(office.latitude.toString())
        setLongitude(office.longitude.toString())
        setRadiusM(office.radiusM.toString())
        setGeoFencingEnabled(office.geoFencingEnabled ?? false)
        if (office.updatedAt) {
          setLastUpdated(new Date(office.updatedAt).toLocaleString())
        }
      } else {
        // Defaults if no office configured yet
        setLatitude('23.052228')
        setLongitude('72.493801')
        setRadiusM('200')
        setGeoFencingEnabled(false)
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to load office location settings'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOfficeLocation()
  }, [loadOfficeLocation])

  // Detect current GPS position
  const handleDetectLocation = async () => {
    setLocating(true)
    try {
      const coords = await getCurrentLocation({ enableHighAccuracy: true })
      setLatitude(coords.latitude.toFixed(6))
      setLongitude(coords.longitude.toFixed(6))
      toast.success('Current location detected successfully!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to obtain GPS location')
    } finally {
      setLocating(false)
    }
  }

  // Quick toggle switch change with immediate backend persistence and Redux state update
  const handleToggleGeoFencing = async (checked: boolean) => {
    setGeoFencingEnabled(checked)

    try {
      const result = await organizationApi.updateOfficeLocation({
        geoFencingEnabled: checked,
      })
      if (result) {
        // saved
        if (result.latitude) setLatitude(result.latitude.toString())
        if (result.longitude) setLongitude(result.longitude.toString())
        if (result.radiusM) setRadiusM(result.radiusM.toString())
        if (result.updatedAt) {
          setLastUpdated(new Date(result.updatedAt).toLocaleString())
        }
      }

      // Sync active Redux auth state immediately so check-in/out reflects change instantly
      dispatch(updateGeoFencingEnabled(checked))

      toast.success(
        checked
          ? 'Geo-fencing enabled (radius check active)'
          : 'Geo-fencing disabled (check-in allowed anywhere)'
      )
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Failed to update toggle state'
      )
      // Revert on failure
      setGeoFencingEnabled(!checked)
    }
  }

  // Full form submission
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const latNum = parseFloat(latitude)
    const lngNum = parseFloat(longitude)
    const radNum = parseInt(radiusM, 10)

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.error('Please enter a valid Latitude between -90 and 90')
      return
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.error('Please enter a valid Longitude between -180 and 180')
      return
    }
    if (isNaN(radNum) || radNum <= 0) {
      toast.error('Radius must be a positive number greater than 0')
      return
    }

    setSaving(true)
    try {
      const result = await organizationApi.setOfficeLocation({
        latitude: latNum,
        longitude: lngNum,
        radiusM: radNum,
        geoFencingEnabled,
      })
      // saved
      if (result.updatedAt) {
        setLastUpdated(new Date(result.updatedAt).toLocaleString())
      }

      // Sync active Redux auth state
      dispatch(updateGeoFencingEnabled(geoFencingEnabled))

      toast.success('Office location and geo-settings saved successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState message="Loading geo-fencing settings..." />
  if (error) return <ErrorState message={error} onRetry={loadOfficeLocation} />

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', pb: 4 }}>
      <PageHeader
        title="Geo-Fenced Attendance Settings"
        subtitle="Configure office coordinates and toggle company-wide location enforcement for check-in & check-out"
        backTo="/admin"
        backLabel="Back to Dashboard"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Geo Settings' },
        ]}
      />

      <Grid container spacing={3}>
        {/* Toggle Switch Banner Card */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2,
              borderLeft: 6,
              borderColor: geoFencingEnabled ? 'primary.main' : 'text.disabled',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Company-Wide Geo-Fencing Enforcement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When enabled, employees must be physically within the office perimeter to check in or out.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={geoFencingEnabled ? 'primary.main' : 'text.secondary'}
                >
                  {geoFencingEnabled ? 'ENABLED' : 'DISABLED'}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={geoFencingEnabled}
                      onChange={(e) => handleToggleGeoFencing(e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Alert
              severity={geoFencingEnabled ? 'info' : 'warning'}
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            >
              {geoFencingEnabled ? (
                <>
                  <strong>Enforcement Active:</strong> Any employee checking in via Web or Mobile must have their GPS coordinates within <strong>{radiusM || 200} meters</strong> of the office coordinates below (unless granted individual designation/employee overrides).
                </>
              ) : (
                <>
                  <strong>Enforcement Bypassed:</strong> Attendance timestamps and GPS coordinates will still be recorded for auditing, but distance checks are bypassed and check-in will succeed from any location.
                </>
              )}
            </Alert>
          </Paper>
        </Grid>

        {/* Office Coordinates & Radius Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2.5,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Office Premises Coordinates
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  locating ? <CircularProgress size={16} /> : <MyLocationIcon />
                }
                onClick={handleDetectLocation}
                disabled={locating || saving}
              >
                Detect My Location
              </Button>
            </Box>

            <Box component="form" onSubmit={handleSave}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: 'any' }}
                    placeholder="e.g. 23.052228"
                    helperText="Range: -90.0 to 90.0"
                    disabled={saving}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: 'any' }}
                    placeholder="e.g. 72.493801"
                    helperText="Range: -180.0 to 180.0"
                    disabled={saving}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Allowed Radius (meters)"
                    value={radiusM}
                    onChange={(e) => setRadiusM(e.target.value)}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ min: 1, step: 10 }}
                    placeholder="e.g. 200"
                    helperText="Distance in meters around the office coordinates where check-in is permitted"
                    disabled={saving}
                  />
                </Grid>

                {/* Radius Presets */}
                <Grid size={{ xs: 12 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    display="block"
                    mb={1}
                  >
                    Quick Radius Presets:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {RADIUS_PRESETS.map((preset) => (
                      <Chip
                        key={preset}
                        label={`${preset} m`}
                        clickable
                        color={radiusM === preset.toString() ? 'primary' : 'default'}
                        variant={radiusM === preset.toString() ? 'filled' : 'outlined'}
                        onClick={() => setRadiusM(preset.toString())}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => loadOfficeLocation()}
                      disabled={saving}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
                      }
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Configuration Summary Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Summary & Status
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Geo-Fence Enforcement
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {geoFencingEnabled ? 'Active (Strict Radius)' : 'Disabled (Allow Anywhere)'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Target Coordinates
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {latitude || '—'}, {longitude || '—'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Perimeter Boundary
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {radiusM ? `${radiusM} meters` : '—'}
                </Typography>
              </Box>

              {lastUpdated && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lastUpdated}
                  </Typography>
                </Box>
              )}

              <Divider />

              <Typography variant="caption" color="text.secondary">
                💡 <strong>Tip:</strong> If employees work from home or in hybrid setups without designated policies, toggling off geo-fencing allows attendance logging while eliminating radius errors.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminGeoSettings
