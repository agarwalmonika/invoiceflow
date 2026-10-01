import { useNavigate } from 'react-router-dom'
import { invoiceAPI } from '../../services/api'
import toast from 'react-hot-toast'
import InvoiceForm from '../../components/invoice/InvoiceForm'

export default function CreateInvoice() {
  const navigate = useNavigate()

  const handleSave = async (form) => {
    try {
      const res = await invoiceAPI.create(form)
      toast.success('Invoice created!')
      navigate(`/invoices/${res.data.invoice._id}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create invoice'
      if (err.response?.data?.upgradeRequired) {
        toast.error(msg, { duration: 5000 })
      } else {
        toast.error(msg)
      }
      throw err
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">New Invoice</h1>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the details to create a new invoice</p>
        </div>
      </div>
      <InvoiceForm onSave={handleSave} submitLabel="Create Invoice" />
    </div>
  )
}
