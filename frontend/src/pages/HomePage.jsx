import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <h1>Car Pooling</h1>
      <p>
        Signed in as <strong>{user?.email}</strong>
        {user?.role && ` (${user.role})`}
        {user?.organization && ` · ${user.organization.name}`}
      </p>
      <p>
        <Link to="/rides">Browse rides</Link>
        {' · '}
        <Link to="/routes">My routes</Link>
        {' · '}
        <Link to="/profile">Profile</Link>
        {' · '}
        <button type="button" onClick={handleLogout} className="link-button">
          Log out
        </button>
      </p>
    </div>
  )
}
