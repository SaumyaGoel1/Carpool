import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { PersonaHeader } from './PersonaHeader'

type Member = {
  user_id: number
  email: string
  role: string
  active: boolean
  deactivated_at: string | null
}

export function MembersPage() {
  const { token } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    if (!token) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/organizations/current/members`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Could not load members')
      }
      const data = (await res.json()) as Member[]
      setMembers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function deactivate(userId: number) {
    if (!token) return
    if (!window.confirm('Deactivate this member?')) return
    setError(null)
    setSuccess(null)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/users/${userId}/deactivate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not deactivate member'
        throw new Error(msg)
      }
      setSuccess('Member deactivated.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not deactivate member')
    }
  }

  return (
    <main>
      <PersonaHeader title="Members" />

      {loading && <p>Loading members…</p>}
      {!loading && error && <p className="auth-error">{error}</p>}
      {!loading && success && <p className="profile-success">{success}</p>}

      {!loading && !error && members.length > 0 && (
        <section className="routes-list">
          <h2>Organization members</h2>
          <ul>
            {members.map((m) => (
              <li key={m.user_id} className="routes-item">
                <div className="routes-item-main">
                  <div className="routes-line">
                    <strong>{m.email}</strong>
                  </div>
                  <div className="routes-meta">
                    Role: {m.role} · Status: {m.active ? 'active' : 'deactivated'}
                  </div>
                </div>
                <div className="routes-item-actions">
                  <button
                    type="button"
                    onClick={() => deactivate(m.user_id)}
                    disabled={!m.active}
                  >
                    Deactivate
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

