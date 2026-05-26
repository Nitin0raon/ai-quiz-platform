/** Format seconds → "4m 32s" */
export const formatTime = (seconds) => {
  if (!seconds) return '0s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

/** Format bytes → "2.4 MB" */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** "2024-01-15T10:30:00Z" → "Jan 15, 2024" */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/** Accuracy number → color class */
export const accuracyColor = (pct) => {
  if (pct >= 80) return 'text-green-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-500'
}

/** Accuracy number → bg color */
export const accuracyBg = (pct) => {
  if (pct >= 80) return 'bg-green-100 text-green-700'
  if (pct >= 60) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

/** Extract readable error message from Axios error */
export const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message ||
    'Something went wrong.'
  )
}
