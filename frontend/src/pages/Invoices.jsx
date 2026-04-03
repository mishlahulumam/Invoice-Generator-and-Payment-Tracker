import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FileText, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { invoicesApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatCurrency, formatDate, getStatusBadgeClass, getStatusLabel } from '../utils/format'

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'paid', label: 'Lunas' },
  { value: 'overdue', label: 'Jatuh Tempo' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

export default function Invoices() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const fetchInvoices = async () => {
    try {
      const res = await invoicesApi.list(statusFilter || undefined)
      setInvoices(res.data)
    } catch {
      toast.error('Gagal memuat invoice')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoices() }, [statusFilter])

  const handleDelete = async () => {
    try {
      await invoicesApi.delete(deleteId)
      toast.success('Invoice berhasil dihapus')
      setDeleteId(null)
      fetchInvoices()
    } catch {
      toast.error('Gagal menghapus invoice')
    }
  }

  const filtered = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner className="h-64" />

  return (
    <div>
      <PageHeader
        title="Invoice"
        subtitle={`${invoices.length} invoice`}
        action={
          <Link to="/invoices/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Buat Invoice
          </Link>
        }
      />

      <div className="card">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor invoice..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input"
            >
              {STATUS_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada invoice"
            message={statusFilter ? `Tidak ada invoice dengan status "${getStatusLabel(statusFilter)}"` : 'Buat invoice pertama Anda'}
            action={
              !statusFilter && (
                <Link to="/invoices/new" className="btn-primary">
                  <Plus className="w-4 h-4" /> Buat Invoice
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Klien</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Jatuh Tempo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <td className="px-4 py-3 font-medium text-sm text-blue-600">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {inv.client_id ? <span className="truncate">Klien</span> : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={getStatusBadgeClass(inv.status)}>{getStatusLabel(inv.status)}</span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {['draft', 'cancelled'].includes(inv.status) && (
                        <button
                          onClick={() => setDeleteId(inv.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Hapus Invoice"
        message="Apakah Anda yakin ingin menghapus invoice ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
