import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { CURRENCIES } from '../../utils/helpers'
import { Spinner } from '../../components/common'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    phone: user?.phone || '',
    currency: user?.currency || 'USD',
    address: { street: '', city: '', state: '', country: '', zipCode: '', ...user?.address },
  })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const handleProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await authAPI.updateProfile(profile)
      updateUser(res.data.user)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update profile') }
    finally { setSavingProfile(false) }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) { toast.error('Passwords do not match'); return }
    if (pw.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSavingPw(true)
    try {
      await authAPI.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      toast.success('Password changed!')
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password') }
    finally { setSavingPw(false) }
  }

  const setAddr = (k, v) => setProfile(p => ({ ...p, address: { ...p.address, [k]: v } }))

  return (
    <div className="animate-fade-in space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Profile & Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account and business details</p>
      </div>

      {/* Account info */}
      <div className="card p-2 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold">
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-display font-bold text-slate-900 dark:text-white text-lg">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <p className="text-xs text-brand-600 capitalize mt-0.5 font-medium">{user?.subscriptionPlan} plan · {user?.role}</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleProfile} className="card p-6 space-y-5">
        <h2 className="font-display font-bold text-slate-900 dark:text-white">Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Full Name</label>
            <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Business Name</label>
            <input type="text" value={profile.businessName} onChange={e => setProfile(p => ({ ...p, businessName: e.target.value }))} className="input" placeholder="Your Company" />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Default Currency</label>
            <select value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))} className="input">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Street Address</label>
            <input type="text" value={profile.address.street} onChange={e => setAddr('street', e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">City</label>
            <input type="text" value={profile.address.city} onChange={e => setAddr('city', e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">State / Province</label>
            <input type="text" value={profile.address.state} onChange={e => setAddr('state', e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">ZIP / Postal Code</label>
            <input type="text" value={profile.address.zipCode} onChange={e => setAddr('zipCode', e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Country</label>
            <input type="text" value={profile.address.country} onChange={e => setAddr('country', e.target.value)} className="input" />
          </div>
        </div>
        <button type="submit" disabled={savingProfile} className="btn-primary">
          {savingProfile ? <Spinner size="sm" /> : 'Save Profile'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handlePassword} className="card p-6 space-y-4">
        <h2 className="font-display font-bold text-slate-900 dark:text-white">Change Password</h2>
        <div className="form-group">
          <label className="label">Current Password</label>
          <input type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} className="input" required />
        </div>
        <div className="form-group">
          <label className="label">New Password</label>
          <input type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} className="input" required minLength={6} />
        </div>
        <div className="form-group">
          <label className="label">Confirm New Password</label>
          <input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} className="input" required />
        </div>
        <button type="submit" disabled={savingPw} className="btn-primary">
          {savingPw ? <Spinner size="sm" /> : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
