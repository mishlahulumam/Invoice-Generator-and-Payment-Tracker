import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, FileText, AlertTriangle, DollarSign, Plus, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { dashboardApi, invoicesApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency, getStatusLabel } from '../utils/format'
import useAuthStore from '../store/authStore'

const PIE_COLORS = {
  draft: '#9CA3AF',
  sent: '#3B82F6',
  paid: '#10B981',
  overdue: '#EF4444',
  cancelled: '#F59E0B',
}

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color ? 'bg-current/10' : 'bg-blue-50'}`}
          style={{ backgroundColor: color ? undefined : undefined }}>
          <Icon className={`w-5 h-5 ${color || 'text-blue-600'}`} />
        </div>
      </div>
    </div>
  )
}

const formatYAxis = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
  return value
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        <p className="text-blue-600 font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [summary, setSummary] = useState(null)
  const [chartData, setChartData] = useState([])
  const [statsData, setStatsData] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [summaryRes, chartRes, statsRes, invoicesRes] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.revenueChart(),
          dashboardApi.invoiceStats(),
          invoicesApi.list(),
        ])
        setSummary(summaryRes.data)
        setChartData(chartRes.data)
        const stats = statsRes.data
        setStatsData(
          Object.entries(stats)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => ({ name: getStatusLabel(status), value: count, color: PIE_COLORS[status] }))
        )
        setRecentInvoices(invoicesRes.data.slice(0, 5))
      } catch {
        toast.error('Gagal memuat dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  if (loading) return <LoadingSpinner className="h-64" />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.business_name || 'Pengguna'}!</h1>
          <p className="text-sm text-gray-500 mt-1">Berikut ringkasan bisnis Anda</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Buat Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(summary?.total_revenue || 0)}
          color="text-green-600"
          subtitle="Semua waktu"
        />
        <StatCard
          icon={TrendingUp}
          label="Bulan Ini"
          value={formatCurrency(summary?.this_month_revenue || 0)}
          color="text-blue-600"
        />
        <StatCard
          icon={FileText}
          label="Outstanding"
          value={formatCurrency(summary?.total_outstanding || 0)}
          color="text-orange-500"
          subtitle="Belum dibayar"
        />
        <StatCard
          icon={AlertTriangle}
          label="Jatuh Tempo"
          value={summary?.overdue_count || 0}
          color="text-red-600"
          subtitle="invoice"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue 12 Bulan Terakhir</h3>
          {chartData.every(d => d.revenue === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Belum ada data revenue</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Status Invoice</h3>
          {statsData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Belum ada invoice</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={false}>
                  {statsData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} invoice`, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b">
          <h3 className="font-semibold text-gray-900">Invoice Terbaru</h3>
          <Link to="/invoices" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Belum ada invoice</p>
            <Link to="/invoices/new" className="btn-primary mt-3 text-sm">
              <Plus className="w-4 h-4" /> Buat Invoice Pertama
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentInvoices.map(inv => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{inv.invoice_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(inv.created_at).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`hidden sm:block text-sm font-semibold`}>{formatCurrency(inv.total)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getStatusLabel(inv.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
