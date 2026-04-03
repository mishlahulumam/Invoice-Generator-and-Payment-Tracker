import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Download, Send, CheckCircle, Edit,
  Copy, Trash2, QrCode, X, Calendar, User
} from 'lucide-react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { invoicesApi, clientsApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatCurrency, formatDate, getStatusBadgeClass, getStatusLabel } from '../utils/format'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payMethod, setPayMethod] = useState('transfer')

  const fetchInvoice = async () => {
    try {
      const res = await invoicesApi.get(id)
      setInvoice(res.data)
      if (res.data.client_id) {
        const clientRes = await clientsApi.get(res.data.client_id)
        setClient(clientRes.data)
      }
    } catch {
      toast.error('Invoice tidak ditemukan')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoice() }, [id])

  const handleSend = async () => {
    setActionLoading('send')
    try {
      const res = await invoicesApi.send(id)
      toast.success(res.data.email_sent ? 'Invoice terkirim via email!' : 'Invoice ditandai terkirim')
      fetchInvoice()
    } catch {
      toast.error('Gagal mengirim invoice')
    } finally {
      setActionLoading('')
    }
  }

  const handlePay = async () => {
    setActionLoading('pay')
    try {
      await invoicesApi.pay(id, { payment_date: payDate, payment_method: payMethod })
      toast.success('Invoice ditandai lunas!')
      setShowPayModal(false)
      fetchInvoice()
    } catch {
      toast.error('Gagal menandai lunas')
    } finally {
      setActionLoading('')
    }
  }

  const handleDownloadPdf = async () => {
    setActionLoading('pdf')
    try {
      const res = await invoicesApi.getPdf(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Invoice_${invoice.invoice_number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh PDF')
    } finally {
      setActionLoading('')
    }
  }

  const handleShowQR = async () => {
    setActionLoading('qr')
    try {
      const res = await invoicesApi.getQr(id)
      setQrData(res.data)
      setShowQR(true)
    } catch {
      toast.error('Gagal generate QR code')
    } finally {
      setActionLoading('')
    }
  }

  const handleDuplicate = async () => {
    setActionLoading('dup')
    try {
      const res = await invoicesApi.duplicate(id)
      toast.success('Invoice berhasil diduplikasi')
      navigate(`/invoices/${res.data.id}`)
    } catch {
      toast.error('Gagal menduplikasi invoice')
    } finally {
      setActionLoading('')
    }
  }

  const handleDelete = async () => {
    try {
      await invoicesApi.delete(id)
      toast.success('Invoice berhasil dihapus')
      navigate('/invoices')
    } catch {
      toast.error('Gagal menghapus invoice')
    }
  }

  const handleSimulatePayment = async () => {
    setShowQR(false)
    setShowPayModal(true)
  }

  if (loading) return <LoadingSpinner className="h-64" />

  const canEdit = ['draft'].includes(invoice.status)
  const canSend = ['draft'].includes(invoice.status)
  const canPay = ['sent', 'overdue'].includes(invoice.status)
  const canDelete = ['draft', 'cancelled'].includes(invoice.status)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleDownloadPdf} disabled={!!actionLoading} className="btn-secondary text-sm">
            <Download className="w-4 h-4" />
            {actionLoading === 'pdf' ? 'Mengunduh...' : 'PDF'}
          </button>
          <button onClick={handleShowQR} disabled={!!actionLoading} className="btn-secondary text-sm">
            <QrCode className="w-4 h-4" />
            QRIS
          </button>
          <button onClick={handleDuplicate} disabled={!!actionLoading} className="btn-secondary text-sm">
            <Copy className="w-4 h-4" /> Duplikasi
          </button>
          {canEdit && (
            <Link to={`/invoices/${id}/edit`} className="btn-secondary text-sm">
              <Edit className="w-4 h-4" /> Edit
            </Link>
          )}
          {canSend && (
            <button onClick={handleSend} disabled={!!actionLoading} className="btn-primary text-sm">
              <Send className="w-4 h-4" />
              {actionLoading === 'send' ? 'Mengirim...' : 'Kirim'}
            </button>
          )}
          {canPay && (
            <button onClick={() => setShowPayModal(true)} className="text-sm inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
              <CheckCircle className="w-4 h-4" /> Tandai Lunas
            </button>
          )}
          {canDelete && (
            <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="card">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-700 to-blue-800 rounded-t-xl text-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-blue-200 text-lg mt-1">#{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                invoice.status === 'paid' ? 'bg-green-400 text-green-900' :
                invoice.status === 'overdue' ? 'bg-red-400 text-white' :
                invoice.status === 'sent' ? 'bg-blue-300 text-blue-900' :
                'bg-gray-300 text-gray-700'
              }`}>
                {getStatusLabel(invoice.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Tanggal</p>
              <p className="text-sm font-medium">{formatDate(invoice.issue_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Jatuh Tempo</p>
              <p className={`text-sm font-medium ${invoice.status === 'overdue' ? 'text-red-600' : ''}`}>
                {formatDate(invoice.due_date)}
              </p>
            </div>
            {client && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Tagihan Kepada</p>
                <p className="text-sm font-medium">{client.name}</p>
                {client.email && <p className="text-xs text-gray-500">{client.email}</p>}
                {client.address && <p className="text-xs text-gray-500">{client.address}</p>}
              </div>
            )}
          </div>

          {/* Items table */}
          <div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Deskripsi</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Harga</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map(item => (
                  <tr key={item.id}>
                    <td className="py-3 px-3 text-sm">{item.description}</td>
                    <td className="py-3 px-3 text-sm text-center">{item.quantity}</td>
                    <td className="py-3 px-3 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 px-3 text-sm text-right font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {parseFloat(invoice.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Diskon ({invoice.discount}%)</span>
                  <span className="text-red-500">- {formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              {parseFloat(invoice.tax_rate) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">PPN ({invoice.tax_rate}%)</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-200">
                <span>Total</span>
                <span className="text-blue-600 text-lg">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              {invoice.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Catatan</p>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Syarat & Ketentuan</p>
                  <p className="text-sm text-gray-600">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment info */}
          {invoice.payment && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                <CheckCircle className="w-4 h-4" /> Pembayaran Diterima
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Tanggal</p>
                  <p className="font-medium">{formatDate(invoice.payment.payment_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Metode</p>
                  <p className="font-medium capitalize">{invoice.payment.payment_method}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Jumlah</p>
                  <p className="font-medium">{formatCurrency(invoice.payment.amount)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QRIS Modal */}
      {showQR && qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Pembayaran QRIS</h3>
              <button onClick={() => setShowQR(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Scan QR code untuk membayar</p>
              <div className="flex justify-center p-4 bg-gray-50 rounded-xl mb-3">
                <img src={qrData.qr_code} alt="QRIS QR Code" className="w-48 h-48" />
              </div>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(qrData.amount)}</p>
              <p className="text-xs text-gray-400 mt-1">Ref: {qrData.invoice_number}</p>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center mb-3">Simulasi: klik tombol di bawah untuk menandai pembayaran</p>
              <button
                onClick={handleSimulatePayment}
                className="w-full text-sm inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Simulasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Konfirmasi Pembayaran</h3>
              <button onClick={() => setShowPayModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Tanggal Pembayaran</label>
                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Metode Pembayaran</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="input">
                  <option value="transfer">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                  <option value="cash">Tunai</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Jumlah yang diterima</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(invoice.total)}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPayModal(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={handlePay}
                disabled={!!actionLoading}
                className="flex-1 justify-center text-sm inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                {actionLoading === 'pay' ? 'Menyimpan...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDelete}
        title="Hapus Invoice"
        message="Apakah Anda yakin ingin menghapus invoice ini?"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
