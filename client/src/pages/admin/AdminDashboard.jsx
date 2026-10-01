import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { PageLoader, StatCard } from '../../components/common'
import { formatCurrency, MONTHS } from '../../utils/helpers'
import { UsersIcon, CurrencyDollarIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setData(r.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const { users, invoices, mrr, monthlySignups, monthlyRevenue } = data || {}

  const signupChart = (() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const found = monthlySignups?.find(m => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1)
      return { month: MONTHS[d.getMonth()], signups: found?.count || 0 }
    })
  })()

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Platform-wide metrics and analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users?.total || 0} sub={`${users?.active || 0} active`} icon={UsersIcon} color="brand" />
        <StatCard label="Pro Users" value={users?.pro || 0} sub={`${users?.enterprise || 0} enterprise`} icon={ChartBarIcon} color="amber" />
        <StatCard label="Total Invoices" value={invoices?.total || 0} sub={`${invoices?.paid || 0} paid`} icon={DocumentTextIcon} color="green" />
        <StatCard label="Est. MRR" value={formatCurrency(mrr || 0)} sub="Monthly recurring" icon={CurrencyDollarIcon} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900 dark:text-white mb-6">Monthly Signups</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={signupChart} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Bar dataKey="signups" name="New Users" fill="#5a6ef3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900 dark:text-white mb-4">Plan Distribution</h2>
          <div className="space-y-4 mt-6">
            {[
              { label: 'Free', count: (users?.total || 0) - (users?.pro || 0) - (users?.enterprise || 0), color: 'bg-slate-400' },
              { label: 'Pro', count: users?.pro || 0, color: 'bg-brand-500' },
              { label: 'Enterprise', count: users?.enterprise || 0, color: 'bg-amber-500' },
            ].map(p => (
              <div key={p.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{p.label}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{p.count} users</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full transition-all`}
                    style={{ width: `${users?.total ? (p.count / users.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
