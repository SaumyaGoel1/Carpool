import './App.css'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function App() {
  const { user, logout } = useAuth()

  return (
    <main>
      <header className="app-header">
        <h1>Car Pooling</h1>
        {user && (
          <div className="app-header-user">
            <span>{user.email}</span>
            <Link to="/browse-rides" className="app-link-button">
              Browse rides
            </Link>
            <Link to="/routes" className="app-link-button">
              My routes
            </Link>
            <Link to="/profile" className="app-link-button">
              Profile
            </Link>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </header>
      <section>
        <p>Define routes, send and accept pooling requests.</p>
      </section>
    </main>
  )
}

export default App