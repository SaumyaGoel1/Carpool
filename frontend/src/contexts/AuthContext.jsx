import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '../lib/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const setToken = useCallback((token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    let res
    try {
      res = await fetchWithAuth('/api/sign_in', {
        method: 'POST',
        body: JSON.stringify({ user: { email: (email || '').trim().toLowerCase(), password } }),
      })
    } catch (err) {
      throw new Error('Cannot reach server. Is the API running? Check VITE_API_URL (e.g. http://localhost:3000).')
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      let msg = data.error
      if (!msg) {
        if (res.status === 401) msg = 'Invalid email or password.'
        else if (res.status === 404) msg = 'API not found. Is VITE_API_URL set to your API (e.g. http://localhost:3000)?'
        else msg = `Login failed (${res.status}). Try again or check the API is running.`
      }
      throw new Error(msg)
    }
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [setToken])

  const logout = useCallback(() => {
    setToken(null)
  }, [setToken])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    fetchWithAuth('/api/me')
      .then((res) => {
        if (!res.ok) throw new Error('Invalid session')
        return res.json()
      })
      .then((data) => setUser(data.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [setToken])

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
