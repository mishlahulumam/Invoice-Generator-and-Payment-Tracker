import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { invoicesApi, clientsApi, templatesApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency } from '../utils/format'

export default function InvoiceForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [clients, setClients] = useState([])
  const [templates, setTemplates] = useState([])

  const today = new Date().toISOString().split('T')[0]
  const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      client_id: searchParams.get('client') || '',
      template_id: '',
      issue_date: today,
      due_date: defaultDue,
      discount: 0,
      tax_rate: 11,
      notes: '',
      terms: 'Pembayaran harap dilakukan sebelum tanggal jatuh tempo.',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const watchDiscount = watch('discount')
  const watchTax = watch('tax_rate')

  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
  }, 0)
  const discountAmount = subtotal * (Number(watchDiscount) || 0) / 100
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (Number(watchTax) || 0) / 100
  const total = afterDiscount + taxAmount

  useEffect(() => {
    const load = async () => {
      try {
        const [clientsRes, templatesRes] = await Promise.all([
          clientsApi.list(),
          templatesApi.list(),
        ])
        setClients(clientsRes.data)
        setTemplates(templatesRes.data)

        if (isEdit) {
          const invRes = await invoicesApi.get(id)
          const inv = invRes.data
          reset({
            client_id: inv.client_id || '',
            template_id: inv.template_id || '',
            issue_date: inv.issue_date,
            due_date: inv.due_date,
            discount: Number(inv.discount),
            tax_rate: Number(inv.tax_rate),
            notes: inv.notes || '',
            terms: inv.terms || '',
            items: inv.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: Number(item.unit_price),
            })),
          })
        }
      } catch {
        toast.error('Gagal memuat data')
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [id])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        client_id: data.client_id || null,
        template_id: data.template_id || null,
        discount: Number(data.discount),
        tax_rate: Number(data.tax_rate),
        items: data.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      }
      if (isEdit) {
        await invoicesApi.update(id, payload)
        toast.success('Invoice berhasil diperbarui')
        navigate(`/invoices/${id}`)
      } else {
        const res = await invoicesApi.create(payload)
        toast.success('Invoice berhasil dibuat')
        navigate(`/invoices/${res.data.id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan invoice')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) return <LoadingSpinner className="h-64" />

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Invoice' : 'Buat Invoice Baru'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4 text-gray-900">Informasi Invoice</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Klien</label>
              <select className="input" {...register('client_id')}>
                <option value="">Pilih klien (opsional)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Template</label>
              <select className="input" {...register('template_id')}>
                <option value="">Template default</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tanggal Invoice *</label>
              <input type="date" className={`input ${errors.issue_date ? 'input-error' : ''}`} {...register('issue_date', { required: true })} />
            </div>
            <div>
              <label className="label">Jatuh Tempo *</label>
              <input type="date" className={`input ${errors.due_date ? 'input-error' : ''}`} {...register('due_date', { required: true })} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4 text-gray-900">Item Invoice</h2>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <input
                      className={`input ${errors.items?.[index]?.description ? 'input-error' : ''}`}
                      placeholder="Deskripsi item"
                      {...register(`items.${index}.description`, { required: true })}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      placeholder="Qty"
                      {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="input"
                      placeholder="Harga satuan"
                      {...register(`items.${index}.unit_price`, { required: true, min: 0 })}
                    />
                  </div>
                </div>
                <div className="pt-2 text-right min-w-[80px] text-sm font-medium text-gray-700">
                  {formatCurrency((Number(watchedItems[index]?.quantity) || 0) * (Number(watchedItems[index]?.unit_price) || 0))}
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="p-2 text-gray-400 hover:text-red-500 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
            className="mt-3 btn-secondary text-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Item
          </button>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Catatan</h2>
            <div>
              <label className="label">Catatan</label>
              <textarea className="input resize-none" rows={3} placeholder="Catatan tambahan..." {...register('notes')} />
            </div>
            <div>
              <label className="label">Syarat & Ketentuan</label>
              <textarea className="input resize-none" rows={3} {...register('terms')} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-4 text-gray-900">Ringkasan</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Diskon (%)</label>
                <input type="number" min="0" max="100" step="0.01" className="input" {...register('discount')} />
              </div>
              <div>
                <label className="label">Pajak PPN (%)</label>
                <input type="number" min="0" max="100" step="0.01" className="input" {...register('tax_rate')} />
              </div>
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Diskon</span>
                    <span className="text-red-500">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">PPN</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="w-4 h-4" />
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
