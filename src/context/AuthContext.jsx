import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import API from '../utils/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]                 = useState(() => {
    try { return JSON.parse(localStorage.getItem('wedpix_user')) } catch { return null }
  })
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading]           = useState(!!localStorage.getItem('wedpix_token'))

  // Rehydrate from token on mount
  useEffect(() => {
    const token = localStorage.getItem('wedpix_token')
    if (!token) { setLoading(false); return }

    API.get('/auth/me.php')
      .then(({ data }) => {
        setUser(data.user)
        setSubscription(data.subscription)
        localStorage.setItem('wedpix_user', JSON.stringify(data.user))
      })
      .catch(() => {
        localStorage.removeItem('wedpix_token')
        localStorage.removeItem('wedpix_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await API.post('/auth/login.php', { email, password })
    localStorage.setItem('wedpix_token', data.token)
    localStorage.setItem('wedpix_user',  JSON.stringify(data.user))
    setUser(data.user)
    setSubscription(data.subscription)
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await API.post('/auth/register.php', { name, email, password })
    localStorage.setItem('wedpix_token', data.token)
    localStorage.setItem('wedpix_user',  JSON.stringify(data.user))
    setUser(data.user)
    setSubscription(null)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('wedpix_token')
    localStorage.removeItem('wedpix_user')
    setUser(null)
    setSubscription(null)
  }, [])

  const refreshSubscription = useCallback(async () => {
    const { data } = await API.get('/auth/me.php')
    setUser(data.user)
    setSubscription(data.subscription)
    localStorage.setItem('wedpix_user', JSON.stringify(data.user))
    return data.subscription
  }, [])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('wedpix_user', JSON.stringify(updatedUser))
  }, [])

  return (
    <AuthContext.Provider value={{ user, subscription, loading, login, register, logout, refreshSubscription, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
