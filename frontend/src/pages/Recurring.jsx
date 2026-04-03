import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Pause, Play, Trash2, Calendar, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { recurringApi, clientsApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatDate } from '../utils/format'

const FREQ_LABELS = { weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' }
const FREQ_COLORS = { weekly: 'bg-purple-100 text-purple-700', monthly: 'bg-blue-100 text-blue-700', yearly: 'bg-green-100 text-green-700' }

function RecurringModal({ isOpen, onClose, onSave, clients }) {
  const [form, setForm] = useState({
    name: '', client_id: '', frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0], end_date: '',
    due_days: 14, notes: '', tax_rate: 11, discount: 0,
    items: [{ description: '', quantity: 1, unit_price: 0 }],
  })

  if (!isOpen) return null

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setForm({ ...form, items: newItems })
  }

  const handleSubmit = () => {
    if (!form.name) return toast.error('Nama wajib diisi')
    if (form.items.some(i => !i.description)) return toast.error('Deskripsi item wajib diisi')
    const payload = {
      name: form.name,
      client_id: form.client_id || null,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || null,
      base_invoice_data: {
        due_days: Number(form.due_days),
        notes: form.notes,
        tax_rate: Number(form.tax_rate),
        discount: Number(form.discount),
        items: form.items.map(i => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        })),
      },
    }
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Tambah Recurring Invoice</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Nama *</label>
            <input className="input" placeholder="Sewa Bulanan, Retainer, dsb." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Klien</label>
              <select className="input" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Pilih klien</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Frekuensi</label>
              <select className="input" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tanggal Mulai</label>
              <input type="date" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Tanggal Berakhir (opsional)</label>
              <input type="date" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Jatuh tempo (hari)</label>
              <input type="number" min="1" className="input" value={form.due_days} onChange={e => setForm({ ...form, due_days: e.target.value })} />
            </div>
            <div>
              <label className="label">Pajak PPN (%)</label>
              <input type="number" min="0" className="input" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} />
            </div>
            <div>
              <label className="label">Diskon (%)</label>
              <input type="number" min="0" className="input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Item Invoice</label>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input className="input flex-1" placeholder="Deskripsi" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} />
                  <input type="number" className="input w-16" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                  <input type="number" className="input w-28" placeholder="Harga" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })} className="p-2 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0 }] })} className="mt-2 btn-secondary text-sm">
              <Plus className="w-4 h-4" /> Tambah Item
            </button>
          </div>

          <div>
            <label className="label">Catatan</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Batal</button>
          <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">Simpan</button>
        </div>
      </div>
    </div>
  )
}

export default function Recurring() {
  const [recurring, setRecurring] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchData = async () => {
    try {
      const [recRes, clientsRes] = await Promise.all([recurringApi.list(), clientsApi.list()])
      setRecurring(recRes.data)
      setClients(clientsRes.data)
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (data) => {
    try {
      await recurringApi.create(data)
      toast.success('Recurring invoice berhasil ditambahkan')
      setShowModal(false)
      fetchData()
    } catch {
      toast.error('Gagal menyimpan')
    }
  }

  const handleToggle = async (id) => {
    try {
      const res = await recurringApi.togglePause(id)
      setRecurring(prev => prev.map(r => r.id === id ? res.data : r))
      toast.success(res.data.is_active ? 'Diaktifkan kembali' : 'Dijeda')
    } catch {
      toast.error('Gagal mengubah status')
    }
  }

  const handleDelete = async () => {
    try {
      await recurringApi.delete(deleteId)
      toast.success('Berhasil dihapus')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.name || '-'

  if (loading) return <LoadingSpinner className="h-64" />

  return (
    <div>
      <PageHeader
        title="Recurring Invoice"
        subtitle="Invoice yang dibuat otomatis secara terjadwal"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Recurring
          </button>
        }
      />

      {recurring.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={RefreshCw}
            title="Belum ada recurring invoice"
            message="Buat invoice yang otomatis dibuat ulang setiap periode"
            action={
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Tambah Recurring
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map(rec => (
            <div key={rec.id} className={`card p-5 ${!rec.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{rec.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLORS[rec.frequency]}`}>
                      {FREQ_LABELS[rec.frequency]}
                    </span>
                    {!rec.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Dijeda</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleToggle(rec.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                    {rec.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setDeleteId(rec.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-3.5 h-3.5" />
                  <span>{getClientName(rec.client_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Run berikutnya: <span className="font-medium text-gray-700">{formatDate(rec.next_run_date)}</span></span>
                </div>
                {rec.end_date && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Berakhir: {formatDate(rec.end_date)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RecurringModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} clients={clients} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Hapus Recurring Invoice"
        message="Apakah Anda yakin ingin menghapus recurring invoice ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
