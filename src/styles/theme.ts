// src/styles/theme.ts
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 1024,
      lg: 1440,
      xl: 1920,
    },
  },

  palette: {
    // primary: {
    //   main: '#1976d2',
    // },
    // secondary: {
    //   main: '#9c27b0',
    // },
    // success: {
    //   main: '#2e7d32',
    // },
    // warning: {
    //   main: '#ed6c02',
    // },
    // error: {
    //   main: '#d32f2f',
    // },
     primary: {
      main: '#c1d3ff',      // pastel blue
      contrastText: '#1f2937',
    },

    secondary: {
      main: '#c5f0d1',      // pastel green
      contrastText: '#1f2937',
    },

    success: {
      main: '#d8f273',      // success green
      contrastText: '#1f2937',
    },

    error: {
      main: '#d32f2f',      // normalized red (accessible)
      contrastText: '#ffffff',
    },
     warning: {
      main: '#f9b3b3',      // pastel red as warning/accent
      contrastText: '#1f2937',
    },
    info: {
      main: '#0288d1',
    },
    background: {
      default: '#ffffff',
      paper: '#f9fafb',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      disabled: '#9ca3af',
    },
    divider: '#e5e7eb',
  },

  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },

  shape: {
    borderRadius: 8,
  },
})
