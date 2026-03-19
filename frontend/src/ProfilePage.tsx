import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { NotificationCenter } from './NotificationCenter'

type Profile = {
  id: number
  name: string | null
  email: string
  phone: string | null
  vehicle: string | null
}

export function ProfilePage() {
  const { token, user, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicle, setVehicle] = useState('')
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
        const res = await fetch(`${baseUrl}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          throw new Error('Could not load profile')
        }
        const data = (await res.json()) as Profile
        setProfile(data)
        setName(data.name ?? '')
        setPhone(data.phone ?? '')
        setVehicle(data.vehicle ?? '')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load profile')
      } finally {
        setLoading(false)
      }
    }
    if (token) {
      load()
    }
  }, [token])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: {
            name: name.trim(),
            phone: phone.trim(),
            vehicle: vehicle.trim(),
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const message =
          (Array.isArray(body.errors) && body.errors.join(', ')) ||
          body.error ||
          'Could not save profile'
        throw new Error(message)
      }

      const updated = (await res.json()) as Profile
      setProfile(updated)
      setSuccess('Profile saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main>
        <header className="app-header">
          <h1>Profile</h1>
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
              <Link to="/members" className="app-link-button">
                Members
              </Link>
              <Link to="/organization-settings" className="app-link-button">
                Organization
              </Link>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </header>
        <p>Loading profile…</p>
      </main>
    )
  }

  if (!profile) {
    return (
      <main>
        <header className="app-header">
          <h1>Profile</h1>
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
              <Link to="/members" className="app-link-button">
                Members
              </Link>
              <Link to="/organization-settings" className="app-link-button">
                Organization
              </Link>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </header>
        <p>Profile not available.</p>
      </main>
    )
  }

  return (
    <main>
      <header className="app-header">
        <h1>Profile</h1>
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
            <Link to="/members" className="app-link-button">
              Members
            </Link>
            <Link to="/organization-settings" className="app-link-button">
              Organization
            </Link>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </header>

      <section className="profile-card">
        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input type="email" value={profile.email} disabled />
          </label>

          <label>
            Phone
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </label>

          <label>
            Vehicle (make, model, capacity)
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g. Blue Honda Civic, 3 seats"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="profile-success">{success}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>
    </main>
  )
}

