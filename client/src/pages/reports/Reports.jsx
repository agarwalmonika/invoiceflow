import { useEffect, useState } from 'react'
import { invoiceAPI } from '../../services/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PageLoader, StatCard } from '../../components/common'
import { formatCurrency, buildMonthlyChart } from '../../utils/helpers'
import { CurrencyDollarIcon, DocumentTextIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invoiceAPI.getStats()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const { summary, monthlyData } = data || {}
  const chartData = buildMonthlyChart(monthlyData)

  const pieData = [
    { name: 'Paid',    value: summary?.paid?.count || 0 },
    { name: 'Pending', value: summary?.pending?.count || 0 },
    { name: 'Overdue', value: summary?.overdue?.count || 0 },
  ].filter(d => d.value > 0)

  const collectionRate = summary?.total
    ? ((summary.paid.count / summary.total) * 100).toFixed(1)
    : 0

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Financial overview of your invoicing activity</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(summary?.totalRevenue)} icon={CurrencyDollarIcon} color="green" />
        <StatCard label="Invoices Issued" value={summary?.total || 0} icon={DocumentTextIcon} color="brand" />
        <StatCard label="Collection Rate" value={`${collectionRate}%`} icon={ClockIcon} color="amber" />
        <StatCard label="Overdue Amount" value={formatCurrency(summary?.overdue?.amount)} icon={ExclamationTriangleIcon} color="red" />
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-slate-900 dark:text-white mb-6">Monthly Revenue</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5a6ef3" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#5a6ef3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#5a6ef3" strokeWidth={2.5} fill="url(#grad1)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice volume */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900 dark:text-white mb-6">Invoice Volume</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Bar dataKey="invoices" name="Invoices" fill="#5a6ef3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900 dark:text-white mb-4">Invoice Breakdown</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">No data yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <div className="flex-1 flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{d.name}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-display font-bold text-slate-900 dark:text-white">Financial Summary</h2>
        </div>
        <table className="table">
          <thead><tr><th>Category</th><th>Count</th><th>Amount</th><th>Share</th></tr></thead>
          <tbody>
            {[
              { label: 'Paid Invoices', count: summary?.paid?.count || 0, amount: summary?.paid?.amount || 0, color: 'text-emerald-600' },
              { label: 'Pending Invoices', count: summary?.pending?.count || 0, amount: summary?.pending?.amount || 0, color: 'text-amber-500' },
              { label: 'Overdue Invoices', count: summary?.overdue?.count || 0, amount: summary?.overdue?.amount || 0, color: 'text-red-500' },
            ].map(row => (
              <tr key={row.label}>
                <td className={`font-medium ${row.color}`}>{row.label}</td>
                <td>{row.count}</td>
                <td className="font-semibold">{formatCurrency(row.amount)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[100px]">
                      <div className={`h-full rounded-full ${row.color.replace('text-', 'bg-')}`}
                        style={{ width: `${summary?.total ? (row.count / summary.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">
                      {summary?.total ? ((row.count / summary.total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 dark:bg-surface-900">
              <td className="font-bold text-slate-900 dark:text-white">Total</td>
              <td className="font-bold">{summary?.total || 0}</td>
              <td className="font-bold">{formatCurrency((summary?.paid?.amount || 0) + (summary?.pending?.amount || 0) + (summary?.overdue?.amount || 0))}</td>
              <td className="text-slate-400">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
