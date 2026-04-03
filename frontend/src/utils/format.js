export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatDateInput = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

export const getStatusBadgeClass = (status) => {
  const map = {
    draft: 'badge-draft',
    sent: 'badge-sent',
    paid: 'badge-paid',
    overdue: 'badge-overdue',
    cancelled: 'badge-cancelled',
  }
  return map[status] || 'badge-draft'
}

export const getStatusLabel = (status) => {
  const map = {
    draft: 'Draft',
    sent: 'Terkirim',
    paid: 'Lunas',
    overdue: 'Jatuh Tempo',
    cancelled: 'Dibatalkan',
  }
  return map[status] || status
}
