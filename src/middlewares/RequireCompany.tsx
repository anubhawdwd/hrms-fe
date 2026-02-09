import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/rootReducer'

interface RequireCompanyProps {
  children: ReactNode
}

const RequireCompany = ({ children }: RequireCompanyProps) => {
  const companyId = useSelector(
    (state: RootState) => state.auth.companyId
  )

  if (!companyId) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default RequireCompany
