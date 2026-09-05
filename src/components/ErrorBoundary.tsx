// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Box, Typography, Button, Paper, Collapse, Alert } from "@mui/material"
import RefreshIcon from "@mui/icons-material/Refresh"
import BugReportIcon from "@mui/icons-material/BugReport"
import { errorLogApi } from "../api/error-log.api"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Auto-report to backend
    errorLogApi
      .reportFrontendError({
        message: `[React Render Error] ${error.message || "Unknown rendering exception"}`,
        stackTrace: error.stack || null,
        url: typeof window !== "undefined" ? window.location.href : null,
      })
      .catch(() => {
        // Silently swallow reporting failure to avoid cascade
      })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            bgcolor: "grey.50",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: 600,
              width: "100%",
              p: 4,
              borderRadius: 3,
              textAlign: "center",
            }}
          >
            <Box sx={{ mb: 2, color: "error.main" }}>
              <BugReportIcon sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected application error occurred. Our engineering team has been notified
              via our central error logging system.
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
              {this.state.error?.message || "An unknown error occurred."}
            </Alert>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button variant="outlined" color="inherit" onClick={this.toggleDetails}>
                {this.state.showDetails ? "Hide Technical Details" : "Show Technical Details"}
              </Button>
            </Box>

            <Collapse in={this.state.showDetails}>
              <Paper
                variant="outlined"
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "grey.900",
                  color: "grey.100",
                  textAlign: "left",
                  overflowX: "auto",
                  maxHeight: 250,
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                }}
              >
                <Typography variant="caption" sx={{ color: "error.light", display: "block", mb: 1 }}>
                  {this.state.error?.stack}
                </Typography>
                {this.state.errorInfo?.componentStack && (
                  <Typography variant="caption" sx={{ color: "warning.light", display: "block" }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Paper>
            </Collapse>
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
