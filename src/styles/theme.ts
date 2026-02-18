// src/styles/theme.ts

import { createTheme, alpha } from '@mui/material/styles'

const palette = {
  primary: {
    main: '#6366F1',      // Indigo-500
    light: '#818CF8',     // Indigo-400
    dark: '#4F46E5',      // Indigo-600
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#EC4899',      // Pink-500
    light: '#F472B6',
    dark: '#DB2777',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#10B981',      // Emerald-500
    light: '#34D399',
    dark: '#059669',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B',      // Amber-500
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444',      // Red-500
    light: '#F87171',
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#3B82F6',      // Blue-500
    light: '#60A5FA',
    dark: '#2563EB',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8FAFC',   // Slate-50
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',   // Slate-900
    secondary: '#64748B', // Slate-500
    disabled: '#94A3B8',  // Slate-400
  },
  divider: '#E2E8F0',    // Slate-200
}

const theme = createTheme({
  palette,
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '0.95rem',
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.85rem',
      letterSpacing: '0.02em',
      textTransform: 'uppercase' as const,
    },
    body1: {
      fontSize: '0.938rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.01em',
      textTransform: 'none' as const,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.background.default,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${palette.divider}`,
          backgroundImage: 'none',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 600,
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 12px ${alpha(palette.primary.main, 0.3)}`,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: 8,
        },
        sizeSmall: {
          height: 24,
          fontSize: '0.7rem',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: alpha(palette.primary.main, 0.08),
        },
        bar: {
          borderRadius: 8,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(palette.primary.main, 0.08),
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 12px',
        },
      },
    },
  },
})

export default theme

// import { createTheme } from '@mui/material/styles'

// export const theme = createTheme({
//   breakpoints: {
//     values: {
//       xs: 0,
//       sm: 600,
//       md: 1024,
//       lg: 1440,
//       xl: 1920,
//     },
//   },

//   palette: {
//      primary: {
//       main: '#2d5fdf',      
//       contrastText: '#1f2937',
//     },

//     secondary: {
//       main: '#e97ce0',      
//       contrastText: '#1f2937',
//     },

//     success: {
//       main: '#78e45c',      
//       contrastText: '#1f2937',
//     },

//     error: {
//       main: '#d32f2f',     
//       contrastText: '#ffffff',
//     },
//      warning: {
//       main: '#fa4b4b',      
//       contrastText: '#1f2937',
//     },
//     info: {
//       main: '#82fce1',
//     },
//     background: {
//       default: '#ffffff',
//       paper: '#f9fafb',
//     },
//     text: {
//       primary: '#1f2937',
//       secondary: '#6b7280',
//       disabled: '#9ca3af',
//     },
//     divider: '#9c9fa3',
//   },

//   typography: {
//     fontFamily: [
//       'Inter',
//       '-apple-system',
//       'BlinkMacSystemFont',
//       '"Segoe UI"',
//       'Roboto',
//       'Helvetica',
//       'Arial',
//       'sans-serif',
//     ].join(','),
//     button: {
//       textTransform: 'none',
//       fontWeight: 500,
//     },
//   },

//   shape: {
//     borderRadius: 8,
//   },
// })
