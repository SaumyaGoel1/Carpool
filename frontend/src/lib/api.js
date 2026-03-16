// Use VITE_API_URL from env, or in dev assume API at same host on port 3000
function getApiUrl() {
  const fromEnv = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost'
    return `${window.location.protocol}//${host}:3000`
  }
  return ''
}

export function apiUrl(path) {
  let base = getApiUrl()
  if (!base && typeof window !== 'undefined') {
    base = `${window.location.protocol}//${window.location.hostname || 'localhost'}:3000`
  }
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}

export function fetchWithAuth(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(apiUrl(path), { ...options, headers })
}
