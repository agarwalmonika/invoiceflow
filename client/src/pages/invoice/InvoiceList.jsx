import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoiceAPI, paymentAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  PlusIcon, DocumentTextIcon, ArrowDownTrayIcon,
  CheckCircleIcon, TrashIcon, PencilIcon, EyeIcon,
} from '@heroicons/react/24/outline'
import {
  PageLoader, EmptyState, StatusBadge, SearchInput,
  Pagination, ConfirmDialog, Modal,
} from '../../components/common'
import { formatCurrency, formatDate } from '../../utils/helpers'

const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled']

export default function InvoiceList() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [deleteId, setDeleteId] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [payMethod, setPayMethod] = useState('bank_transfer')

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await invoiceAPI.getAll({ status, page, limit: 15 })
      setInvoices(res.data.invoices)
      setPagination(res.data.pagination)
    } catch { toast.error('Failed to load invoices') }
    finally { setLoading(false) }
  }, [status, page])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])
  useEffect(() => { setPage(1) }, [status])

  const handleDelete = async () => {
    try {
      await invoiceAPI.delete(deleteId)
      toast.success('Invoice deleted')
      setDeleteId(null)
      fetchInvoices()
    } catch { toast.error('Failed to delete invoice') }
  }

  const handleMarkPaid = async () => {
    try {
      await paymentAPI.markPaid(payModal._id, { method: payMethod })
      toast.success('Invoice marked as paid!')
      setPayModal(null)
      fetchInvoices()
    } catch { toast.error('Failed to update payment') }
  }

  const handleDownloadPDF = async (inv, e) => {
    e.stopPropagation()
    try {
      const res = await invoiceAPI.downloadPDF(inv._id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `invoice-${inv.invoiceNumber}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download PDF') }
  }

  const filtered = search
    ? invoices.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.clientId?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : invoices

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total || 0} total invoices</p>
        </div>
        <button onClick={() => navigate('/invoices/new')} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." />
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                status === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-surface-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-brand-300'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No invoices found"
          description={status !== 'all' ? `No ${status} invoices.` : "Create your first invoice to get started."}
          action={<button onClick={() => navigate('/invoices/new')} className="btn-primary"><PlusIcon className="w-4 h-4" /> Create Invoice</button>}
        />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)} className="cursor-pointer">
                    <td>
                      <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{inv.clientId?.name || '—'}</p>
                        <p className="text-xs text-slate-400">{inv.clientId?.email}</p>
                      </div>
                    </td>
                    <td className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>
                    <td className="text-slate-400 text-xs">{formatDate(inv.issueDate)}</td>
                    <td className="text-slate-400 text-xs">{formatDate(inv.dueDate)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/invoices/${inv._id}`)} className="btn-ghost btn-sm p-1.5" title="View">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button onClick={() => navigate(`/invoices/${inv._id}/edit`)} className="btn-ghost btn-sm p-1.5" title="Edit">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                        {inv.status !== 'paid' && (
                          <button onClick={() => setPayModal(inv)} className="btn-ghost btn-sm p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Mark Paid">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={(e) => handleDownloadPDF(inv, e)} className="btn-ghost btn-sm p-1.5 text-brand-600 hover:bg-brand-50" title="Download PDF">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(inv._id)} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50" title="Delete">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
        </>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Invoice" message="This invoice will be permanently deleted. This action cannot be undone."
      />

      {/* Mark paid modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Mark Invoice as Paid" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Recording payment of <strong>{formatCurrency(payModal?.totalAmount, payModal?.currency)}</strong> for {payModal?.invoiceNumber}
        </p>
        <div className="form-group mb-6">
          <label className="label">Payment method</label>
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
          <button onClick={() => setPayModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleMarkPaid} className="btn-primary"><CheckCircleIcon className="w-4 h-4" /> Mark as Paid</button>
        </div>
      </Modal>
    </div>
  )
}
