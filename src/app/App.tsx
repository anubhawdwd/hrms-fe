import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Toaster } from 'react-hot-toast'

import { store } from '../store/store'
import { theme } from '../styles/theme'
import AppRoutes from './routes'
import AuthBootstrap from './AuthBootstrap'

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <AuthBootstrap>
            <AppRoutes />
          </AuthBootstrap>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  )
}

export default App