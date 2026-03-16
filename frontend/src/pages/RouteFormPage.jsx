import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchWithAuth } from '../lib/api'

const RECURRENCE_OPTIONS = ['', 'daily', 'weekdays', 'weekly', 'custom']

export function RouteFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState([])
  const [form, setForm] = useState({
    start_address: '',
    end_address: '',
    recurrence: '',
    departure_time: '',
    arrival_time: '',
    waypoints_str: '',
    offering: false,
    seats_available: '0',
  })

  useEffect(() => {
    if (!isEdit) return
    fetchWithAuth(`/api/routes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load route')
        return res.json()
      })
      .then((data) => {
        const r = data.route
        setForm({
          start_address: r.start_address || '',
          end_address: r.end_address || '',
          recurrence: r.recurrence || '',
          departure_time: r.departure_time || '',
          arrival_time: r.arrival_time || '',
          waypoints_str: Array.isArray(r.waypoints) ? r.waypoints.join(', ') : '',
          offering: !!r.offering,
          seats_available: String(r.seats_available ?? 0),
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
    setErrors([])
  }

  function getWaypoints() {
    return form.waypoints_str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setErrors([])
    const payload = {
      route: {
        start_address: form.start_address.trim(),
        end_address: form.end_address.trim(),
        recurrence: form.recurrence || null,
        departure_time: form.departure_time || null,
        arrival_time: form.arrival_time || null,
        waypoints: getWaypoints(),
        offering: form.offering,
        seats_available: form.offering ? parseInt(form.seats_available, 10) || 0 : 0,
      },
    }
    try {
      const url = isEdit ? `/api/routes/${id}` : '/api/routes'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors(data.errors || [])
        setError(data.error || 'Save failed')
        return
      }
      navigate('/routes')
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="app">Loading…</div>

  return (
    <div className="app">
      <h1>{isEdit ? 'Edit route' : 'New route'}</h1>
      <p><Link to="/routes">← My routes</Link></p>
      {error && <p className="error">{error}</p>}
      {errors.length > 0 && (
        <ul className="error-list">
          {errors.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="start_address">Start address *</label>
          <input
            id="start_address"
            name="start_address"
            type="text"
            value={form.start_address}
            onChange={handleChange}
            required
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="end_address">End address *</label>
          <input
            id="end_address"
            name="end_address"
            type="text"
            value={form.end_address}
            onChange={handleChange}
            required
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="waypoints_str">Waypoints (comma-separated)</label>
          <input
            id="waypoints_str"
            name="waypoints_str"
            type="text"
            value={form.waypoints_str}
            onChange={handleChange}
            placeholder="e.g. Stop A, Stop B"
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="recurrence">Recurrence</label>
          <select
            id="recurrence"
            name="recurrence"
            value={form.recurrence}
            onChange={handleChange}
            disabled={saving}
          >
            {RECURRENCE_OPTIONS.map((opt) => (
              <option key={opt || 'none'} value={opt}>{opt || '—'}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="departure_time">Departure time</label>
          <input
            id="departure_time"
            name="departure_time"
            type="time"
            value={form.departure_time}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="arrival_time">Arrival time</label>
          <input
            id="arrival_time"
            name="arrival_time"
            type="time"
            value={form.arrival_time}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="offering"
              checked={form.offering}
              onChange={handleChange}
              disabled={saving}
            />
            {' '}Offering ride
          </label>
        </div>
        {form.offering && (
          <div>
            <label htmlFor="seats_available">Seats available</label>
            <input
              id="seats_available"
              name="seats_available"
              type="number"
              min="1"
              value={form.seats_available}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
        )}
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : (isEdit ? 'Update route' : 'Create route')}
        </button>
      </form>
    </div>
  )
}
