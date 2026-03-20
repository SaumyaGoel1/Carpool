import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { PersonaHeader } from './PersonaHeader'

type Organization = {
  id: number
  name: string
  max_seats_per_offer: number | null
  visibility: string | null
}

const VISIBILITY_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'organization', label: 'Organization only' },
  { value: 'public', label: 'Public' },
]

export function OrganizationSettingsPage() {
  const { token } = useAuth()
  const [org, setOrg] = useState<Organization | null>(null)
  const [name, setName] = useState('')
  const [maxSeats, setMaxSeats] = useState<string>('')
  const [visibility, setVisibility] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/organizations/current`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Could not load organization')
        }
        const data = (await res.json()) as Organization
        setOrg(data)
        setName(data.name)
        setMaxSeats(data.max_seats_per_offer != null ? String(data.max_seats_per_offer) : '')
        setVisibility(data.visibility ?? '')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load organization')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required')
      return
    }

    const maxSeatsNum = maxSeats.trim() === '' ? null : parseInt(maxSeats.trim(), 10)
    if (maxSeats.trim() !== '' && (Number.isNaN(maxSeatsNum) || maxSeatsNum! < 1 || maxSeatsNum! > 20)) {
      setError('Max seats per offer must be between 1 and 20, or leave empty')
      return
    }

    const vis = visibility.trim() === '' ? null : visibility.trim()

    setSaving(true)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/organizations/current`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization: {
            name: trimmedName,
            max_seats_per_offer: maxSeatsNum,
            visibility: vis || undefined,
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const message =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not save organization settings'
        throw new Error(message)
      }

      const updated = (await res.json()) as Organization
      setOrg(updated)
      setSuccess('Organization settings saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save organization settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main>
        <PersonaHeader title="Organization settings" />
        <p>Loading…</p>
      </main>
    )
  }

  if (!org) {
    return (
      <main>
        <PersonaHeader title="Organization settings" />
        <p className="auth-error">{error || 'Organization not found.'}</p>
      </main>
    )
  }

  return (
    <main>
      <PersonaHeader title="Organization settings" />

      <section className="profile-card">
        <p className="routes-meta" style={{ marginBottom: '1rem' }}>
          Only organization admins can save changes.
        </p>
        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            Organization name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Acme Corp"
            />
          </label>
          <label>
            Max seats per offer (optional, 1–20)
            <input
              type="number"
              min={1}
              max={20}
              value={maxSeats}
              onChange={(e) => setMaxSeats(e.target.value)}
              placeholder="Leave empty for no limit"
            />
          </label>
          <label>
            Visibility (optional)
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value || 'empty'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="auth-error">{error}</p>}
          {success && <p className="profile-success">{success}</p>}
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </section>
    </main>
  )
}
