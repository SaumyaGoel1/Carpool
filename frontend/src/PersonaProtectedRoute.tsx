import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

type Persona = 'driver' | 'rider'

export function PersonaProtectedRoute({ allowed }: { allowed: Persona[] }) {
  const { persona, user } = useAuth()

  // Admins can access both personas for convenience.
  if (user?.role === 'admin') {
    return <Outlet />
  }

  if (!persona || !allowed.includes(persona)) {
    // Redirect to home where a persona-appropriate header is shown.
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

