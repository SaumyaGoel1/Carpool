import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

type RideOffer = {
  id: number
  route_id: number
  seats_available: number
  active: boolean
  driver_name: string | null
  driver_email: string
  start_location: string
  end_location: string
  waypoints: string | null
  recurrence: string | null
  start_time: string | null
  end_time: string | null
}

export function BrowseRidesPage() {
  const { token, user, logout } = useAuth()
  const [rides, setRides] = useState<RideOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [minSeats, setMinSeats] = useState(1)

  const [requestMessages, setRequestMessages] = useState<Record<number, string>>(
    {},
  )
  const [requestStatus, setRequestStatus] = useState<
    Record<number, 'idle' | 'sending' | 'sent'>
  >({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (from.trim()) params.set('from', from.trim())
      if (to.trim()) params.set('to', to.trim())
      if (date) params.set('date', date)
      if (minSeats > 0) params.set('min_seats', String(minSeats))

      const url = `${baseUrl}/api/ride_offers?${params.toString()}`

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Could not load rides')
      }

      const data = (await res.json()) as RideOffer[]
      setRides(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load rides')
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setRequestError(null)
    setRequestSuccess(null)
    load()
  }

  async function handleRequestRide(rideId: number) {
    if (!token) return

    setRequestError(null)
    setRequestSuccess(null)
    setRequestStatus((prev) => ({ ...prev, [rideId]: 'sending' }))

    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const message = requestMessages[rideId] ?? ''

      const res = await fetch(`${baseUrl}/api/ride_offers/${rideId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          request: {
            message,
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not send request'

        // If backend reports an active request already exists, treat as sent.
        if (msg.toLowerCase().includes('already have an active request')) {
          setRequestStatus((prev) => ({ ...prev, [rideId]: 'sent' }))
          setRequestSuccess('You already have an active request for this ride.')
        } else {
          setRequestStatus((prev) => ({ ...prev, [rideId]: 'idle' }))
          setRequestError(msg)
        }
        return
      }

      setRequestStatus((prev) => ({ ...prev, [rideId]: 'sent' }))
      setRequestSuccess('Request sent to driver.')
    } catch (e) {
      setRequestStatus((prev) => ({ ...prev, [rideId]: 'idle' }))
      setRequestError(
        e instanceof Error ? e.message : 'Could not send request',
      )
    }
  }

  return (
    <main>
      <header className="app-header">
        <h1>Browse rides</h1>
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

      <section className="routes-layout">
        <section className="routes-form-card">
          <h2>Filters</h2>
          <form className="routes-form" onSubmit={handleSubmit}>
            <label>
              Search
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Start, end, or waypoint"
              />
            </label>

            <label>
              From area
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="e.g. Downtown"
              />
            </label>

            <label>
              To area
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="e.g. Campus"
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label>
              Min seats
              <input
                type="number"
                min={1}
                value={minSeats}
                onChange={(e) => setMinSeats(Number(e.target.value) || 1)}
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Apply filters'}
            </button>
          </form>
        </section>

        <section className="routes-list">
          <h2>Available rides</h2>

          {loading && <p>Loading rides…</p>}

          {!loading && error && <p className="auth-error">{error}</p>}

          {!loading && !error && requestError && (
            <p className="auth-error">{requestError}</p>
          )}

          {!loading && !error && requestSuccess && (
            <p className="profile-success">{requestSuccess}</p>
          )}

          {!loading && !error && rides.length === 0 && (
            <p>No rides match your filters yet. Try broadening your search.</p>
          )}

          {!loading && !error && rides.length > 0 && (
            <ul>
              {rides.map((ride) => (
                <li key={ride.id} className="routes-item">
                  <div className="routes-item-main">
                    <div className="routes-line">
                      <strong>{ride.start_location}</strong> →{' '}
                      <strong>{ride.end_location}</strong>
                    </div>
                    <div className="routes-meta">
                      Driver:{' '}
                      <strong>
                        {ride.driver_name || ride.driver_email}
                      </strong>
                    </div>
                    {ride.recurrence && (
                      <div className="routes-meta">
                        {ride.recurrence}{' '}
                        {ride.start_time && (
                          <>
                            at {ride.start_time}
                            {ride.end_time && ` – ${ride.end_time}`}
                          </>
                        )}
                      </div>
                    )}
                    {ride.waypoints && (
                      <div className="routes-meta">
                        Waypoints: {ride.waypoints}
                      </div>
                    )}
                    <div className="routes-meta">
                      Seats available: {ride.seats_available}
                    </div>
                    <div className="routes-meta">
                      <label>
                        Optional message to driver
                        <input
                          type="text"
                          value={requestMessages[ride.id] ?? ''}
                          onChange={(e) =>
                            setRequestMessages((prev) => ({
                              ...prev,
                              [ride.id]: e.target.value,
                            }))
                          }
                          placeholder="e.g. pickup near Uttam Nagar West"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="routes-item-actions">
                    <button
                      type="button"
                      disabled={
                        requestStatus[ride.id] === 'sending' ||
                        requestStatus[ride.id] === 'sent'
                      }
                      onClick={() => handleRequestRide(ride.id)}
                    >
                      {requestStatus[ride.id] === 'sent'
                        ? 'Request sent'
                        : requestStatus[ride.id] === 'sending'
                          ? 'Requesting…'
                          : 'Request ride'}
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

