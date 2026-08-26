// src/components/PageHeader.tsx
import React from 'react'
import { Box, Typography, Button, Stack, Breadcrumbs, Link } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { useNavigate } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  path?: string
}

export interface PageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  backTo?: string
  backLabel?: string
  onBack?: () => void
  action?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  sx?: object
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  onBack,
  action,
  breadcrumbs,
  sx,
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  const showBack = Boolean(backTo || onBack)

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 1.5 }}
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            if (isLast || !item.path) {
              return (
                <Typography
                  key={index}
                  color="text.primary"
                  variant="body2"
                  fontWeight={isLast ? 600 : 400}
                >
                  {item.label}
                </Typography>
              )
            }
            return (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                variant="body2"
                onClick={() => navigate(item.path!)}
                sx={{ cursor: 'pointer' }}
              >
                {item.label}
              </Link>
            )
          })}
        </Breadcrumbs>
      )}

      {/* Contextual Back Button */}
      {showBack && (
        <Button
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={handleBack}
          size="small"
          sx={{
            mb: 1.5,
            color: 'text.secondary',
            textTransform: 'none',
            fontWeight: 500,
            px: 1,
            '&:hover': {
              color: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          {backLabel}
        </Button>
      )}

      {/* Title & Actions Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          {typeof title === 'string' ? (
            <Typography variant="h5" fontWeight={700} color="text.primary">
              {title}
            </Typography>
          ) : (
            title
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {action && (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
          >
            {action}
          </Stack>
        )}
      </Box>
    </Box>
  )
}

export default PageHeader
