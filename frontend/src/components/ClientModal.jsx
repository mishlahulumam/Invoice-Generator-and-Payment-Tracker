import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'

export default function ClientModal({ isOpen, onClose, onSave, client }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (client) {
      reset(client)
    } else {
      reset({ name: '', email: '', phone: '', address: '', npwp: '' })
    }
  }, [client, reset, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{client ? 'Edit Klien' : 'Tambah Klien'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
          <div>
            <label className="label">Nama Klien *</label>
            <input
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="PT. Nama Klien"
              {...register('name', { required: 'Nama wajib diisi' })}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="klien@email.com" {...register('email')} />
          </div>
          <div>
            <label className="label">Nomor Telepon</label>
            <input className="input" placeholder="08xxxxxxxxxx" {...register('phone')} />
          </div>
          <div>
            <label className="label">Alamat</label>
            <textarea className="input resize-none" rows={2} placeholder="Jl. Contoh No. 1" {...register('address')} />
          </div>
          <div>
            <label className="label">NPWP</label>
            <input className="input" placeholder="xx.xxx.xxx.x-xxx.xxx" {...register('npwp')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Batal</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  )
}
