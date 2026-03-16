import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchWithAuth } from '../lib/api'

export function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState([])
  const [form, setForm] = useState({
    name: '',
    phone: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_capacity: '',
  })

  useEffect(() => {
    fetchWithAuth('/api/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile')
        return res.json()
      })
      .then((data) => {
        const p = data.profile
        setProfile(p)
        setForm({
          name: p.name || '',
          phone: p.phone || '',
          vehicle_make: p.vehicle?.make || '',
          vehicle_model: p.vehicle?.model || '',
          vehicle_capacity: p.vehicle?.capacity || '',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSuccess('')
    setError('')
    setErrors([])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')
    setErrors([])
    try {
      const res = await fetchWithAuth('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          profile: {
            name: form.name.trim() || '',
            phone: form.phone.trim() || '',
            vehicle_make: form.vehicle_make.trim() || '',
            vehicle_model: form.vehicle_model.trim() || '',
            vehicle_capacity: form.vehicle_capacity.trim() || '',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors(data.errors || [data.error].filter(Boolean))
        setError(data.error || 'Update failed')
        return
      }
      setProfile(data.profile)
      setSuccess('Profile updated.')
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="app">Loading profile…</div>

  return (
    <div className="app">
      <h1>Profile</h1>
      <p><Link to="/">← Home</Link></p>

      {success && <p className="success">{success}</p>}
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
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={profile?.email ?? ''}
            disabled
            title="Email is shown from your account"
          />
        </div>
        <div>
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="text"
            value={form.phone}
            onChange={handleChange}
            disabled={saving}
          />
        </div>

        <fieldset>
          <legend>Vehicle (optional)</legend>
          <div>
            <label htmlFor="vehicle_make">Make</label>
            <input
              id="vehicle_make"
              name="vehicle_make"
              type="text"
              value={form.vehicle_make}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="vehicle_model">Model</label>
            <input
              id="vehicle_model"
              name="vehicle_model"
              type="text"
              value={form.vehicle_model}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="vehicle_capacity">Capacity (seats)</label>
            <input
              id="vehicle_capacity"
              name="vehicle_capacity"
              type="text"
              value={form.vehicle_capacity}
              onChange={handleChange}
              placeholder="e.g. 4"
              disabled={saving}
            />
          </div>
        </fieldset>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}
