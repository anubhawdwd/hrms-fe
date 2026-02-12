import { Routes, Route } from 'react-router-dom'

import AuthGate from './Authgate'
import AppShell from '../components/layout/AppShell/AppShell'
import RequirePermission from '../middlewares/RequirePermission'

import EmployeeDashboard from '../dashboards/employee/EmployeeDashboard'
import CompanyAdminDashboard from '../dashboards/company-admin/CompanyAdminDashboard'
import SuperAdminDashboard from '../dashboards/super-admin/SuperAdminDashboard'
import EmployeeProfileView from '../dashboards/company-admin/EmployeeProfileView'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Gate */}
      <Route path="/" element={<AuthGate />} />

      {/* Employee */}
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

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequirePermission permission="admin.access">
            <AppShell />
          </RequirePermission>
        }
      >
        <Route index element={<CompanyAdminDashboard />} />
        <Route
          path="employees/:employeeId"
          element={<EmployeeProfileView />}
        />
      </Route>

      {/* Super Admin */}
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
    </Routes>
  )
}

export default AppRoutes


