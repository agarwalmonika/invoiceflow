import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { Spinner } from '../../components/common'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => setForm({ email: 'jane@demo.com', password: 'demo123' })
  const fillAdmin = () => setForm({ email: 'admin@invoiceflow.com', password: 'admin123' })

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-white">InvoiceFlow</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Professional Invoicing<br />Made Simple
          </h1>
          <p className="text-brand-200 text-lg leading-relaxed">
            Create beautiful invoices, track payments, and grow your business with powerful financial insights.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { n: '50K+', l: 'Businesses' }, { n: '$2M+', l: 'Invoiced' }, { n: '99.9%', l: 'Uptime' }
          ].map(s => (
            <div key={s.l} className="bg-white/10 rounded-2xl p-4 text-center">
              <p className="font-display text-2xl font-bold text-white">{s.n}</p>
              <p className="text-brand-200 text-sm">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-slate-900 dark:text-white">InvoiceFlow</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">Sign in</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Welcome back. Enter your credentials to continue.</p>

          {/* Demo buttons */}
          <div className="flex gap-2 mb-6">
            <button onClick={fillDemo} type="button" className="btn-secondary flex-1 justify-center text-xs py-2">
              🧪 Demo User
            </button>
            <button onClick={fillAdmin} type="button" className="btn-secondary flex-1 justify-center text-xs py-2">
              🛡 Demo Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email address</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="you@company.com"
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
