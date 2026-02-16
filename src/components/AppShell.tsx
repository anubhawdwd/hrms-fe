// src/components/AppShell.tsx
import { Outlet, useNavigate } from 'react-router-dom'
import { Box, AppBar, Toolbar, IconButton, Typography } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { useDispatch } from 'react-redux'
import { authApi } from '../api/auth.api'
import { clearAuth } from '../store/auth.slice'
import { useUser } from '../hooks/useAuth'

const AppShell = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useUser()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    dispatch(clearAuth())
    navigate('/', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HRMS
          </Typography>

          {user && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.email}
            </Typography>
          )}

          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 2, sm: 3, md: 4 },
          py: 3,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default AppShell