// src/app/routes.tsx
import { Routes, Route } from 'react-router-dom'

import AuthGate from '../pages/AuthGate'
import AppShell from '../components/AppShell'
import RequirePermission from '../guards/RequirePermission'

import EmployeeDashboard from '../pages/EmployeeDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import AdminEmployeeList from '../pages/AdminEmployeeList'
import AdminEmployeeProfile from '../pages/AdminEmployeeProfile'
import AdminLeaveApprovals from '../pages/AdminLeaveApprovals'
import AdminHolidays from '../pages/AdminHolidays'
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
      <Route
        path="employees/:employeeId"
        element={<AdminEmployeeProfile />}
      />
      <Route path="leave-approvals" element={<AdminLeaveApprovals />} />
      <Route path="holidays" element={<AdminHolidays />} />
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