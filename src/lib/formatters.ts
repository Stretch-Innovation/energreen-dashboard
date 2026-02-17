/**
 * Format a number as Euro currency: "€12,345"
 */
export function formatCurrency(value: number | null | undefined, decimals = 0): string {
  if (value == null || isNaN(value)) return '€0'
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a number with thousand separators: "12,345"
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null || isNaN(value)) return '0'
  return new Intl.NumberFormat('nl-BE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a number as percentage: "45.2%"
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return '0%'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a number in compact notation: "12.3K", "1.2M"
 * No currency prefix — use formatCurrency for monetary compact values.
 */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0'
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toString()
}
