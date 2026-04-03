import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { clientsApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'
import ClientModal from '../components/ClientModal'

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const fetchClients = async () => {
    try {
      const res = await clientsApi.list()
      setClients(res.data)
    } catch {
      toast.error('Gagal memuat data klien')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  const handleSave = async (data) => {
    try {
      if (editingClient) {
        await clientsApi.update(editingClient.id, data)
        toast.success('Klien berhasil diperbarui')
      } else {
        await clientsApi.create(data)
        toast.success('Klien berhasil ditambahkan')
      }
      setShowModal(false)
      setEditingClient(null)
      fetchClients()
    } catch {
      toast.error('Gagal menyimpan klien')
    }
  }

  const handleDelete = async () => {
    try {
      await clientsApi.delete(deleteId)
      toast.success('Klien berhasil dihapus')
      setDeleteId(null)
      fetchClients()
    } catch {
      toast.error('Gagal menghapus klien')
    }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner className="h-64" />

  return (
    <div>
      <PageHeader
        title="Klien"
        subtitle={`${clients.length} klien terdaftar`}
        action={
          <button onClick={() => { setEditingClient(null); setShowModal(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Klien
          </button>
        }
      />

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari klien..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada klien"
            message="Tambahkan klien pertama Anda"
            action={
              <button onClick={() => { setEditingClient(null); setShowModal(true) }} className="btn-primary">
                <Plus className="w-4 h-4" /> Tambah Klien
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(client => (
              <div key={client.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-semibold text-sm">{client.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{client.name}</p>
                    <div className="flex items-center gap-4 mt-0.5">
                      {client.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                          <Mail className="w-3 h-3" /> {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => { setEditingClient(client); setShowModal(true) }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(client.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingClient(null) }}
        onSave={handleSave}
        client={editingClient}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Hapus Klien"
        message="Apakah Anda yakin ingin menghapus klien ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
