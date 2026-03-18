import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { NotificationCenter } from './NotificationCenter'

type MyRequest = {
  id: number
  ride_offer_id: number
  status: string
  message: string | null
  start_location: string
  end_location: string
  waypoints: string | null
  recurrence: string | null
  start_time: string | null
  end_time: string | null
  driver_name: string | null
  driver_email: string
}

export function MyRequestsPage() {
  const { token, user, logout } = useAuth()
  const [requests, setRequests] = useState<MyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  async function load() {
    if (!token) return
    setLoading(true)
    setError(null)
    setActionError(null)
    setActionSuccess(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/my/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Could not load your requests')
      }

      const data = (await res.json()) as MyRequest[]
      setRequests(data)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load your requests',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function cancelRequest(id: number) {
    if (!token) return

    setActionError(null)
    setActionSuccess(null)

    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const res = await fetch(`${baseUrl}/api/requests/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not cancel request'
        throw new Error(msg)
      }

      setActionSuccess('Request cancelled.')
      await load()
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : 'Could not cancel request',
      )
    }
  }

  function statusBadge(status: string) {
    return <span className={`status-badge status-${status}`}>{status}</span>
  }

  return (
    <main>
      <header className="app-header">
        <h1>My requests</h1>
        {user && (
          <div className="app-header-user">
            <NotificationCenter />
            <span>{user.email}</span>
            <Link to="/browse-rides" className="app-link-button">
              Browse rides
            </Link>
            <Link to="/driver-requests" className="app-link-button">
              My ride requests
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

      <section className="routes-layout">
        <section className="routes-list">
          <h2>Your ride requests</h2>

          {loading && <p>Loading your requests…</p>}

          {!loading && error && <p className="auth-error">{error}</p>}

          {!loading && !error && actionError && (
            <p className="auth-error">{actionError}</p>
          )}

          {!loading && !error && actionSuccess && (
            <p className="profile-success">{actionSuccess}</p>
          )}

          {!loading && !error && requests.length === 0 && (
            <p>You have not requested any rides yet.</p>
          )}

          {!loading && !error && requests.length > 0 && (
            <ul>
              {requests.map((req) => (
                <li key={req.id} className="routes-item">
                  <div className="routes-item-main">
                    <div className="routes-line">
                      <strong>{req.start_location}</strong> →{' '}
                      <strong>{req.end_location}</strong>
                    </div>
                    <div className="routes-meta">
                      Driver:{' '}
                      <strong>{req.driver_name || req.driver_email}</strong>{' '}
                      {statusBadge(req.status)}
                    </div>
                    {req.recurrence && (
                      <div className="routes-meta">
                        {req.recurrence}{' '}
                        {req.start_time && (
                          <>
                            at {req.start_time}
                            {req.end_time && ` – ${req.end_time}`}
                          </>
                        )}
                      </div>
                    )}
                    {req.waypoints && (
                      <div className="routes-meta">
                        Waypoints: {req.waypoints}
                      </div>
                    )}
                    {req.message && (
                      <div className="routes-meta">
                        Your message: {req.message}
                      </div>
                    )}
                  </div>
                  <div className="routes-item-actions">
                    <button
                      type="button"
                      disabled={req.status !== 'pending'}
                      onClick={() => cancelRequest(req.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}

