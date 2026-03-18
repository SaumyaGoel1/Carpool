import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { NotificationCenter } from './NotificationCenter'

type Route = {
  id: number
  start_location: string
  end_location: string
  waypoints: string | null
  recurrence: string | null
  start_time: string | null
  end_time: string | null
}

const emptyRoute: Omit<Route, 'id'> = {
  start_location: '',
  end_location: '',
  waypoints: '',
  recurrence: '',
  start_time: '',
  end_time: '',
}

export function RoutesPage() {
  const { token, user, logout } = useAuth()
  const [routes, setRoutes] = useState<Route[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyRoute)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const baseUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/routes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          throw new Error('Could not load routes')
        }
        const data = (await res.json()) as Route[]
        setRoutes(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load routes')
      } finally {
        setLoading(false)
      }
    }
    if (token) {
      load()
    }
  }, [token])

  function startCreate() {
    setEditingId(null)
    setForm(emptyRoute)
    setError(null)
    setSuccess(null)
  }

  function startEdit(route: Route) {
    setEditingId(route.id)
    setForm({
      start_location: route.start_location,
      end_location: route.end_location,
      waypoints: route.waypoints ?? '',
      recurrence: route.recurrence ?? '',
      start_time: route.start_time ?? '',
      end_time: route.end_time ?? '',
    })
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.start_location.trim() || !form.end_location.trim()) {
      setError('Start and end are required')
      return
    }

    setSaving(true)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const payload = {
        route: {
          ...form,
          start_location: form.start_location.trim(),
          end_location: form.end_location.trim(),
        },
      }

      const url =
        editingId == null
          ? `${baseUrl}/api/routes`
          : `${baseUrl}/api/routes/${editingId}`
      const method = editingId == null ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const message =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not save route'
        throw new Error(message)
      }

      const saved = (await res.json()) as Route
      setRoutes((prev) => {
        const others = prev.filter((r) => r.id !== saved.id)
        return [...others, saved].sort((a, b) => a.id - b.id)
      })
      setSuccess('Route saved')
      if (editingId == null) {
        setForm(emptyRoute)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save route')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this route?')) return
    setError(null)
    setSuccess(null)

    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/routes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Could not delete route')
      }
      setRoutes((prev) => prev.filter((r) => r.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyRoute)
      }
      setSuccess('Route deleted')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete route')
    }
  }

  if (loading) {
    return (
      <main>
        <header className="app-header">
          <h1>My routes</h1>
          {user && (
            <div className="app-header-user">
              <NotificationCenter />
              <span>{user.email}</span>
              <Link to="/driver-requests" className="app-link-button">
                My ride requests
              </Link>
              <Link to="/my-requests" className="app-link-button">
                My requests
              </Link>
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
        <p>Loading routes…</p>
      </main>
    )
  }

  return (
    <main>
      <header className="app-header">
        <h1>My routes</h1>
        {user && (
          <div className="app-header-user">
            <NotificationCenter />
            <span>{user.email}</span>
            <Link to="/driver-requests" className="app-link-button">
              My ride requests
            </Link>
            <Link to="/my-requests" className="app-link-button">
              My requests
            </Link>
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

      <section className="routes-layout">
        <div className="routes-list">
          <div className="routes-list-header">
            <h2>Your routes</h2>
            <button type="button" onClick={startCreate}>
              New route
            </button>
          </div>
          {routes.length === 0 ? (
            <p>No routes yet.</p>
          ) : (
            <ul>
              {routes.map((route) => (
                <li key={route.id} className="routes-item">
                  <div className="routes-item-main">
                    <div className="routes-line">
                      <strong>{route.start_location}</strong> →{' '}
                      <strong>{route.end_location}</strong>
                    </div>
                    {route.recurrence && (
                      <div className="routes-meta">
                        {route.recurrence}{' '}
                        {route.start_time && (
                          <>
                            at {route.start_time}
                            {route.end_time && ` – ${route.end_time}`}
                          </>
                        )}
                      </div>
                    )}
                    {route.waypoints && (
                      <div className="routes-meta">
                        Waypoints: {route.waypoints}
                      </div>
                    )}
                  </div>
                  <div className="routes-item-actions">
                    <button type="button" onClick={() => startEdit(route)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(route.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section className="routes-form-card">
          <h2>{editingId == null ? 'Create route' : 'Edit route'}</h2>
          <form className="routes-form" onSubmit={handleSubmit}>
            <label>
              Start
              <input
                type="text"
                value={form.start_location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_location: e.target.value }))
                }
                required
              />
            </label>

            <label>
              End
              <input
                type="text"
                value={form.end_location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_location: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Waypoints
              <input
                type="text"
                value={form.waypoints ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, waypoints: e.target.value }))
                }
                placeholder="Optional stops, separated by commas"
              />
            </label>

            <label>
              Recurrence
              <input
                type="text"
                value={form.recurrence ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recurrence: e.target.value }))
                }
                placeholder="e.g. weekdays, daily"
              />
            </label>

            <div className="routes-time-row">
              <label>
                Start time
                <input
                  type="time"
                  value={form.start_time ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_time: e.target.value }))
                  }
                />
              </label>
              <label>
                End time
                <input
                  type="time"
                  value={form.end_time ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_time: e.target.value }))
                  }
                />
              </label>
            </div>

            {error && <p className="auth-error">{error}</p>}
            {success && <p className="profile-success">{success}</p>}

            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save route'}
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}

