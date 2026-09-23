import { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import API from '../utils/api.js'

export default function FiscalDetailsModal({ isOpen, onClose, onSuccess, plan, planPrice }) {
  const [fiscalType, setFiscalType] = useState('PF')
  const [companyName, setCompanyName] = useState('')
  const [cui, setCui] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [county, setCounty] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Save fiscal details
      await API.post('/billing/invoice-settings.php', {
        fiscal_type: fiscalType,
        company_name: companyName || null,
        cui: cui || null,
        address,
        city,
        county: county || null,
        postal_code: postalCode || null,
      })

      // Proceed to checkout
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Eroare la salvarea datelor fiscale.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-serif text-charcoal">Date Fiscale</h2>
          <button onClick={onClose} className="text-taupe hover:text-charcoal">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-taupe text-sm">
            Pentru generarea facturilor, vă rugăm completați informațiile fiscale. 
            {plan === 'demo' && ' (Pachetul Demo nu generează factură)'}
          </p>

          {error && (
            <div className="flex gap-3 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Fiscal Type */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">
              Tip Entitate <span className="text-rose-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fiscalType"
                  value="PF"
                  checked={fiscalType === 'PF'}
                  onChange={(e) => {
                    setFiscalType(e.target.value)
                    setCompanyName('')
                    setCui('')
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-charcoal">Persoană Fizică</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fiscalType"
                  value="PJ"
                  checked={fiscalType === 'PJ'}
                  onChange={(e) => setFiscalType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-charcoal">Persoană Juridică</span>
              </label>
            </div>
          </div>

          {/* Company Name (for PJ) */}
          {fiscalType === 'PJ' && (
            <div>
              <label htmlFor="company_name" className="block text-sm font-semibold text-charcoal mb-1.5">
                Denumire Companie <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="company_name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ex. ACME SRL"
                className="input-field"
                required={fiscalType === 'PJ'}
              />
            </div>
          )}

          {/* CUI */}
          <div>
            <label htmlFor="cui" className="block text-sm font-semibold text-charcoal mb-1.5">
              CUI {fiscalType === 'PJ' && <span className="text-rose-400">*</span>}
            </label>
            <input
              type="text"
              id="cui"
              value={cui}
              onChange={(e) => setCui(e.target.value.toUpperCase())}
              placeholder="ex. RO12345678"
              className="input-field font-mono"
              required={fiscalType === 'PJ'}
            />
            <p className="text-xs text-taupe mt-1">
              {fiscalType === 'PJ' ? 'Format: RO + 8-10 cifre' : 'Opțional pentru persoane fizice'}
            </p>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-charcoal mb-1.5">
              Adresă <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ex. Strada Principală nr. 123"
              className="input-field"
              required
            />
          </div>

          {/* City & County */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-charcoal mb-1.5">
                Oraș <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ex. București"
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="county" className="block text-sm font-semibold text-charcoal mb-1.5">
                Județ
              </label>
              <input
                type="text"
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="ex. Ilfov"
                className="input-field"
              />
            </div>
          </div>

          {/* Postal Code */}
          <div>
            <label htmlFor="postal_code" className="block text-sm font-semibold text-charcoal mb-1.5">
              Cod Poștal
            </label>
            <input
              type="text"
              id="postal_code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="ex. 010101"
              className="input-field"
            />
          </div>

          {/* Summary */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-sm text-amber-900">
            <p className="font-semibold mb-2">Rezumat Comanda:</p>
            <p>Plan: <strong>{plan.toUpperCase()}</strong> - <strong>{planPrice} RON</strong> (cu TVA)</p>
            {fiscalType === 'PJ' && companyName && (
              <p className="mt-1">Factura va fi emisă pentru: <strong>{companyName}</strong></p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gold-light text-charcoal font-medium hover:bg-gold-light/10 transition-colors"
              disabled={loading}
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              {loading ? 'Se procesează...' : 'Continuă la Plată'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
