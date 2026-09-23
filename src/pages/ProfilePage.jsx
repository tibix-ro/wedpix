import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Download, Trash2, Shield, FileText, AlertTriangle } from 'lucide-react'
import API from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(user?.email_notifications_enabled ?? true)
  const [emailDailySummary, setEmailDailySummary] = useState(user?.email_daily_summary ?? false)
  const [emailUsageAlerts, setEmailUsageAlerts] = useState(user?.email_usage_alerts ?? true)
  const [emailExpiryAlerts, setEmailExpiryAlerts] = useState(user?.email_expiry_alerts ?? true)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setEmailNotificationsEnabled(user?.email_notifications_enabled ?? true)
    setEmailDailySummary(user?.email_daily_summary ?? false)
    setEmailUsageAlerts(user?.email_usage_alerts ?? true)
    setEmailExpiryAlerts(user?.email_expiry_alerts ?? true)
  }, [user])

  const handleExportData = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/user/export.php')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wedpix-data-${user.email}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Eroare la exportul datelor: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotificationPreferences = async () => {
    setLoading(true)
    setSaveMessage('')

    try {
      const { data } = await API.put('/user/update.php', {
        email_notifications_enabled: emailNotificationsEnabled,
        email_daily_summary: emailDailySummary,
        email_usage_alerts: emailUsageAlerts,
        email_expiry_alerts: emailExpiryAlerts,
      })

      updateUser({
        ...user,
        email_notifications_enabled: data.user.email_notifications_enabled,
        email_daily_summary: data.user.email_daily_summary,
        email_usage_alerts: data.user.email_usage_alerts,
        email_expiry_alerts: data.user.email_expiry_alerts,
      })
      setSaveMessage('Preferințele au fost salvate.')
    } catch (err) {
      setSaveMessage('Eroare la salvarea preferințelor. Te rog încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Ești sigur că vrei să ștergi contul? Această acțiune este IREVERSIBILĂ și va șterge toate evenimentele, fotografiile și datele tale.')) {
      return
    }

    setLoading(true)
    try {
      await API.delete('/user/delete.php')
      logout()
      navigate('/')
      alert('Contul tău a fost șters cu succes.')
    } catch (err) {
      alert('Eroare la ștergerea contului: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-charcoal mb-2">Profilul meu</h1>
        <p className="text-taupe">Gestionează-ți contul și datele personale</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Account Info */}
        <div className="glass rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-rose-gold/10 flex items-center justify-center">
              <User size={24} className="text-rose-gold" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-charcoal">Informații cont</h2>
              <p className="text-sm text-taupe">Detaliile contului tău</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1">Nume</label>
              <p className="text-taupe bg-ivory px-3 py-2 rounded-lg">{user?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1">Email</label>
              <p className="text-taupe bg-ivory px-3 py-2 rounded-lg">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1">Cont creat</label>
              <p className="text-taupe bg-ivory px-3 py-2 rounded-lg">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('ro-RO') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-rose-gold/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-rose-gold" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-charcoal">Notificări prin email</h2>
              <p className="text-sm text-taupe">Alege ce notificări vrei să primești</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-ivory rounded-2xl">
              <input
                type="checkbox"
                checked={emailNotificationsEnabled}
                onChange={(event) => setEmailNotificationsEnabled(event.target.checked)}
                className="h-5 w-5 text-rose-gold rounded"
              />
              <span className="text-sm text-charcoal">Primește notificări prin email</span>
            </label>

            <label className="flex items-center gap-3 p-4 bg-ivory rounded-2xl">
              <input
                type="checkbox"
                checked={emailDailySummary}
                onChange={(event) => setEmailDailySummary(event.target.checked)}
                disabled={!emailNotificationsEnabled}
                className="h-5 w-5 text-rose-gold rounded"
              />
              <span className="text-sm text-charcoal">Rezumat zilnic al fotografiilor încărcate</span>
            </label>

            <label className="flex items-center gap-3 p-4 bg-ivory rounded-2xl">
              <input
                type="checkbox"
                checked={emailUsageAlerts}
                onChange={(event) => setEmailUsageAlerts(event.target.checked)}
                className="h-5 w-5 text-rose-gold rounded"
              />
              <span className="text-sm text-charcoal">Alerte când depășești 80% din limita de fotografii</span>
            </label>

            <label className="flex items-center gap-3 p-4 bg-ivory rounded-2xl">
              <input
                type="checkbox"
                checked={emailExpiryAlerts}
                onChange={(event) => setEmailExpiryAlerts(event.target.checked)}
                className="h-5 w-5 text-rose-gold rounded"
              />
              <span className="text-sm text-charcoal">Alerte cu 3 zile înainte de expirarea evenimentului</span>
            </label>

            <button
              onClick={handleSaveNotificationPreferences}
              disabled={loading}
              className="w-full px-4 py-3 bg-rose-gold text-white rounded-2xl font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Se salvează...' : 'Salvează preferințele'}
            </button>
            {saveMessage && <p className="text-sm text-green-700">{saveMessage}</p>}
          </div>
        </div>

        {/* GDPR Actions */}
        <div className="glass rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Shield size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-charcoal">Drepturi GDPR</h2>
              <p className="text-sm text-taupe">Gestionează-ți datele personale</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleExportData}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              <div className="text-left">
                <div className="font-semibold">Exportă datele</div>
                <div className="text-sm text-blue-600">Descarcă toate datele tale în format JSON</div>
              </div>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={18} />
              <div className="text-left">
                <div className="font-semibold">Șterge contul</div>
                <div className="text-sm text-red-600">Șterge permanent contul și toate datele</div>
              </div>
            </button>
          </div>
        </div>

        {/* Data Retention Info */}
        <div className="glass rounded-2xl p-6 shadow-card md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <FileText size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-charcoal">Politică de retenție date</h2>
              <p className="text-sm text-taupe">Cum gestionăm datele tale</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Date cont</h3>
              <p className="text-sm text-taupe">Păstrate până la ștergerea contului sau 3 ani de inactivitate</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Fotografii</h3>
              <p className="text-sm text-taupe">Conform planului ales (2 ore - 12 luni)</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Date șterse</h3>
              <p className="text-sm text-taupe">Ștergere permanentă și ireversibilă</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-500" />
              <h3 className="text-xl font-serif text-charcoal">Confirmă ștergerea</h3>
            </div>

            <p className="text-taupe mb-6">
              Această acțiune va șterge permanent:
            </p>

            <ul className="text-sm text-taupe mb-6 space-y-1">
              <li>• Contul tău și toate informațiile personale</li>
              <li>• Toate evenimentele create</li>
              <li>• Toate fotografiile și videourile încărcate</li>
              <li>• Toate abonamentele active</li>
            </ul>

            <p className="text-red-600 text-sm font-semibold mb-6">
              ⚠️ Această acțiune este ireversibilă!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Se șterge...' : 'Șterge contul'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}