import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'cp_session_token'
const USER_KEY = 'cp_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
  }, [])

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
      localStorage.setItem(TOKEN_KEY, sessionToken)
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser))
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
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const value: AuthContextValue = {
    user,
    token,
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

