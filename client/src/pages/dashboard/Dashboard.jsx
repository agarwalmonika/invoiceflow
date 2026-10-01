import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { invoiceAPI } from '../../services/api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  DocumentTextIcon, CheckCircleIcon, ClockIcon,
  ExclamationTriangleIcon, PlusIcon, CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { StatCard, PageLoader, StatusBadge } from '../../components/common'
import { formatCurrency, formatDate, buildMonthlyChart } from '../../utils/helpers'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invoiceAPI.getStats()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const { summary, monthlyData, recentInvoices } = data || {}
  const chartData = buildMonthlyChart(monthlyData)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('/invoices/new')} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(summary?.totalRevenue)} icon={CurrencyDollarIcon} color="green" />
        <StatCard label="Total Invoices" value={summary?.total || 0} sub={`${summary?.paid?.count || 0} paid`} icon={DocumentTextIcon} color="brand" />
        <StatCard label="Pending" value={formatCurrency(summary?.pending?.amount)} sub={`${summary?.pending?.count || 0} invoices`} icon={ClockIcon} color="amber" />
        <StatCard label="Overdue" value={formatCurrency(summary?.overdue?.amount)} sub={`${summary?.overdue?.count || 0} invoices`} icon={ExclamationTriangleIcon} color="red" />
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-slate-900 dark:text-white">Revenue Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                {formatCurrency(chartData.reduce((s, d) => s + d.revenue, 0))}
              </p>
              <p className="text-xs text-emerald-500">Total collected</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a6ef3" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#5a6ef3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#5a6ef3" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats */}
        <div className="card p-6 flex flex-col gap-4">
          <h2 className="font-display font-bold text-slate-900 dark:text-white">Payment Health</h2>
          {[
            { label: 'Paid', count: summary?.paid?.count || 0, amount: summary?.paid?.amount || 0, color: 'bg-emerald-500' },
            { label: 'Pending', count: summary?.pending?.count || 0, amount: summary?.pending?.amount || 0, color: 'bg-amber-400' },
            { label: 'Overdue', count: summary?.overdue?.count || 0, amount: summary?.overdue?.amount || 0, color: 'bg-red-500' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${s.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{s.label}</span>
                  <span className="text-slate-500">{s.count} inv.</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`}
                    style={{ width: `${summary?.total ? (s.count / summary.total) * 100 : 0}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(s.amount)}</p>
              </div>
            </div>
          ))}

          {/* Plan info */}
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Invoices used</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {user?.invoiceCount || 0} / {user?.subscriptionPlan === 'free' ? 5 : user?.subscriptionPlan === 'pro' ? 100 : '∞'}
              </span>
            </div>
            <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all"
                style={{ width: `${Math.min((user?.invoiceCount / (user?.subscriptionPlan === 'free' ? 5 : 100)) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-slate-400 capitalize mt-1">{user?.subscriptionPlan} plan</p>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-display font-bold text-slate-900 dark:text-white">Recent Invoices</h2>
          <button onClick={() => navigate('/invoices')} className="btn-ghost btn-sm">View all →</button>
        </div>
        <div className="table-wrapper rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices?.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-400 py-8">No invoices yet. Create your first!</td></tr>
              )}
              {recentInvoices?.map(inv => (
                <tr key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)} className="cursor-pointer">
                  <td className="font-mono text-xs font-medium text-brand-600">{inv.invoiceNumber}</td>
                  <td className="font-medium">{inv.clientId?.name || '—'}</td>
                  <td className="font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                  <td className="text-slate-400">{formatDate(inv.dueDate)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
