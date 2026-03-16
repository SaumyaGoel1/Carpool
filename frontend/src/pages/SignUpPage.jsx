import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiUrl } from '../lib/api'

export function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [organizationId, setOrganizationId] = useState('1')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setErrors([])
    if (password !== passwordConfirmation) {
      setError('Password and confirmation do not match.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/sign_up'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            email: email.trim(),
            password,
            password_confirmation: passwordConfirmation,
            organization_id: parseInt(organizationId, 10) || 1,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errs = data.errors || [data.error].filter(Boolean)
        setErrors(errs)
        const emailTaken = errs.some((m) => /already been taken|already registered/i.test(m))
        setError(emailTaken ? 'That email is already registered. Use Log in instead.' : (data.error || 'Sign up failed.'))
        return
      }
      localStorage.setItem('token', data.token)
      navigate('/', { replace: true })
      window.location.reload()
    } catch (err) {
      setError(err.message || 'Cannot reach server. Is the API running?')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <h1>Sign up</h1>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
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
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            disabled={submitting}
          />
          <span className="hint">At least 6 characters</span>
        </div>
        <div>
          <label htmlFor="password_confirmation">Confirm password</label>
          <input
            id="password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            autoComplete="new-password"
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="organization_id">Organization ID</label>
          <input
            id="organization_id"
            type="number"
            min="1"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            disabled={submitting}
          />
          <span className="hint">Use 1 if you ran db:seed (default org)</span>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </div>
  )
}
