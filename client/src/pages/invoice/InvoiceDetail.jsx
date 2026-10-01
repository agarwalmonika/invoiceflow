import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { invoiceAPI, paymentAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  PencilIcon, TrashIcon, ArrowDownTrayIcon,
  CheckCircleIcon, ArrowLeftIcon, XCircleIcon,
  EnvelopeIcon, BuildingOfficeIcon, PhoneIcon,
} from '@heroicons/react/24/outline'
import { PageLoader, StatusBadge, ConfirmDialog, Modal } from '../../components/common'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [payMethod, setPayMethod] = useState('bank_transfer')
  const [pdfLoading, setPdfLoading] = useState(false)

  const load = () => {
    invoiceAPI.getOne(id)
      .then(res => setInvoice(res.data.invoice))
      .catch(() => { toast.error('Invoice not found'); navigate('/invoices') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    try {
      await invoiceAPI.delete(id)
      toast.success('Invoice deleted')
      navigate('/invoices')
    } catch { toast.error('Failed to delete') }
  }

  const handleMarkPaid = async () => {
    try {
      await paymentAPI.markPaid(id, { method: payMethod })
      toast.success('Invoice marked as paid!')
      setShowPay(false)
      load()
    } catch { toast.error('Failed to update payment') }
  }

  const handleMarkUnpaid = async () => {
    try {
      await paymentAPI.markUnpaid(id)
      toast.success('Invoice marked as unpaid')
      load()
    } catch { toast.error('Failed to update') }
  }

  const handleStatusChange = async (status) => {
    try {
      await invoiceAPI.update(id, { status })
      toast.success(`Invoice marked as ${status}`)
      load()
    } catch { toast.error('Failed to update status') }
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      const res = await invoiceAPI.downloadPDF(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `invoice-${invoice.invoiceNumber}.pdf`; a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch { toast.error('Failed to download PDF') }
    finally { setPdfLoading(false) }
  }

  if (loading) return <PageLoader />
  if (!invoice) return null

  const client = invoice.clientId
  const user = invoice.userId

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="btn-ghost btn-sm">
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white font-mono">
                {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <>
              <button onClick={() => navigate(`/invoices/${id}/edit`)} className="btn-secondary">
                <PencilIcon className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => handleStatusChange('sent')} disabled={invoice.status === 'sent'} className="btn-secondary">
                <EnvelopeIcon className="w-4 h-4" /> Mark Sent
              </button>
              <button onClick={() => setShowPay(true)} className="btn-primary">
                <CheckCircleIcon className="w-4 h-4" /> Mark Paid
              </button>
            </>
          )}
          {invoice.status === 'paid' && (
            <button onClick={handleMarkUnpaid} className="btn-secondary">
              <XCircleIcon className="w-4 h-4" /> Mark Unpaid
            </button>
          )}
          <button onClick={handleDownloadPDF} disabled={pdfLoading} className="btn-secondary">
            <ArrowDownTrayIcon className="w-4 h-4" /> {pdfLoading ? 'Generating...' : 'PDF'}
          </button>
          <button onClick={() => setShowDelete(true)} className="btn-ghost text-red-500 hover:bg-red-50">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="card p-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">INVOICE</div>
            <div className="space-y-1 text-sm text-slate-500">
              <p><span className="font-medium text-slate-700 dark:text-slate-300">Invoice #:</span> <span className="font-mono text-brand-600">{invoice.invoiceNumber}</span></p>
              <p><span className="font-medium text-slate-700 dark:text-slate-300">Issue Date:</span> {formatDate(invoice.issueDate)}</p>
              <p><span className="font-medium text-slate-700 dark:text-slate-300">Due Date:</span> {formatDate(invoice.dueDate)}</p>
              {invoice.paidDate && <p><span className="font-medium text-emerald-600">Paid:</span> {formatDate(invoice.paidDate)}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{user?.businessName || user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.phone && <p className="text-sm text-slate-500">{user.phone}</p>}
            {user?.address?.street && <p className="text-sm text-slate-500">{user.address.street}</p>}
            {user?.address?.city && <p className="text-sm text-slate-500">{user.address.city}, {user.address.state}</p>}
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
          <p className="font-bold text-slate-900 dark:text-white">{client?.name}</p>
          {client?.company && <p className="text-sm text-slate-500 flex items-center gap-1"><BuildingOfficeIcon className="w-3.5 h-3.5" />{client.company}</p>}
          <p className="text-sm text-slate-500 flex items-center gap-1"><EnvelopeIcon className="w-3.5 h-3.5" />{client?.email}</p>
          {client?.phone && <p className="text-sm text-slate-500 flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" />{client.phone}</p>}
          {client?.address?.city && <p className="text-sm text-slate-500">{client.address.city}, {client.address.country}</p>}
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-surface-900">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide rounded-l-xl">Description</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rate</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tax</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide rounded-r-xl">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{item.description}</td>
                  <td className="py-3.5 px-4 text-right text-slate-500">{item.quantity}</td>
                  <td className="py-3.5 px-4 text-right text-slate-500">{formatCurrency(item.rate, invoice.currency)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-500">{item.taxRate || 0}%</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax</span>
                <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
              </div>
            )}
            <div className="h-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(invoice.notes || invoice.terms) && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {invoice.notes && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Terms</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmDialog
        open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Delete Invoice" message={`Delete invoice ${invoice.invoiceNumber}? This cannot be undone.`}
      />
      <Modal open={showPay} onClose={() => setShowPay(false)} title="Record Payment" size="sm">
        <p className="text-sm text-slate-500 mb-4">Mark <strong>{invoice.invoiceNumber}</strong> as paid for <strong>{formatCurrency(invoice.totalAmount, invoice.currency)}</strong></p>
        <div className="form-group mb-6">
          <label className="label">Payment Method</label>
          <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="input">
            <option value="bank_transfer">Bank Transfer</option>
            <option value="credit_card">Credit Card</option>
            <option value="cash">Cash</option>
            <option value="paypal">PayPal</option>
            <option value="stripe">Stripe</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowPay(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleMarkPaid} className="btn-primary"><CheckCircleIcon className="w-4 h-4" /> Mark Paid</button>
        </div>
      </Modal>
    </div>
  )
}
