import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, PlusIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { PageLoader, StatusBadge } from '../../components/common'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientAPI.getOne(id)
      .then(res => setData(res.data))
      .catch(() => { toast.error('Client not found'); navigate('/clients') })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />
  if (!data) return null

  const { client, invoices } = data

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="btn-ghost btn-sm"><ArrowLeftIcon className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{client.name}</h1>
          {client.company && <p className="text-slate-400 text-sm">{client.company}</p>}
        </div>
        <button onClick={() => navigate(`/invoices/new`)} className="btn-primary ml-auto">
          <PlusIcon className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info */}
        <div className="card p-6 space-y-4">
          <h3 className="font-display font-bold text-slate-800 dark:text-white">Contact Details</h3>
          <div className="space-y-2">
            <p className="text-sm flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <EnvelopeIcon className="w-4 h-4 text-slate-400" />{client.email}
            </p>
            {client.phone && (
              <p className="text-sm flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <PhoneIcon className="w-4 h-4 text-slate-400" />{client.phone}
              </p>
            )}
            {client.company && (
              <p className="text-sm flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <BuildingOfficeIcon className="w-4 h-4 text-slate-400" />{client.company}
              </p>
            )}
            {client.address?.city && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                📍 {client.address.street && `${client.address.street}, `}{client.address.city}{client.address.country && `, ${client.address.country}`}
              </p>
            )}
          </div>
          {client.notes && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Notes</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="label">Total Invoiced</p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{formatCurrency(client.totalInvoiced)}</p>
          </div>
          <div className="stat-card">
            <p className="label">Total Paid</p>
            <p className="text-2xl font-display font-bold text-emerald-600">{formatCurrency(client.totalPaid)}</p>
          </div>
          <div className="stat-card">
            <p className="label">Outstanding</p>
            <p className="text-2xl font-display font-bold text-amber-500">{formatCurrency(client.totalInvoiced - client.totalPaid)}</p>
          </div>
          <div className="stat-card">
            <p className="label">Invoices</p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{invoices.length}</p>
          </div>
          <div className="stat-card">
            <p className="label">Client Since</p>
            <p className="text-xl font-display font-bold text-slate-900 dark:text-white">{formatDate(client.createdAt, 'MMM yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Invoices table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-display font-bold text-slate-900 dark:text-white">Invoice History</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No invoices for this client yet.</div>
        ) : (
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Invoice #</th><th>Amount</th><th>Issue Date</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)} className="cursor-pointer">
                    <td><span className="font-mono text-xs font-semibold text-brand-600">{inv.invoiceNumber}</span></td>
                    <td className="font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                    <td className="text-slate-400 text-xs">{formatDate(inv.issueDate)}</td>
                    <td className="text-slate-400 text-xs">{formatDate(inv.dueDate)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
