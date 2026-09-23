import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  withCredentials: true,  // ← Allow cookies to be sent with requests
})

// ── CSRF token management ──────────────────────────────────────
let csrfTokenPromise = null

async function getCSRFToken() {
  let token = sessionStorage.getItem('wedpix_csrf_token')

  // If token exists in session storage, return it
  if (token) {
    return token
  }

  // Fetch token from server only once per session
  if (!csrfTokenPromise) {
    csrfTokenPromise = (async () => {
      try {
        const res = await API.get('csrf-token.php')
        token = res.data?.csrf_token

        if (!token) {
          throw new Error('No csrf_token in response')
        }

        sessionStorage.setItem('wedpix_csrf_token', token)
        console.debug('[CSRF] Token fetched successfully')
        return token
      } catch (error) {
        console.error('[CSRF] Failed to fetch token:', error?.message ?? error)
        throw error
      }
    })()
  }

  return csrfTokenPromise
}

// ── Request interceptor — attach Bearer token and CSRF ─────────
API.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('wedpix_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Add CSRF token to state-changing requests
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    const csrfToken = await getCSRFToken()
    config.headers['X-CSRF-Token'] = csrfToken
    console.debug(`[API] ${config.method.toUpperCase()} ${config.url}`, {
      headers: { 'X-CSRF-Token': csrfToken ? '***' : 'MISSING', Authorization: token ? '***' : 'NONE' },
      withCredentials: config.withCredentials,
    })
  }

  return config
})

// ── Response interceptor — handle 401 globally + debug 403 ────
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 403) {
      const isCSRF = err.response?.data?.error === 'Token CSRF invalid.'
      console.error('[API] 403 Forbidden:', {
        url: err.config?.url,
        headers: err.config?.headers,
        status: err.response?.status,
        data: err.response?.data,
      })

      if (isCSRF && err.config && !err.config._retry) {
        err.config._retry = true
        sessionStorage.removeItem('wedpix_csrf_token')
        try {
          const csrfToken = await getCSRFToken()
          err.config.headers['X-CSRF-Token'] = csrfToken
          return API.request(err.config)
        } catch (fetchError) {
          console.error('[API] CSRF retry failed:', fetchError)
        }
      }
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('wedpix_token')
      localStorage.removeItem('wedpix_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default API
