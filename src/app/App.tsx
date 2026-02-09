import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes'
import { useAuthBootstrap } from '../modules/auth/hooks'

const App = () => {
  useAuthBootstrap()

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AppRoutes />
    </>
  )
}

export default App
