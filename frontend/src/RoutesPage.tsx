import { FormEvent, useEffect, useState, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { PersonaHeader } from './PersonaHeader'

type Route = {
  id: number
  start_location: string
  end_location: string
  waypoints: string | null
  recurrence: string | null
  start_time: string | null
  end_time: string | null
}

type RideOffer = {
  id: number
  route_id: number
  seats_available: number
  active: boolean
  driver_email: string
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
  const { token, user } = useAuth()
  const [routes, setRoutes] = useState<Route[]>([])
  const [offers, setOffers] = useState<RideOffer[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyRoute)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [offeringRouteId, setOfferingRouteId] = useState<number | null>(null)
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null)
  const [offerSeats, setOfferSeats] = useState(1)
  const [offerSaving, setOfferSaving] = useState(false)

  const myActiveOffers = useMemo(
    () =>
      offers.filter(
        (o) => o.active && user?.email && o.driver_email === user.email
      ),
    [offers, user?.email]
  )

  async function loadRoutes() {
    if (!token) return
    setError(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/routes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Could not load routes')
      const data = (await res.json()) as Route[]
      setRoutes(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load routes')
    }
  }

  async function loadOffers() {
    if (!token) return
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(
        `${baseUrl}/api/ride_offers?min_seats=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) return
      const data = (await res.json()) as RideOffer[]
      setOffers(data)
    } catch {
      setOffers([])
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      await Promise.all([loadRoutes(), loadOffers()])
      setLoading(false)
    }
    if (token) load()
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
      await loadOffers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete route')
    }
  }

  function getOfferForRoute(routeId: number) {
    return myActiveOffers.find((o) => o.route_id === routeId)
  }

  async function handleCreateOffer(routeId: number) {
    if (!token || offerSeats < 1) return
    setOfferSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/ride_offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ride_offer: { route_id: routeId, seats_available: offerSeats },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not create offer'
        throw new Error(msg)
      }
      const created = (await res.json()) as RideOffer
      setOffers((prev) => [...prev, created])
      setOfferingRouteId(null)
      setOfferSeats(1)
      setSuccess('Ride offer created. It now appears in Browse rides.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create offer')
    } finally {
      setOfferSaving(false)
    }
  }

  async function handleUpdateOffer(offerId: number) {
    if (!token || offerSeats < 1) return
    setOfferSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/ride_offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ride_offer: { seats_available: offerSeats },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not update offer'
        throw new Error(msg)
      }
      const updated = (await res.json()) as RideOffer
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? updated : o))
      )
      setEditingOfferId(null)
      setSuccess('Offer updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update offer')
    } finally {
      setOfferSaving(false)
    }
  }

  async function handleWithdrawOffer(offerId: number) {
    if (!window.confirm('Withdraw this offer? It will be hidden from Browse rides and pending requests will be rejected.')) return
    if (!token) return
    setError(null)
    setSuccess(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/ride_offers/${offerId}/withdraw`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Could not withdraw offer')
      const updated = (await res.json()) as RideOffer
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? updated : o))
      )
      setEditingOfferId(null)
      setSuccess('Offer withdrawn.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not withdraw offer')
    }
  }

  if (loading) {
    return (
      <main>
        <PersonaHeader title="My routes" />
        <p>Loading routes…</p>
      </main>
    )
  }

  return (
    <main>
      <PersonaHeader title="My routes" />

      <section className="routes-layout">
        <div className="routes-list">
          <div className="routes-list-header">
            <h2>Your routes</h2>
            <button type="button" onClick={startCreate}>
              New route
            </button>
          </div>
          {routes.length === 0 ? (
            <p>No routes yet. Create a route, then &quot;Offer ride&quot; so others can see it in Browse rides.</p>
          ) : (
            <ul>
              {routes.map((route) => {
                const offer = getOfferForRoute(route.id)
                const showOfferForm = offeringRouteId === route.id
                const showEditOffer = offer && editingOfferId === offer.id
                return (
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
                      {offer ? (
                        <div className="routes-meta" style={{ marginTop: '0.35rem' }}>
                          <strong>Offered: {offer.seats_available} seat(s)</strong> — visible in Browse rides
                        </div>
                      ) : null}
                    </div>
                    <div className="routes-item-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                      <button type="button" onClick={() => startEdit(route)}>
                        Edit route
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(route.id)}
                      >
                        Delete
                      </button>
                      {offer ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOfferId(offer.id)
                              setOfferSeats(offer.seats_available)
                            }}
                          >
                            Edit offer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWithdrawOffer(offer.id)}
                            style={{
                              borderColor: '#b91c1c',
                              color: '#b91c1c',
                            }}
                          >
                            Withdraw offer
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOfferingRouteId(route.id)
                            setOfferSeats(1)
                            setEditingOfferId(null)
                          }}
                          style={{
                            borderColor: '#166534',
                            color: '#166534',
                            fontWeight: 600,
                          }}
                        >
                          Offer ride
                        </button>
                      )}
                    </div>
                    {showOfferForm && (
                      <div className="routes-offer-form" style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: 6 }}>
                        <label>
                          Seats available
                          <input
                            type="number"
                            min={1}
                            value={offerSeats}
                            onChange={(e) => setOfferSeats(Number(e.target.value) || 1)}
                            style={{ marginLeft: '0.5rem', width: 60 }}
                          />
                        </label>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            disabled={offerSaving}
                            onClick={() => handleCreateOffer(route.id)}
                          >
                            {offerSaving ? 'Creating…' : 'Create offer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOfferingRouteId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {showEditOffer && offer && (
                      <div className="routes-offer-form" style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: 6 }}>
                        <label>
                          Seats available
                          <input
                            type="number"
                            min={1}
                            value={offerSeats}
                            onChange={(e) => setOfferSeats(Number(e.target.value) || 1)}
                            style={{ marginLeft: '0.5rem', width: 60 }}
                          />
                        </label>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            disabled={offerSaving}
                            onClick={() => handleUpdateOffer(offer.id)}
                          >
                            {offerSaving ? 'Saving…' : 'Update offer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingOfferId(null) }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
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

