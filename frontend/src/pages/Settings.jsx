import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, Check, Palette, User, Building } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi, templatesApi } from '../services/api'
import useAuthStore from '../store/authStore'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'

const THEME_COLORS = [
  { name: 'Biru', value: '#3B82F6', accent: '#1E40AF' },
  { name: 'Ungu', value: '#8B5CF6', accent: '#5B21B6' },
  { name: 'Hijau', value: '#10B981', accent: '#065F46' },
  { name: 'Merah', value: '#EF4444', accent: '#991B1B' },
  { name: 'Jingga', value: '#F97316', accent: '#9A3412' },
  { name: 'Teal', value: '#14B8A6', accent: '#0F766E' },
  { name: 'Slate', value: '#475569', accent: '#1E293B' },
  { name: 'Pink', value: '#EC4899', accent: '#9D174D' },
]

const LAYOUTS = [
  { value: 'classic', label: 'Classic', desc: 'Layout klasik dengan header besar' },
  { value: 'modern', label: 'Modern', desc: 'Layout bersih dan minimalis' },
  { value: 'compact', label: 'Compact', desc: 'Layout padat untuk banyak item' },
]

function TemplateModal({ isOpen, onClose, onSave, editTemplate }) {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(THEME_COLORS[0])
  const [layout, setLayout] = useState('classic')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name)
      setLayout(editTemplate.layout)
      setIsDefault(editTemplate.is_default)
      const found = THEME_COLORS.find(c => c.value === editTemplate.theme_color)
      setSelectedColor(found || THEME_COLORS[0])
    } else {
      setName('')
      setSelectedColor(THEME_COLORS[0])
      setLayout('classic')
      setIsDefault(false)
    }
  }, [editTemplate, isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!name) return toast.error('Nama template wajib diisi')
    onSave({
      name,
      theme_color: selectedColor.value,
      accent_color: selectedColor.accent,
      layout,
      is_default: isDefault,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{editTemplate ? 'Edit Template' : 'Buat Template'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="label">Nama Template *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Template Profesional" />
          </div>

          <div>
            <label className="label">Warna Tema</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {THEME_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color)}
                  className={`relative h-12 rounded-lg border-2 transition-all ${selectedColor.value === color.value ? 'border-gray-800 scale-105 shadow-md' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {selectedColor.value === color.value && (
                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Dipilih: {selectedColor.name}</p>
          </div>

          {/* Preview */}
          <div>
            <label className="label">Preview</label>
            <div className="rounded-lg overflow-hidden border border-gray-200" style={{ background: '#f9fafb' }}>
              <div className="p-3" style={{ backgroundColor: selectedColor.value }}>
                <p className="text-white font-bold text-sm">INVOICE #INV-2026-0001</p>
                <p className="text-white/70 text-xs">PT. Nama Bisnis Anda</p>
              </div>
              <div className="p-3 space-y-1">
                <div className="h-2 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="mx-3 mb-3 p-2 rounded text-right text-xs font-bold text-white" style={{ backgroundColor: selectedColor.accent }}>
                Total: Rp 1.000.000
              </div>
            </div>
          </div>

          <div>
            <label className="label">Layout</label>
            <div className="space-y-2">
              {LAYOUTS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLayout(l.value)}
                  className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition-colors text-left ${layout === l.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${layout === l.value ? 'border-blue-500' : 'border-gray-300'}`}>
                    {layout === l.value && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{l.label}</p>
                    <p className="text-xs text-gray-500">{l.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Jadikan template default</span>
          </label>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Batal</button>
          <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">Simpan</button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editTemplate, setEditTemplate] = useState(null)
  const [deleteTemplateId, setDeleteTemplateId] = useState(null)

  const { register, handleSubmit, reset } = useForm({ defaultValues: user || {} })

  useEffect(() => {
    reset(user || {})
  }, [user])

  useEffect(() => {
    templatesApi.list().then(res => setTemplates(res.data)).finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async (data) => {
    setProfileLoading(true)
    try {
      const res = await authApi.updateMe(data)
      updateUser(res.data)
      toast.success('Profil berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan profil')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSaveTemplate = async (data) => {
    try {
      if (editTemplate) {
        const res = await templatesApi.update(editTemplate.id, data)
        setTemplates(prev => prev.map(t => t.id === editTemplate.id ? res.data : t))
        toast.success('Template diperbarui')
      } else {
        const res = await templatesApi.create(data)
        setTemplates(prev => [...prev, res.data])
        toast.success('Template ditambahkan')
      }
      setShowTemplateModal(false)
      setEditTemplate(null)
    } catch {
      toast.error('Gagal menyimpan template')
    }
  }

  const handleDeleteTemplate = async () => {
    try {
      await templatesApi.delete(deleteTemplateId)
      setTemplates(prev => prev.filter(t => t.id !== deleteTemplateId))
      setDeleteTemplateId(null)
      toast.success('Template dihapus')
    } catch {
      toast.error('Gagal menghapus template')
    }
  }

  if (loading) return <LoadingSpinner className="h-64" />

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader title="Pengaturan" subtitle="Kelola profil bisnis dan template invoice" />

      {/* Business Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Profil Bisnis</h2>
            <p className="text-xs text-gray-500">Informasi yang akan muncul di invoice</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(handleSaveProfile)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Bisnis</label>
              <input className="input" placeholder="PT. Nama Bisnis" {...register('business_name')} />
            </div>
            <div>
              <label className="label">Nomor Telepon</label>
              <input className="input" placeholder="08xxxxxxxxxx" {...register('business_phone')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Alamat Bisnis</label>
              <textarea className="input resize-none" rows={2} placeholder="Jl. Contoh No. 1, Jakarta" {...register('business_address')} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>

      {/* Templates */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Template Invoice</h2>
              <p className="text-xs text-gray-500">Kustomisasi tampilan invoice Anda</p>
            </div>
          </div>
          <button onClick={() => { setEditTemplate(null); setShowTemplateModal(true) }} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Buat Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Palette className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Belum ada template. Buat template pertama Anda!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map(template => (
              <div key={template.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-12 relative" style={{ backgroundColor: template.theme_color }}>
                  {template.is_default && (
                    <span className="absolute top-2 right-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Default</span>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{template.layout}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditTemplate(template); setShowTemplateModal(true) }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTemplateId(template.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => { setShowTemplateModal(false); setEditTemplate(null) }}
        onSave={handleSaveTemplate}
        editTemplate={editTemplate}
      />

      <ConfirmDialog
        isOpen={!!deleteTemplateId}
        title="Hapus Template"
        message="Apakah Anda yakin ingin menghapus template ini?"
        onConfirm={handleDeleteTemplate}
        onCancel={() => setDeleteTemplateId(null)}
      />
    </div>
  )
}
