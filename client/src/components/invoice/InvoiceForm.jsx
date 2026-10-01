import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientAPI, invoiceAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Spinner } from '../common'
import { CURRENCIES, formatCurrency } from '../../utils/helpers'

const emptyItem = { description: '', quantity: 1, rate: 0, taxRate: 0 }

export default function InvoiceForm({ initial, onSave, submitLabel = 'Create Invoice' }) {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    clientId: '',
    items: [{ ...emptyItem }],
    discount: 0,
    notes: '',
    terms: 'Payment is due within 30 days of invoice date.',
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    currency: 'USD',
    template: 'modern',
    ...initial,
    dueDate: initial?.dueDate
      ? new Date(initial.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  })

  useEffect(() => {
    clientAPI.getAll({ limit: 100 }).then(r => setClients(r.data.clients)).catch(() => {})
  }, [])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setItem = (i, k, v) => {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [k]: v }
      return { ...f, items }
    })
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  const subtotal = form.items.reduce((s, it) => s + (Number(it.quantity) * Number(it.rate)), 0)
  const tax = form.items.reduce((s, it) => s + (Number(it.quantity) * Number(it.rate) * (Number(it.taxRate) / 100)), 0)
  const total = subtotal + tax - Number(form.discount || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientId) { toast.error('Please select a client'); return }
    if (form.items.some(it => !it.description)) { toast.error('All items need a description'); return }
    setLoading(true)
    try {
      await onSave(form)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Date */}
          <div className="card p-6 space-y-4">
            <h3 className="font-display font-bold text-slate-800 dark:text-white">Invoice Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group sm:col-span-2">
                <label className="label">Client *</label>
                <select value={form.clientId} onChange={e => setField('clientId', e.target.value)} className="input" required>
                  <option value="">— Select client —</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No clients yet. <button type="button" onClick={() => navigate('/clients')} className="underline">Add a client first</button>
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="label">Due Date *</label>
                <input type="date" required value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Currency</label>
                <select value={form.currency} onChange={e => setField('currency', e.target.value)} className="input">
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Template</label>
                <select value={form.template} onChange={e => setField('template', e.target.value)} className="input">
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800 dark:text-white">Line Items</h3>
              <button type="button" onClick={addItem} className="btn-secondary btn-sm">
                <PlusIcon className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide w-[40%]">Description</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide w-[12%]">Qty</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide w-[18%]">Rate</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide w-[12%]">Tax %</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide w-[14%]">Amount</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {form.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 px-2">
                        <input
                          type="text" required
                          value={item.description}
                          onChange={e => setItem(i, 'description', e.target.value)}
                          placeholder="Service or product description"
                          className="input py-1.5 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number" min="0.01" step="0.01" required
                          value={item.quantity}
                          onChange={e => setItem(i, 'quantity', e.target.value)}
                          className="input py-1.5 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number" min="0" step="0.01" required
                          value={item.rate}
                          onChange={e => setItem(i, 'rate', e.target.value)}
                          placeholder="0.00"
                          className="input py-1.5 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number" min="0" max="100" step="0.1"
                          value={item.taxRate}
                          onChange={e => setItem(i, 'taxRate', e.target.value)}
                          className="input py-1.5 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatCurrency(Number(item.quantity) * Number(item.rate), form.currency)}
                      </td>
                      <td className="py-2 pl-2">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-6 space-y-4">
            <h3 className="font-display font-bold text-slate-800 dark:text-white">Notes & Terms</h3>
            <div className="form-group">
              <label className="label">Notes (optional)</label>
              <textarea rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)}
                className="input resize-none" placeholder="Thank you for your business!" />
            </div>
            <div className="form-group">
              <label className="label">Terms & Conditions</label>
              <textarea rows={2} value={form.terms} onChange={e => setField('terms', e.target.value)}
                className="input resize-none" placeholder="Payment is due within 30 days." />
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="card p-6 space-y-3 sticky top-4">
            <h3 className="font-display font-bold text-slate-800 dark:text-white">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, form.currency)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(tax, form.currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-center gap-2 text-slate-500">
                <span>Discount</span>
                <input
                  type="number" min="0" step="0.01"
                  value={form.discount}
                  onChange={e => setField('discount', e.target.value)}
                  className="input py-1 text-sm w-28 text-right"
                />
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
              <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white">
                <span>Total</span>
                <span>{formatCurrency(total, form.currency)}</span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? <Spinner size="sm" /> : submitLabel}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary w-full justify-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
