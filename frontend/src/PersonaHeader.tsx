import { Link } from 'react-router-dom'
import { NotificationCenter } from './NotificationCenter'
import { useAuth } from './AuthContext'

export function PersonaHeader({ title }: { title: string }) {
  const { user, logout, persona } = useAuth()
  const isAdmin = user?.role === 'admin'

  const showDriverLinks = isAdmin || persona === 'driver'
  const showRiderLinks = isAdmin || persona === 'rider'

  return (
    <header className="app-header">
      <h1>{title}</h1>
      {user && (
        <div className="app-header-user">
          <NotificationCenter />
          <span>{user.email}</span>

          {showDriverLinks && (
            <>
              <Link to="/driver-requests" className="app-link-button">
                My ride requests
              </Link>
              <Link to="/routes" className="app-link-button">
                My routes
              </Link>
            </>
          )}

          {showRiderLinks && (
            <>
              <Link to="/my-requests" className="app-link-button">
                My requests
              </Link>
              <Link to="/browse-rides" className="app-link-button">
                Browse rides
              </Link>
            </>
          )}

          <Link to="/history" className="app-link-button">
            History
          </Link>
          <Link to="/profile" className="app-link-button">
            Profile
          </Link>

          {isAdmin && (
            <>
              <Link to="/members" className="app-link-button">
                Members
              </Link>
              <Link to="/organization-settings" className="app-link-button">
                Organization
              </Link>
            </>
          )}

          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </header>
  )
}

