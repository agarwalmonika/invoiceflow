import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  PlusIcon, UserGroupIcon, PencilIcon, TrashIcon,
  EyeIcon, BuildingOfficeIcon, EnvelopeIcon, PhoneIcon,
} from '@heroicons/react/24/outline'
import { PageLoader, EmptyState, SearchInput, ConfirmDialog, Modal } from '../../components/common'
import { formatCurrency } from '../../utils/helpers'

const emptyForm = { name: '', email: '', phone: '', company: '', address: { street: '', city: '', state: '', country: '', zipCode: '' }, notes: '' }

export default function ClientList() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientAPI.getAll({ search })
      setClients(res.data.clients)
    } catch { toast.error('Failed to load clients') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const openAdd = () => { setForm(emptyForm); setEditClient(null); setShowForm(true) }
  const openEdit = (c) => {
    setForm({ name: c.name, email: c.email, phone: c.phone || '', company: c.company || '', address: c.address || emptyForm.address, notes: c.notes || '' })
    setEditClient(c)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return }
    setSaving(true)
    try {
      if (editClient) {
        await clientAPI.update(editClient._id, form)
        toast.success('Client updated!')
      } else {
        await clientAPI.create(form)
        toast.success('Client added!')
      }
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save client')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await clientAPI.delete(deleteId)
      toast.success('Client removed')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete client') }
  }

  const setAddr = (k, v) => setForm(f => ({ ...f, address: { ...f.address, [k]: v } }))

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" /> Add Client</button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />

      {loading ? <PageLoader /> : clients.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title="No clients yet"
          description="Add your first client to start creating invoices."
          action={<button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" /> Add Client</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(c => (
            <div key={c._id} className="card-hover p-5 cursor-pointer" onClick={() => navigate(`/clients/${c._id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 font-bold text-sm">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate(`/clients/${c._id}`)} className="btn-ghost btn-sm p-1.5"><EyeIcon className="w-4 h-4" /></button>
                  <button onClick={() => openEdit(c)} className="btn-ghost btn-sm p-1.5"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(c._id)} className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{c.name}</h3>
              {c.company && (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <BuildingOfficeIcon className="w-3.5 h-3.5" />{c.company}
                </p>
              )}
              <div className="mt-3 space-y-1">
                <p className="text-xs text-slate-400 flex items-center gap-1"><EnvelopeIcon className="w-3.5 h-3.5" />{c.email}</p>
                {c.phone && <p className="text-xs text-slate-400 flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" />{c.phone}</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                <div>
                  <p className="text-slate-400">Total Invoiced</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(c.totalInvoiced)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Total Paid</p>
                  <p className="font-semibold text-emerald-600">{formatCurrency(c.totalPaid)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editClient ? 'Edit Client' : 'Add New Client'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Full Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Jane Smith" />
          </div>
          <div className="form-group">
            <label className="label">Company</label>
            <input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="input" placeholder="Acme Corp" />
          </div>
          <div className="form-group">
            <label className="label">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="client@company.com" />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+1 555 0100" />
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Street Address</label>
            <input type="text" value={form.address?.street || ''} onChange={e => setAddr('street', e.target.value)} className="input" placeholder="123 Main Street" />
          </div>
          <div className="form-group">
            <label className="label">City</label>
            <input type="text" value={form.address?.city || ''} onChange={e => setAddr('city', e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Country</label>
            <input type="text" value={form.address?.country || ''} onChange={e => setAddr('country', e.target.value)} className="input" />
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input resize-none" placeholder="Internal notes..." />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : editClient ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Remove Client" message="This client will be removed. Existing invoices will be preserved."
      />
    </div>
  )
}
