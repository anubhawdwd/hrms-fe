import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import type { RootState } from '../store/rootReducer'
import LoginPage from '../modules/auth/pages/LoginPage'
import Container from '../components/ui/Container/Container'
import Card from '../components/ui/Card/Card'
import Typography from '../components/ui/Typography/Typography'
import { getDashboardRoute } from '../utils/dashboard'

const AuthGate = () => {
  const { status, user } = useSelector(
    (state: RootState) => state.auth
  )

  if (status === 'idle' || status === 'loading') {
    return (
      <Container
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card
          sx={{
            p: 'var(--space-6)',
            textAlign: 'center',
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Typography variant="h6">
            Initializing session...
          </Typography>
        </Card>
      </Container>
    )
  }

  if (status === 'unauthenticated') {
    return <LoginPage />
  }

  return <Navigate to={getDashboardRoute(user?.role)} replace />
}

export default AuthGate
