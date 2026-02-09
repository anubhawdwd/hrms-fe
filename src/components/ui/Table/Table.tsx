import {
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
 type SxProps,
  type Theme,
} from '@mui/material'
import type { ReactNode } from 'react'

interface TableProps {
  headers: ReactNode[]
  rows: ReactNode[][]
  sx?: SxProps<Theme>
}

const Table = ({ headers, rows, sx }: TableProps) => {
  return (
    <TableContainer component={Paper} sx={sx}>
      <MUITable size="small">
        <TableHead>
          <TableRow>
            {headers.map((header, index) => (
              <TableCell key={index}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </MUITable>
    </TableContainer>
  )
}

export default Table
