import { Routes, Route, Navigate } from 'react-router-dom'

import LoginPage from '../modules/auth/pages/LoginPage'
import NotFound from '../components/feedback/NotFound'
import AppShell from '../components/layout/AppShell/AppShell'
import RequireAuth from '../middlewares/RequireAuth'
import CompanyAdminDashboard from '../dashboards/company-admin/CompanyAdminDashboard'
import RequireRole from '../middlewares/RequireRole'


const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        {/* Temporary placeholder */}
        <Route index element={<div>Protected Home</div>} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRole roles={['HR', 'COMPANY_ADMIN']}>
            <CompanyAdminDashboard />
          </RequireRole>
        }
      />


      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
