import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { invoiceAPI } from '../../services/api'
import toast from 'react-hot-toast'
import InvoiceForm from '../../components/invoice/InvoiceForm'
import { PageLoader } from '../../components/common'

export default function EditInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invoiceAPI.getOne(id)
      .then(res => setInvoice(res.data.invoice))
      .catch(() => { toast.error('Invoice not found'); navigate('/invoices') })
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (form) => {
    try {
      await invoiceAPI.update(id, form)
      toast.success('Invoice updated!')
      navigate(`/invoices/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update invoice')
      throw err
    }
  }

  if (loading) return <PageLoader />

  const initial = {
    clientId: invoice.clientId?._id || invoice.clientId,
    items: invoice.items,
    discount: invoice.discount,
    notes: invoice.notes,
    terms: invoice.terms,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    template: invoice.template,
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Edit Invoice</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">{invoice.invoiceNumber}</p>
        </div>
      </div>
      <InvoiceForm initial={initial} onSave={handleSave} submitLabel="Save Changes" />
    </div>
  )
}
