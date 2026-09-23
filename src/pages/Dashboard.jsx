import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Loader2, RefreshCcw } from 'lucide-react'
import API from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import EventCard from '../components/EventCard.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchEvents = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await API.get('/events/list.php')
      setEvents(data.events || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Eroare la încărcarea evenimentelor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleDelete = async (evt) => {
    if (!window.confirm(`Sigur dorești să ștergi evenimentul "${evt.name}"? Această acțiune este ireversibilă și va șterge toate pozele.`)) return
    
    try {
      await API.delete(`/events/delete.php?id=${evt.id}`)
      setEvents(events.filter(e => e.id !== evt.id))
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la ștergerea evenimentului.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-charcoal">Panou de control</h1>
          <p className="text-taupe mt-1">Salut, {user?.name?.split(' ')[0]}! Aici sunt evenimentele tale.</p>
        </div>
        <Link
          to="/dashboard/events/new"
          className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
        >
          <Plus size={18} />
          Eveniment Nou
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <span>{error}</span>
          <button onClick={fetchEvents} className="hover:underline font-semibold ml-auto flex items-center gap-1">
            <RefreshCcw size={14} /> Reîncearcă
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-rose-gold" size={32} />
        </div>
      ) : events.length === 0 && !error ? (
        <div className="glass rounded-2xl p-12 text-center shadow-card border border-white/50">
          <div className="w-16 h-16 bg-rose-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="text-rose-gold" size={24} />
          </div>
          <h2 className="text-xl font-serif text-charcoal mb-2">Niciun eveniment creat</h2>
          <p className="text-taupe max-w-md mx-auto mb-6">
            Nu ai creat încă niciun eveniment. Apasă butonul de mai jos pentru a adăuga primul tău eveniment.
          </p>
          <Link to="/dashboard/events/new" className="btn-primary inline-flex">
            Creează un eveniment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <EventCard key={evt.id} event={evt} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
