import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FileText, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import useAuthStore from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.register(data)
      setAuth(res.data.access_token, res.data.user)
      toast.success('Akun berhasil dibuat!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">InvoiceApp</h1>
          <p className="text-gray-500 text-sm mt-1">Buat akun baru</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nama Bisnis</label>
              <input
                type="text"
                className="input"
                placeholder="PT. Contoh Jaya"
                {...register('business_name')}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="nama@email.com"
                {...register('email', { required: 'Email wajib diisi' })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min. 8 karakter"
                  {...register('password', {
                    required: 'Password wajib diisi',
                    minLength: { value: 6, message: 'Minimal 6 karakter' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Alamat Bisnis</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="Jl. Contoh No. 1, Jakarta"
                {...register('business_address')}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Mendaftar...' : 'Daftar'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
