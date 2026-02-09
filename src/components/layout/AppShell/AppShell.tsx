import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

const AppShell = () => {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      sx={{
        px: {
          xs: 2, // mobile
          sm: 3, // tablet
          md: 4, // desktop
        },
        py: 2,
      }}
    >
      {/* Header will come here */}
      {/* Sidebar will come here */}

      <Box flex={1} display="flex" flexDirection="column">
        <Outlet />
      </Box>
    </Box>
  )
}

export default AppShell
