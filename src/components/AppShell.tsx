// src/components/AppShell.tsx
import React, { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Chip,
  Button,
  Stack,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
} from "@mui/material"
import LogoutIcon from "@mui/icons-material/Logout"
import MenuIcon from "@mui/icons-material/Menu"
import CloseIcon from "@mui/icons-material/Close"
import DashboardIcon from "@mui/icons-material/Dashboard"
import HowToRegIcon from "@mui/icons-material/HowToReg"
import CelebrationIcon from "@mui/icons-material/Celebration"
import BusinessIcon from "@mui/icons-material/Business"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import BadgeIcon from "@mui/icons-material/Badge"
import BugReportIcon from "@mui/icons-material/BugReport"
import SummarizeIcon from "@mui/icons-material/Summarize"
import LockResetIcon from "@mui/icons-material/LockReset"
import { useDispatch } from "react-redux"
import { authApi } from "../api/auth.api"
import { clearAuth } from "../store/auth.slice"
import { useUser } from "../hooks/useAuth"
import { getDashboardRoute } from "../utils/dashboard"
import ChangePasswordModal from "./ChangePasswordModal"

interface NavItem {
  label: string
  path: string
  icon?: React.ReactNode
}

function getInitials(email?: string): string {
  if (!email) return "U"
  const namePart = email.split("@")[0] || ""
  const parts = namePart.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (namePart.slice(0, 2) || "U").toUpperCase()
}

function formatRole(role?: string): string {
  if (!role) return ""
  switch (role) {
    case "COMPANY_ADMIN":
      return "Admin"
    case "SUPER_ADMIN":
      return "Super Admin"
    case "HR":
      return "HR Manager"
    case "EMPLOYEE":
      return "Employee"
    default:
      return role
  }
}

const AppShell = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useUser()

  // User Profile Dropdown Menu State
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const isUserMenuOpen = Boolean(userMenuAnchor)

  // Voluntary Change Password Modal State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  // Mobile Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const isEmployeeView = location.pathname.startsWith("/employee")
  const isHrOrAdmin = user?.role === "HR" || user?.role === "COMPANY_ADMIN"
  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleLogout = async () => {
    handleUserMenuClose()
    setMobileDrawerOpen(false)
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    dispatch(clearAuth())
    navigate("/", { replace: true })
  }

  const handleHomeClick = () => {
    if (isSuperAdmin) {
      navigate("/super-admin")
    } else if (isHrOrAdmin) {
      navigate(isEmployeeView ? "/employee" : "/admin")
    } else {
      const homeRoute = getDashboardRoute(user?.role)
      navigate(homeRoute)
    }
  }

  const handleNavClick = (path: string) => {
    navigate(path)
    setMobileDrawerOpen(false)
  }

  const handleToggleViewMode = () => {
    if (isEmployeeView) {
      navigate("/admin")
    } else {
      navigate("/employee")
    }
    setMobileDrawerOpen(false)
    handleUserMenuClose()
  }

  const handleOpenChangePassword = () => {
    handleUserMenuClose()
    setChangePasswordOpen(true)
  }

  // Define context-aware navigation items
  const getNavItems = (): NavItem[] => {
    if (!user) return []

    if (user.role === "SUPER_ADMIN") {
      return [
        { label: "Companies", path: "/super-admin", icon: <BusinessIcon fontSize="small" /> },
        { label: "Admins", path: "/super-admin/admins", icon: <AdminPanelSettingsIcon fontSize="small" /> },
        { label: "Error Logs", path: "/super-admin/error-logs", icon: <BugReportIcon fontSize="small" /> },
      ]
    }

    if (isHrOrAdmin) {
      if (isEmployeeView) {
        return [
          { label: "My Dashboard", path: "/employee", icon: <DashboardIcon fontSize="small" /> },
        ]
      }
      return [
        { label: "Dashboard", path: "/admin", icon: <DashboardIcon fontSize="small" /> },
        { label: "Attendance", path: "/admin/attendance-dashboard", icon: <HowToRegIcon fontSize="small" /> },
        { label: "Reports", path: "/admin/reports", icon: <SummarizeIcon fontSize="small" /> },
        { label: "Holidays", path: "/admin/holidays", icon: <CelebrationIcon fontSize="small" /> },
      ]
    }

    if (user.role === "EMPLOYEE") {
      return [
        { label: "Dashboard", path: "/employee", icon: <DashboardIcon fontSize="small" /> },
      ]
    }

    return []
  }

  const navItems = getNavItems()

  const isNavActive = (itemPath: string) => {
    if (itemPath === "/super-admin") {
      return location.pathname === "/super-admin"
    }
    if (itemPath === "/super-admin/error-logs") {
      return location.pathname.startsWith("/super-admin/error-logs")
    }
    if (itemPath === "/admin" || itemPath === "/employee") {
      return location.pathname === itemPath
    }
    if (itemPath === "/admin/attendance-dashboard") {
      return location.pathname === "/admin/attendance-dashboard" || location.pathname === "/admin/attendance"
    }
    return location.pathname.startsWith(itemPath)
  }

  const companyName = isSuperAdmin
    ? "Platform Administration"
    : user?.companyName || "Company Workspace"
  const userInitials = getInitials(user?.email)
  const roleLabel = formatRole(user?.role)

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "grey.50" }}>
      {/* Primary Top AppBar */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between", gap: 2, minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 3 } }}>
          {/* Left: Brand + Dynamic Title */}
          <Box
            component="div"
            role="button"
            tabIndex={0}
            onClick={handleHomeClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleHomeClick()
              }
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              userSelect: "none",
              py: 0.5,
              px: 1,
              borderRadius: 1.5,
              transition: "background-color 0.15s ease",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.15)",
              },
              "&:focus-visible": {
                outline: "2px solid white",
                outlineOffset: "2px",
              },
            }}
            aria-label="HRMS Home"
          >
            <Typography
              variant="h6"
              fontWeight={800}
              letterSpacing={1.2}
              sx={{ color: "white", lineHeight: 1.1, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
            >
              HRMS
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.75)",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: 0.5,
                lineHeight: 1,
                mt: 0.2,
              }}
            >
              {companyName}
            </Typography>
          </Box>

          {/* Center: Desktop Navigation Bar */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
            }}
          >
            {navItems.map((item) => {
              const active = isNavActive(item.path)
              return (
                <Button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  startIcon={item.icon}
                  sx={{
                    color: "white",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.875rem",
                    px: 1.8,
                    py: 0.8,
                    borderRadius: 2,
                    textTransform: "none",
                    backgroundColor: active ? "rgba(255, 255, 255, 0.2)" : "transparent",
                    "&:hover": {
                      backgroundColor: active ? "rgba(255, 255, 255, 0.28)" : "rgba(255, 255, 255, 0.1)",
                    },
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </Stack>

          {/* Right: User Profile Controls + Mobile Hamburger */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* User Profile Pill Button */}
            <Button
              onClick={handleUserMenuOpen}
              aria-controls={isUserMenuOpen ? "user-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen ? "true" : undefined}
              endIcon={<ArrowDropDownIcon sx={{ color: "white" }} />}
              sx={{
                textTransform: "none",
                color: "white",
                borderRadius: 3,
                px: 1.2,
                py: 0.5,
                bgcolor: "rgba(255, 255, 255, 0.12)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.22)",
                },
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  bgcolor: isSuperAdmin ? "secondary.main" : "primary.dark",
                  color: "white",
                }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ textAlign: "left", display: { xs: "none", sm: "block" } }}>
                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.1 }}>
                  {roleLabel}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.75)", fontSize: "0.68rem", display: "block" }}
                >
                  {user?.email}
                </Typography>
              </Box>
            </Button>

            {/* Mobile Hamburger Menu Button */}
            {navItems.length > 0 && (
              <IconButton
                color="inherit"
                aria-label="Open navigation menu"
                onClick={() => setMobileDrawerOpen(true)}
                aria-expanded={mobileDrawerOpen}
                sx={{
                  display: { xs: "flex", md: "none" },
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* User Profile Popover / Dropdown Menu */}
      <Menu
        id="user-menu"
        anchorEl={userMenuAnchor}
        open={isUserMenuOpen}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 240,
            borderRadius: 2,
            mt: 1,
            p: 0.5,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                fontSize: "0.95rem",
                fontWeight: 700,
                bgcolor: isSuperAdmin ? "secondary.main" : "primary.main",
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {roleLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={companyName}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 20 }}
          />
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* Dual Mode Switch in Menu for HR/Company Admin */}
        {isHrOrAdmin && [
          <MenuItem key="toggle-view-mode" onClick={handleToggleViewMode} sx={{ py: 1 }}>
            <ListItemIcon>
              {isEmployeeView ? (
                <AdminPanelSettingsIcon fontSize="small" color="primary" />
              ) : (
                <BadgeIcon fontSize="small" color="primary" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={isEmployeeView ? "Switch to Admin / HR View" : "Switch to Employee View"}
              primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
            />
          </MenuItem>,
          <Divider key="toggle-view-divider" sx={{ my: 0.5 }} />,
        ]}

        {/* Change Password for all authenticated users */}
        <MenuItem onClick={handleOpenChangePassword} sx={{ py: 1 }}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Change Password"
            primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
          />
        </MenuItem>

        <MenuItem onClick={handleLogout} sx={{ color: "error.main", py: 1 }}>
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
        </MenuItem>
      </Menu>

      {/* Mobile Navigation Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: { xs: 280, sm: 320 },
            boxSizing: "border-box",
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: 8,
          },
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
        aria-label="Navigation Menu"
      >
        <Box>
          {/* Drawer Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="primary">
                HRMS
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {companyName}
              </Typography>
            </Box>
            <IconButton onClick={() => setMobileDrawerOpen(false)} size="small" aria-label="Close navigation menu">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Navigation Links */}
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ px: 1, mb: 1, display: "block", letterSpacing: 0.5 }}>
            NAVIGATION
          </Typography>
          <List sx={{ p: 0 }}>
            {navItems.map((item) => {
              const active = isNavActive(item.path)
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavClick(item.path)}
                    selected={active}
                    sx={{
                      borderRadius: 1.5,
                      py: 1,
                      "&.Mui-selected": {
                        bgcolor: "primary.light",
                        color: "primary.contrastText",
                        fontWeight: 700,
                        "& .MuiListItemIcon-root": { color: "inherit" },
                        "&:hover": { bgcolor: "primary.main" },
                      },
                    }}
                  >
                    {item.icon && <ListItemIcon sx={{ minWidth: 36, color: active ? "inherit" : "text.secondary" }}>{item.icon}</ListItemIcon>}
                    <ListItemText primary={item.label} primaryTypographyProps={{ variant: "body2", fontWeight: active ? 700 : 500 }} />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        </Box>

        {/* Drawer Footer */}
        <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <Avatar sx={{ width: 36, height: 36, fontSize: "0.85rem", fontWeight: 700, bgcolor: isSuperAdmin ? "secondary.main" : "primary.main" }}>
              {userInitials}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {roleLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<LockResetIcon />}
            onClick={handleOpenChangePassword}
            size="small"
            sx={{ mb: 1 }}
          >
            Change Password
          </Button>

          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            size="small"
          >
            Sign Out
          </Button>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          maxWidth: location.pathname.startsWith("/admin/attendance-dashboard") ? "100%" : 1280,
          width: "100%",
          mx: "auto",
          px: location.pathname.startsWith("/admin/attendance-dashboard")
            ? { xs: 1.5, sm: 2.5, md: 3.5 }
            : { xs: 2, sm: 3, md: 4 },
          py: 3,
        }}
      >
        <Outlet />
      </Box>

      {/* Change Password Modal (handles both mandatory and voluntary password changes) */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Box>
  )
}

export default AppShell
