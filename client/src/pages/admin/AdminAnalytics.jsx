import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PageLoader } from '../../components/common'
import { formatCurrency, MONTHS } from '../../utils/helpers'

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setData(r.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const now = new Date()
  const combined = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const signup = data?.monthlySignups?.find(m => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1)
    const rev = data?.monthlyRevenue?.find(m => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1)
    return {
      month: MONTHS[d.getMonth()],
      signups: signup?.count || 0,
      revenue: rev?.total || 0,
    }
  })

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Platform Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Growth metrics and revenue insights</p>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-bold text-slate-900 dark:text-white mb-6">Signups vs Revenue (6 months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combined}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="signups" name="New Users" stroke="#5a6ef3" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900 dark:text-white mb-6">Monthly Signups</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={combined} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
              <Bar dataKey="signups" name="Signups" fill="#5a6ef3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900 dark:text-white mb-4">Key Metrics</h2>
          <div className="space-y-4 mt-2">
            {[
              { label: 'Total Users', value: data?.users?.total || 0, fmt: v => v },
              { label: 'Active Users', value: data?.users?.active || 0, fmt: v => v },
              { label: 'Pro Subscribers', value: data?.users?.pro || 0, fmt: v => v },
              { label: 'Enterprise Users', value: data?.users?.enterprise || 0, fmt: v => v },
              { label: 'Estimated MRR', value: data?.mrr || 0, fmt: formatCurrency },
              { label: 'Total Invoices', value: data?.invoices?.total || 0, fmt: v => v },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">{m.label}</span>
                <span className="font-bold text-slate-900 dark:text-white">{m.fmt(m.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
