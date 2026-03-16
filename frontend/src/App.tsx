import './App.css'
import { useAuth } from './AuthContext'

function App() {
  const { user, logout } = useAuth()

  return (
    <main>
      <header className="app-header">
        <h1>Car Pooling</h1>
        {user && (
          <div className="app-header-user">
            <span>{user.email}</span>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </header>
      <section>
        <p>Define routes, send and accept pooling requests.</p>
        <p>You are signed in and can access protected features here.</p>
      </section>
    </main>
  )
}

export default App