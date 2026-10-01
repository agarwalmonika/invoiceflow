import { useEffect, useState, useCallback } from 'react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { PageLoader, SearchInput, StatusBadge, Pagination } from '../../components/common'
import { formatDate } from '../../utils/helpers'

const PLANS = ['', 'free', 'pro', 'enterprise']

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getUsers({ search, plan, page, limit: 20 })
      setUsers(res.data.users)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [search, plan, page])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const handleToggle = async (id) => {
    try {
      const res = await adminAPI.toggleUser(id)
      toast.success(res.data.message)
      load()
    } catch { toast.error('Failed to update user') }
  }

  const handlePlan = async (id, newPlan) => {
    try {
      await adminAPI.updateUserPlan(id, newPlan)
      toast.success('Plan updated')
      load()
    } catch { toast.error('Failed to update plan') }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total users</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
        <select value={plan} onChange={e => setPlan(e.target.value)} className="input max-w-[160px]">
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Invoices</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-400 py-8">No users found</td></tr>
                )}
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 text-xs font-bold shrink-0">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={u.subscriptionPlan}
                        onChange={e => handlePlan(u._id, e.target.value)}
                        className="input py-1 text-xs w-auto max-w-[110px]"
                        onClick={e => e.stopPropagation()}
                      >
                        {PLANS.filter(Boolean).map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                      </select>
                    </td>
                    <td className="font-mono text-sm">{u.invoiceCount}</td>
                    <td className="text-xs text-slate-400">{formatDate(u.createdAt, 'MMM d, yyyy')}</td>
                    <td className="text-xs text-slate-400">{u.lastLogin ? formatDate(u.lastLogin, 'MMM d') : '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-paid' : 'badge-draft'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggle(u._id)}
                          className={`btn-sm ${u.isActive ? 'btn-ghost text-red-500 hover:bg-red-50' : 'btn-ghost text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {u.role === 'admin' && <span className="text-xs text-slate-400 font-medium">Admin</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onPage={setPage} />
        </>
      )}
    </div>
  )
}
