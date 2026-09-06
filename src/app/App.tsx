// src/app/App.tsx
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider, CssBaseline } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { Toaster } from "react-hot-toast"

import { store } from "../store/store"
import theme from "../styles/theme"
import AppRoutes from "./routes"
import AuthBootstrap from "./AuthBootstrap"
import ErrorBoundary from "../components/ErrorBoundary"
import { SocketProvider } from "../context/SocketContext"

const App = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <CssBaseline />
              <Toaster position="top-right" toastOptions={{ duration: 1000 }} />
              <AuthBootstrap>
                <SocketProvider>
                  <AppRoutes />
                </SocketProvider>
              </AuthBootstrap>
            </LocalizationProvider>
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  )
}

export default App
