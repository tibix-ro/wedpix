import { useState, useEffect } from 'react'
import { Download, Eye, Loader2, AlertCircle } from 'lucide-react'
import API from '../utils/api.js'

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await API.get('/billing/invoice-list.php')
      setInvoices(data.invoices || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Eroare la încărcarea facturilor.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (invoiceId, invoiceNumber) => {
    const pdfUrl = `${import.meta.env.VITE_API_URL}/billing/invoice-download.php?id=${invoiceId}`
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `${invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = (invoiceId) => {
    const viewUrl = `${import.meta.env.VITE_API_URL}/billing/invoice-view.php?id=${invoiceId}`
    window.open(viewUrl, '_blank')
  }

  const getStatusBadge = (status) => {
    const colors = {
      issued: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    const labels = {
      issued: 'Emisă',
      paid: 'Plătită',
      draft: 'Ciornă',
      cancelled: 'Anulată',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || ''}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-rose-gold" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex gap-3 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
        <AlertCircle className="shrink-0 mt-0.5" size={18} />
        <span>{error}</span>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-taupe">Nu ai nicio factură încă.</p>
        <p className="text-taupe text-sm mt-2">Facturile vor fi generate după prima plată.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gold-light/10 border-b-2 border-gold-light">
            <th className="px-4 py-3 text-left font-semibold text-charcoal text-sm">Factură</th>
            <th className="px-4 py-3 text-left font-semibold text-charcoal text-sm">Client</th>
            <th className="px-4 py-3 text-left font-semibold text-charcoal text-sm">Sumă</th>
            <th className="px-4 py-3 text-left font-semibold text-charcoal text-sm">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-charcoal text-sm">Data</th>
            <th className="px-4 py-3 text-left font-semibold text-charcoal text-sm">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-gray-200 hover:bg-gold-light/5 transition-colors">
              <td className="px-4 py-3 text-sm font-mono text-charcoal">{inv.number}</td>
              <td className="px-4 py-3 text-sm text-taupe">{inv.client}</td>
              <td className="px-4 py-3 text-sm font-semibold text-charcoal">
                {inv.amount.toFixed(2)} RON
              </td>
              <td className="px-4 py-3 text-sm">{getStatusBadge(inv.status)}</td>
              <td className="px-4 py-3 text-sm text-taupe">
                {new Date(inv.issued_at).toLocaleDateString('ro-RO')}
              </td>
              <td className="px-4 py-3 text-sm flex gap-2">
                <button
                  onClick={() => handleView(inv.id)}
                  className="text-rose-gold hover:text-rose-gold/80 transition-colors flex items-center gap-1"
                  title="Vezi factură"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleDownload(inv.id, inv.number)}
                  className="text-rose-gold hover:text-rose-gold/80 transition-colors flex items-center gap-1"
                  title="Descarcă PDF"
                >
                  <Download size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
