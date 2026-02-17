import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  defaultSort?: keyof T | string
  defaultDir?: 'asc' | 'desc'
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

function getCellValue<T>(row: T, key: keyof T | string): unknown {
  if (typeof key === 'string' && key.includes('.')) {
    return key.split('.').reduce((acc: unknown, k) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[k]
      }
      return undefined
    }, row)
  }
  return (row as Record<string, unknown>)[key as string]
}

export function DataTable<T extends object>({
  columns,
  data,
  defaultSort,
  defaultDir = 'desc',
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>((defaultSort as string) || null)
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSort ? defaultDir : null)
  const [page, setPage] = useState(1)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => {
        if (prev === 'asc') return 'desc'
        if (prev === 'desc') return null
        return 'asc'
      })
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0
    const aVal = getCellValue(a, sortKey)
    const bVal = getCellValue(b, sortKey)
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    const cmp = aStr < bStr ? -1 : aStr > bStr ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey || !sortDir) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />
    }
    if (sortDir === 'asc') {
      return <ChevronUp className="w-3.5 h-3.5 text-green-600" />
    }
    return <ChevronDown className="w-3.5 h-3.5 text-green-600" />
  }

  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-50 last:border-0">
              {columns.map((_, ci) => (
                <div key={ci} className="h-4 bg-slate-100 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-slate-100">
              {columns.map(col => (
                <TableHead
                  key={String(col.key)}
                  className={cn(
                    'text-xs font-semibold text-slate-500 uppercase tracking-wide h-10',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700 transition-colors'
                  )}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      col.align === 'right' && 'justify-end',
                      col.align === 'center' && 'justify-center'
                    )}
                  >
                    {col.label}
                    {col.sortable && <SortIcon colKey={String(col.key)} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="border-slate-100 hover:bg-green-50/30 transition-colors"
                >
                  {columns.map(col => {
                    const rawValue = getCellValue(row, col.key)
                    return (
                      <TableCell
                        key={String(col.key)}
                        className={cn(
                          'py-3 text-sm text-slate-700',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center'
                        )}
                      >
                        {col.render
                          ? col.render(rawValue, row)
                          : rawValue != null
                          ? String(rawValue)
                          : '—'}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-xs text-slate-400">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of{' '}
            {sorted.length} rows
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-8 h-8 text-xs rounded-lg font-medium transition-all',
                    page === pageNum
                      ? 'bg-green-500 text-white shadow-sm shadow-green-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border-slate-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
