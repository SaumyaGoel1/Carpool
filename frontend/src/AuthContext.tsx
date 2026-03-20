import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react'

type User = {
  id: number
  email: string
  organization_id?: number | null
  role?: string | null
}

type AuthContextValue = {
  user: User | null
  token: string | null
  persona: Persona
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

type Persona = 'driver' | 'rider' | null

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'cp_session_token'
const USER_KEY = 'cp_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  // Important: use sessionStorage (per-tab) so multiple accounts/tabs don't overwrite each other.
  const storage = window.sessionStorage

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = storage.getItem(USER_KEY)
      if (!storedUser) return null
      return JSON.parse(storedUser) as User
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => {
    try {
      return storage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const persona = useMemo<Persona>(() => {
    const email = user?.email?.toLowerCase()
    if (!email) return null

    const driverEmail = (import.meta.env.VITE_DRIVER_EMAIL ?? 'driver@gmail.com').toLowerCase()
    const riderEmail = (import.meta.env.VITE_RIDER_EMAIL ?? 'rider@gmail.com').toLowerCase()

    if (email === driverEmail) return 'driver'
    if (email === riderEmail) return 'rider'
    return null
  }, [user])

  // Token/user are loaded synchronously from localStorage (via useState initializers)
  // so that ProtectedRoute doesn't redirect on the first render after reload.

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const response = await fetch(`${baseUrl}/api/sign_in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: { email, password } }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Login failed')
      }

      const data = await response.json()
      const sessionToken = data.session_token as string
      const loggedInUser = {
        ...(data.user as User),
        organization_id: (data.organization_id as number | null | undefined) ?? null,
        role: (data.role as string | null | undefined) ?? null,
      }

      setToken(sessionToken)
      setUser(loggedInUser)
      storage.setItem(TOKEN_KEY, sessionToken)
      storage.setItem(USER_KEY, JSON.stringify(loggedInUser))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(USER_KEY)
  }, [])

  const value: AuthContextValue = {
    user,
    token,
    persona,
    login,
    logout,
    isLoading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

