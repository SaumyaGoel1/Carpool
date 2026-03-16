import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchWithAuth } from '../lib/api'

export function RoutesListPage() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    fetchWithAuth('/api/routes')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load routes')
        return res.json()
      })
      .then((data) => setRoutes(data.routes || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  function handleDeleteClick(id) {
    setConfirmId(id)
  }

  function handleDeleteConfirm(id) {
    setDeletingId(id)
    fetchWithAuth(`/api/routes/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Delete failed')
        setConfirmId(null)
        load()
      })
      .catch((err) => setError(err.message))
      .finally(() => setDeletingId(null))
  }

  function handleDeleteCancel() {
    setConfirmId(null)
  }

  if (loading) return <div className="app">Loading routes…</div>

  return (
    <div className="app">
      <h1>My routes</h1>
      <p><Link to="/">← Home</Link> · <Link to="/routes/new">New route</Link></p>
      {error && <p className="error">{error}</p>}

      {routes.length === 0 ? (
        <p>No routes yet. <Link to="/routes/new">Create one</Link>.</p>
      ) : (
        <ul className="route-list">
          {routes.map((r) => (
            <li key={r.id} className="route-item">
              <div className="route-summary">
                <strong>{r.start_address}</strong> → <strong>{r.end_address}</strong>
                {r.recurrence && <span className="route-meta"> · {r.recurrence}</span>}
                {r.departure_time && <span className="route-meta"> · {r.departure_time}</span>}
                {r.offering && <span className="route-meta"> · Offering {r.seats_available} seat(s)</span>}
              </div>
              <div className="route-actions">
                <Link to={`/routes/${r.id}/edit`}>Edit</Link>
                {' · '}
                {confirmId === r.id ? (
                  <>
                    <span>Delete? </span>
                    <button type="button" onClick={() => handleDeleteConfirm(r.id)} disabled={deletingId === r.id} className="danger">Yes</button>
                    {' '}
                    <button type="button" onClick={handleDeleteCancel}>No</button>
                  </>
                ) : (
                  <button type="button" onClick={() => handleDeleteClick(r.id)} className="link-button danger">Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
