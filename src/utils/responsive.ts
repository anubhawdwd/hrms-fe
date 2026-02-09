import { useTheme, useMediaQuery } from '@mui/material'

/**
 * Canonical responsive helpers.
 * Use these instead of ad-hoc media queries.
 */

export const useIsMobile = () => {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.only('xs'))
}

export const useIsTablet = () => {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.between('sm', 'md'))
}

export const useIsDesktop = () => {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.up('md'))
}

/**
 * Generic helper when needed.
 */
export const useBreakpointUp = (key: 'sm' | 'md' | 'lg') => {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.up(key))
}
