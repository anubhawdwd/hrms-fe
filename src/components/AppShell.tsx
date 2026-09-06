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
import type { UserRole } from "../types/auth.types"
import { NotificationBell } from "./NotificationBell"
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

function formatSingleRole(role?: string): string {
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

function formatRoles(roles: UserRole[]): string {
  if (roles.length === 0) return ""
  // Sort roles to present senior/admin roles first: SUPER_ADMIN > COMPANY_ADMIN > HR > EMPLOYEE
  const roleOrder: Record<UserRole, number> = {
    SUPER_ADMIN: 1,
    COMPANY_ADMIN: 2,
    HR: 3,
    EMPLOYEE: 4,
  }
  const sorted = [...roles].sort((a, b) => (roleOrder[a] || 99) - (roleOrder[b] || 99))
  return sorted.map(formatSingleRole).join(" • ")
}

const AppShell = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useUser()

  // Extract all active user roles
  const userRoles = (user?.roles && user.roles.length > 0
    ? user.roles
    : (user?.role ? [user.role] : [])) as UserRole[]

  // User Profile Dropdown Menu State
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const isUserMenuOpen = Boolean(userMenuAnchor)

  // Voluntary Change Password Modal State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  // Mobile Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const isEmployeeView = location.pathname.startsWith("/employee")
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN")
  const hasAdminRole = userRoles.includes("COMPANY_ADMIN") || userRoles.includes("HR")
  const hasEmployeeRole = userRoles.includes("EMPLOYEE")

  // Multi-role switch option is available ONLY when user holds roles across different dashboard domains
  const canSwitchViews = hasAdminRole && hasEmployeeRole

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
    } else if (canSwitchViews) {
      navigate(isEmployeeView ? "/employee" : "/admin")
    } else if (hasAdminRole) {
      navigate("/admin")
    } else if (hasEmployeeRole) {
      navigate("/employee")
    } else {
      const homeRoute = getDashboardRoute(userRoles)
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

    if (isSuperAdmin) {
      return [
        { label: "Companies", path: "/super-admin", icon: <BusinessIcon fontSize="small" /> },
        { label: "Admins", path: "/super-admin/admins", icon: <AdminPanelSettingsIcon fontSize="small" /> },
        { label: "Error Logs", path: "/super-admin/error-logs", icon: <BugReportIcon fontSize="small" /> },
      ]
    }

    if (isEmployeeView) {
      return [
        { label: "My Dashboard", path: "/employee", icon: <DashboardIcon fontSize="small" /> },
      ]
    }

    if (hasAdminRole) {
      return [
        {
          label: "Dashboard",
          path: "/admin",
          icon: <DashboardIcon fontSize="small" />,
        },
        { label: "Attendance", path: "/admin/attendance-dashboard", icon: <HowToRegIcon fontSize="small" /> },
        { label: "Reports", path: "/admin/reports", icon: <SummarizeIcon fontSize="small" /> },
        { label: "Holidays", path: "/admin/holidays", icon: <CelebrationIcon fontSize="small" /> },
      ]
    }

    if (hasEmployeeRole) {
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
  const roleLabel = formatRoles(userRoles)

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
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              userSelect: "none",
              "&:hover": { opacity: 0.9 },
            }}
          >
            <Typography variant="h6" fontWeight={800} letterSpacing={-0.5} noWrap>
              HRMS
            </Typography>
            <Chip
              label={companyName}
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "inherit",
                fontWeight: 600,
                fontSize: "0.75rem",
                display: { xs: "none", sm: "inline-flex" },
              }}
            />
          </Box>

          {/* Center: Desktop Navigation Bar */}
          <Stack
            direction="row"
            spacing={0.5}
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
                  startIcon={item.icon}
                  onClick={() => handleNavClick(item.path)}
                  sx={{
                    color: "inherit",
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    fontWeight: active ? 700 : 500,
                    bgcolor: active ? "rgba(255, 255, 255, 0.2)" : "transparent",
                    "&:hover": {
                      bgcolor: active ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.08)",
                    },
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </Stack>

          {/* Right: User Profile Menu & Mobile Hamburger */}
          <Stack direction="row" spacing={1} alignItems="center">
            <NotificationBell />

            {/* User Profile Pill Trigger */}
            <Button
              onClick={handleUserMenuOpen}
              aria-controls={isUserMenuOpen ? "user-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen ? "true" : undefined}
              sx={{
                color: "inherit",
                p: { xs: 0.5, sm: "4px 8px 4px 4px" },
                borderRadius: 3,
                bgcolor: "rgba(255, 255, 255, 0.08)",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.16)" },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    bgcolor: isSuperAdmin ? "secondary.main" : "primary.dark",
                  }}
                >
                  {userInitials}
                </Avatar>
                <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left", mr: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} lineHeight={1.2} noWrap sx={{ maxWidth: 140 }}>
                    {roleLabel}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap display="block">
                    {user?.email}
                  </Typography>
                </Box>
                <ArrowDropDownIcon fontSize="small" sx={{ display: { xs: "none", sm: "block" } }} />
              </Stack>
            </Button>

            {/* Mobile Hamburger Toggle */}
            {navItems.length > 0 && (
              <IconButton
                color="inherit"
                aria-label="open navigation drawer"
                edge="end"
                onClick={() => setMobileDrawerOpen(true)}
                sx={{
                  display: { xs: "flex", md: "none" },
                  p: 1,
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

        {/* Multi-Role View Switcher: Shown ONLY when user holds multiple roles across different dashboards */}
        {canSwitchViews && [
          <MenuItem key="toggle-view-mode" onClick={handleToggleViewMode} sx={{ py: 1 }}>
            <ListItemIcon>
              {isEmployeeView ? (
                <AdminPanelSettingsIcon fontSize="small" color="primary" />
              ) : (
                <BadgeIcon fontSize="small" color="primary" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={isEmployeeView ? "Switch to Admin View" : "Switch to Employee View"}
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

          {canSwitchViews && (
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={isEmployeeView ? <AdminPanelSettingsIcon /> : <BadgeIcon />}
              onClick={handleToggleViewMode}
              size="small"
              sx={{ mb: 1 }}
            >
              {isEmployeeView ? "Switch to Admin View" : "Switch to Employee View"}
            </Button>
          )}

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
