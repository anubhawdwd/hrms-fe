// src/components/EmployeeAutocomplete.tsx
import React, { useMemo } from 'react'
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  type SxProps,
  type Theme,
} from '@mui/material'
import type { EmployeeListItem } from '../types/employee.types'

export interface EmployeeAutocompleteProps {
  value: string
  onChange: (employeeId: string, employee?: EmployeeListItem | null) => void
  employees: EmployeeListItem[]
  loading?: boolean
  disabled?: boolean
  label?: string
  placeholder?: string
  error?: boolean
  helperText?: string
  required?: boolean
  size?: 'small' | 'medium'
  fullWidth?: boolean
  sx?: SxProps<Theme>
}

// Simple Levenshtein distance for fuzzy typo tolerance
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const d: number[][] = []
  for (let i = 0; i <= m; i++) d[i] = [i]
  for (let j = 0; j <= n; j++) d[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      )
    }
  }
  return d[m][n]
}

// Check if search token matches word with reasonable typo tolerance
function isFuzzyMatch(word: string, token: string): boolean {
  if (word.includes(token)) return true
  if (token.length >= 4) {
    const dist = levenshteinDistance(word, token)
    if (dist <= 1 && token.length <= 6) return true
    if (dist <= 2 && token.length > 6) return true
  }
  return false
}

const EmployeeAutocomplete: React.FC<EmployeeAutocompleteProps> = ({
  value,
  onChange,
  employees,
  loading = false,
  disabled = false,
  label = 'Select Employee',
  placeholder = 'Search by name, code, email, or role...',
  error = false,
  helperText,
  required = false,
  size = 'medium',
  fullWidth = true,
  sx,
}) => {
  // Find currently selected employee
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === value) || null
  }, [employees, value])

  // Custom filter options supporting multi-token and typo-tolerant search
  const filterOptions = (options: EmployeeListItem[], state: { inputValue: string }) => {
    const query = state.inputValue.trim().toLowerCase()
    if (!query) return options

    const tokens = query.split(/\s+/).filter(Boolean)

    return options.filter((emp) => {
      const name = (emp.displayName || `${emp.firstName} ${emp.lastName}`).toLowerCase()
      const firstName = (emp.firstName || '').toLowerCase()
      const lastName = (emp.lastName || '').toLowerCase()
      const email = (emp.user?.email || '').toLowerCase()
      const codeStr = String(emp.employeeCode || '')
      const codeFormatted = `#${codeStr}`
      const codeEmp = `emp-${codeStr}`
      const codeEmpPadded = `emp-${codeStr.padStart(4, '0')}`
      const desig = (emp.designation?.name || '').toLowerCase()
      const team = (emp.team?.name || '').toLowerCase()

      const searchableText = `${name} ${email} ${codeStr} ${codeFormatted} ${codeEmp} ${codeEmpPadded} ${desig} ${team}`
      const searchableWords = [
        ...name.split(/\s+/),
        firstName,
        lastName,
        ...email.split(/[@.]+/),
        codeStr,
        ...desig.split(/\s+/),
        ...team.split(/\s+/),
      ].filter(Boolean)

      // Every token typed by HR must match at least one property
      return tokens.every((token) => {
        // Direct substring check
        if (searchableText.includes(token)) return true

        // Fuzzy match on individual words
        return searchableWords.some((word) => isFuzzyMatch(word, token))
      })
    })
  }

  return (
    <Autocomplete<EmployeeListItem, false, false, false>
      value={selectedEmployee}
      onChange={(_, newValue) => {
        onChange(newValue ? newValue.id : '', newValue)
      }}
      options={employees}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      sx={sx}
      size={size}
      filterOptions={filterOptions}
      getOptionLabel={(option) => {
        if (!option) return ''
        return `${option.displayName} (Code: #${option.employeeCode})`
      }}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      noOptionsText="No matching employees found"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const initials = option.displayName
          ? option.displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : 'E'

        return (
          <Box
            component="li"
            {...props}
            key={option.id}
            sx={{
              py: 1,
              px: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: '0.8125rem',
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {option.displayName}
                </Typography>
                <Chip
                  label={`#${option.employeeCode}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    borderRadius: 1,
                  }}
                />
                {!option.isActive && (
                  <Chip
                    label="Inactive"
                    size="small"
                    color="default"
                    sx={{ height: 18, fontSize: '0.625rem' }}
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                noWrap
                sx={{ fontSize: '0.75rem' }}
              >
                {option.designation?.name || 'Employee'}
                {option.team?.name ? ` • ${option.team.name}` : ''}
                {option.user?.email ? ` • ${option.user.email}` : ''}
              </Typography>
            </Box>
          </Box>
        )
      }}
    />
  )
}

export default EmployeeAutocomplete
