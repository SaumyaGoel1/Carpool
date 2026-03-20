import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { PersonaHeader } from './PersonaHeader'

type Request = {
  id: number
  requester_id: number
  requester_name: string | null
  requester_email: string
  message: string | null
  status: string
}

type Group = {
  ride_offer_id: number
  seats_available: number
  start_location: string
  end_location: string
  waypoints: string | null
  recurrence: string | null
  start_time: string | null
  end_time: string | null
  requests: Request[]
}

export function DriverRequestsPage() {
  const { token } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
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
      const res = await fetch(`${baseUrl}/api/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Could not load requests')
      }

      const data = (await res.json()) as Group[]
      setGroups(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load requests')
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

  async function updateRequest(id: number, status: 'approved' | 'rejected') {
    if (!token) return

    setActionError(null)
    setActionSuccess(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const res = await fetch(`${baseUrl}/api/requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ request: { status } }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not update request'
        throw new Error(msg)
      }

      setActionSuccess(
        status === 'approved'
          ? 'Request approved and seat reserved.'
          : 'Request rejected.',
      )

      // Reload to get fresh statuses and seat counts
      await load()
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : 'Could not update request',
      )
    }
  }

  async function withdrawOffer(rideOfferId: number) {
    if (!token) return
    if (
      !window.confirm(
        'Withdraw this offer? The ride will be hidden from Browse rides and any pending requests will be rejected.',
      )
    ) {
      return
    }

    setActionError(null)
    setActionSuccess(null)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/ride_offers/${rideOfferId}/withdraw`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not withdraw offer'
        throw new Error(msg)
      }
      setActionSuccess('Offer withdrawn. Pending requests were rejected.')
      await load()
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : 'Could not withdraw offer',
      )
    }
  }

  return (
    <main>
      <PersonaHeader title="My ride requests" />

      <section className="routes-layout">
        <section className="routes-list">
          <h2>Incoming requests</h2>

          {loading && <p>Loading requests…</p>}

          {!loading && error && <p className="auth-error">{error}</p>}

          {!loading && !error && actionError && (
            <p className="auth-error">{actionError}</p>
          )}

          {!loading && !error && actionSuccess && (
            <p className="profile-success">{actionSuccess}</p>
          )}

          {!loading && !error && groups.length === 0 && (
            <p>No one has requested your rides yet.</p>
          )}

          {!loading && !error && groups.length > 0 && (
            <ul>
              {groups.map((group) => (
                <li key={group.ride_offer_id} className="routes-item">
                  <div className="routes-item-main">
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div className="routes-line">
                        <strong>{group.start_location}</strong> →{' '}
                        <strong>{group.end_location}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => withdrawOffer(group.ride_offer_id)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          border: '1px solid #b91c1c',
                          borderRadius: '6px',
                          background: '#fff',
                          color: '#b91c1c',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        }}
                      >
                        Withdraw offer
                      </button>
                    </div>
                    {group.recurrence && (
                      <div className="routes-meta">
                        {group.recurrence}{' '}
                        {group.start_time && (
                          <>
                            at {group.start_time}
                            {group.end_time && ` – ${group.end_time}`}
                          </>
                        )}
                      </div>
                    )}
                    {group.waypoints && (
                      <div className="routes-meta">
                        Waypoints: {group.waypoints}
                      </div>
                    )}
                    <div className="routes-meta">
                      Seats available: {group.seats_available}
                    </div>

                    <div className="routes-meta" style={{ marginTop: '0.5rem' }}>
                      <strong>Requests</strong>
                    </div>
                    <ul>
                      {group.requests.map((req) => (
                        <li key={req.id} className="routes-item">
                          <div className="routes-item-main">
                            <div className="routes-line">
                              {req.requester_name || req.requester_email} –{' '}
                              <span>{req.status}</span>
                            </div>
                            {req.message && (
                              <div className="routes-meta">
                                Message: {req.message}
                              </div>
                            )}
                          </div>
                          <div className="routes-item-actions">
                            <button
                              type="button"
                              disabled={req.status !== 'pending'}
                              onClick={() => updateRequest(req.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={req.status !== 'pending'}
                              onClick={() => updateRequest(req.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
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

