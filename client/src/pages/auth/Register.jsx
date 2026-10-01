import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { Spinner } from '../../components/common'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to InvoiceFlow 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-slate-900 dark:text-white">InvoiceFlow</span>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Create account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Start with 5 free invoices. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Full name *</label>
                <input type="text" required value={form.name} onChange={set('name')} className="input" placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="label">Business name</label>
                <input type="text" value={form.businessName} onChange={set('businessName')} className="input" placeholder="My Company" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Email address *</label>
              <input type="email" required value={form.email} onChange={set('email')} className="input" placeholder="you@company.com" />
            </div>
            <div className="form-group">
              <label className="label">Password *</label>
              <input type="password" required value={form.password} onChange={set('password')} className="input" placeholder="Min. 6 characters" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <Spinner size="sm" /> : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            By registering you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
