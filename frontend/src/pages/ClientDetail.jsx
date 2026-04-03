import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Mail, Phone, MapPin, CreditCard, FileText, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { clientsApi, invoicesApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ClientModal from '../components/ClientModal'
import { formatCurrency, formatDate, getStatusBadgeClass, getStatusLabel } from '../utils/format'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  const fetchData = async () => {
    try {
      const [clientRes, invoicesRes] = await Promise.all([
        clientsApi.get(id),
        invoicesApi.list(),
      ])
      setClient(clientRes.data)
      setInvoices(invoicesRes.data.filter(inv => inv.client_id === id))
    } catch {
      toast.error('Gagal memuat data')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleSave = async (data) => {
    try {
      const res = await clientsApi.update(id, data)
      setClient(res.data)
      setShowEdit(false)
      toast.success('Klien berhasil diperbarui')
    } catch {
      toast.error('Gagal memperbarui klien')
    }
  }

  if (loading) return <LoadingSpinner className="h-64" />

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total), 0)

  const outstanding = invoices
    .filter(inv => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + parseFloat(inv.total), 0)

  return (
    <div>
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Klien
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-bold text-xl">{client.name.charAt(0).toUpperCase()}</span>
              </div>
              <button onClick={() => setShowEdit(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
            <div className="mt-4 space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" /> {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" /> {client.phone}
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" /> {client.address}
                </div>
              )}
              {client.npwp && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 text-gray-400" /> {client.npwp}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Total Lunas</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{formatCurrency(outstanding)}</p>
              <p className="text-xs text-gray-500 mt-1">Outstanding</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Riwayat Invoice ({invoices.length})</h3>
              <Link to={`/invoices/new?client=${id}`} className="btn-primary text-sm px-3 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Buat Invoice
              </Link>
            </div>
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">Belum ada invoice</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Jatuh tempo: {formatDate(inv.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(inv.total)}</p>
                      <span className={`mt-1 ${getStatusBadgeClass(inv.status)}`}>{getStatusLabel(inv.status)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ClientModal isOpen={showEdit} onClose={() => setShowEdit(false)} onSave={handleSave} client={client} />
    </div>
  )
}
