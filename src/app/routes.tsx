// src/app/routes.tsx
import { Routes, Route, Navigate } from 'react-router-dom'

import AuthGate from '../pages/AuthGate'
import AppShell from '../components/AppShell'
import RequirePermission from '../guards/RequirePermission'

import EmployeeDashboard from '../pages/EmployeeDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import AdminEmployeeList from '../pages/AdminEmployeeList'
import AdminEmployeeProfile from '../pages/AdminEmployeeProfile'
import AdminUserList from '../pages/AdminUserList'
import AdminCreateEmployee from '../pages/AdminCreateEmployee'
import AdminLeaveDashboard from '../pages/AdminLeaveDashboard'
import AdminHolidays from '../pages/AdminHolidays'
import AdminAttendance from '../pages/AdminAttendance'
import AdminGeoSettings from '../pages/AdminGeoSettings'
import AdminOrganization from '../pages/AdminOrganization'
import AdminAttendanceDashboard from '../pages/AdminAttendanceDashboard'
import SuperAdminDashboard from '../pages/SuperAdminDashboard'
import NotFound from '../pages/NotFound'

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AuthGate />} />

    <Route
      path="/employee"
      element={
        <RequirePermission permission="employee.view">
          <AppShell />
        </RequirePermission>
      }
    >
      <Route index element={<EmployeeDashboard />} />
    </Route>

    <Route
      path="/admin"
      element={
        <RequirePermission permission="admin.access">
          <AppShell />
        </RequirePermission>
      }
    >
      <Route index element={<AdminDashboard />} />
      <Route path="employees" element={<AdminEmployeeList />} />
      <Route path="users" element={<AdminUserList />} />
      <Route path="employees/new" element={<AdminCreateEmployee />} />
      <Route
        path="employees/:employeeId"
        element={<AdminEmployeeProfile />}
      />
      <Route path="leave-dashboard" element={<AdminLeaveDashboard />} />
      <Route path="leave-approvals" element={<Navigate to="/admin/leave-dashboard" replace />} />
      <Route path="leave-approval" element={<Navigate to="/admin/leave-dashboard" replace />} />
      <Route path="holidays" element={<AdminHolidays />} />
      <Route path="attendance" element={<AdminAttendance />} />
      <Route path="attendance-dashboard" element={<AdminAttendanceDashboard />} />
      <Route path="organization" element={<AdminOrganization />} />
      <Route
        path="organization/geo-settings"
        element={<AdminGeoSettings />}
      />
      <Route path="geo-settings" element={<AdminGeoSettings />} />
    </Route>

    <Route
      path="/super-admin"
      element={
        <RequirePermission permission="company.manage">
          <AppShell />
        </RequirePermission>
      }
    >
      <Route index element={<SuperAdminDashboard />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
)

export default AppRoutes
