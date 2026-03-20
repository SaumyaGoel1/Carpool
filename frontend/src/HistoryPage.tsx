import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { PersonaHeader } from './PersonaHeader'

type RouteInfo = {
  start_location: string
  end_location: string
  waypoints: string | null
  recurrence: string | null
  start_time: string | null
  end_time: string | null
}

type Participant = {
  id: number
  requester_name: string | null
  requester_email: string
  status: string
}

type DriverRide = {
  ride_offer_id: number
  route: RouteInfo
  active: boolean
  updated_at: string
  participants: Participant[]
}

type PassengerRequest = {
  id: number
  ride_offer_id: number
  status: string
  updated_at: string
  route: RouteInfo
  driver_name: string | null
  driver_email: string
}

type HistoryResponse = {
  driver_rides: DriverRide[]
  passenger_requests: PassengerRequest[]
}

export function HistoryPage() {
  const { token } = useAuth()
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  async function load() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const params = new URLSearchParams()
      if (fromDate) params.set('from_date', fromDate)
      if (toDate) params.set('to_date', toDate)
      const url = `${baseUrl}/api/history?${params.toString()}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Could not load history')
      const json = (await res.json()) as HistoryResponse
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  function handleApplyFilters(event: FormEvent) {
    event.preventDefault()
    load()
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    } catch {
      return iso
    }
  }

  return (
    <main>
      <PersonaHeader title="History" />

      <section className="routes-layout">
        <section className="routes-form-card">
          <h2>Date filters</h2>
          <form className="routes-form" onSubmit={handleApplyFilters}>
            <label>
              From date
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label>
              To date
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Loading…' : 'Apply'}
            </button>
          </form>
        </section>

        <section className="routes-list">
          {loading && <p>Loading history…</p>}
          {!loading && error && <p className="auth-error">{error}</p>}

          {!loading && !error && data && (
            <>
              <h2>Past rides (as driver)</h2>
              {data.driver_rides.length === 0 ? (
                <p>No past rides as driver. Withdrawn offers appear here.</p>
              ) : (
                <ul>
                  {data.driver_rides.map((ride) => (
                    <li key={ride.ride_offer_id} className="routes-item history-item">
                      <div className="routes-item-main">
                        <div className="routes-line">
                          <strong>{ride.route.start_location}</strong> →{' '}
                          <strong>{ride.route.end_location}</strong>
                        </div>
                        {ride.route.recurrence && (
                          <div className="routes-meta">
                            {ride.route.recurrence}
                            {ride.route.start_time && ` at ${ride.route.start_time}`}
                            {ride.route.end_time && ` – ${ride.route.end_time}`}
                          </div>
                        )}
                        {ride.route.waypoints && (
                          <div className="routes-meta">
                            Waypoints: {ride.route.waypoints}
                          </div>
                        )}
                        <div className="routes-meta">
                          Updated: {formatDate(ride.updated_at)} · Status: Withdrawn
                        </div>
                        {ride.participants.length > 0 && (
                          <div className="routes-meta" style={{ marginTop: '0.5rem' }}>
                            <strong>Participants / requests:</strong>
                            <ul style={{ margin: '0.25rem 0 0 1rem', paddingLeft: '1rem' }}>
                              {ride.participants.map((p) => (
                                <li key={p.id}>
                                  {p.requester_name || p.requester_email} —{' '}
                                  <span className={`status-badge status-${p.status}`}>
                                    {p.status}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <h2 style={{ marginTop: '1.5rem' }}>Past requests (as passenger)</h2>
              {data.passenger_requests.length === 0 ? (
                <p>No past requests. Approved, rejected, or cancelled requests appear here.</p>
              ) : (
                <ul>
                  {data.passenger_requests.map((req) => (
                    <li key={req.id} className="routes-item history-item">
                      <div className="routes-item-main">
                        <div className="routes-line">
                          <strong>{req.route.start_location}</strong> →{' '}
                          <strong>{req.route.end_location}</strong>
                        </div>
                        <div className="routes-meta">
                          Driver: {req.driver_name || req.driver_email}
                        </div>
                        {req.route.recurrence && (
                          <div className="routes-meta">
                            {req.route.recurrence}
                            {req.route.start_time && ` at ${req.route.start_time}`}
                          </div>
                        )}
                        <div className="routes-meta">
                          <span className={`status-badge status-${req.status}`}>
                            {req.status}
                          </span>
                          {' · '}
                          Updated: {formatDate(req.updated_at)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  )
}
