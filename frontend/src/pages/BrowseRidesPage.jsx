import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchWithAuth } from '../lib/api'

export function BrowseRidesPage() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ from: '', to: '', min_seats: '' })

  function load() {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (filters.from.trim()) params.set('from', filters.from.trim())
    if (filters.to.trim()) params.set('to', filters.to.trim())
    if (filters.min_seats.trim() && parseInt(filters.min_seats, 10) > 0) params.set('min_seats', filters.min_seats.trim())
    const qs = params.toString()
    const url = `/api/rides/offers${qs ? `?${qs}` : ''}`
    fetchWithAuth(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load rides')
        return res.json()
      })
      .then((data) => setOffers(data.offers || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleFilterSubmit(e) {
    e.preventDefault()
    load()
  }

  return (
    <div className="app">
      <h1>Browse available rides</h1>
      <p><Link to="/">← Home</Link></p>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleFilterSubmit} className="filter-form">
        <div className="filter-row">
          <input
            type="text"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            placeholder="From (address)"
          />
          <input
            type="text"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            placeholder="To (address)"
          />
          <input
            type="number"
            name="min_seats"
            min="1"
            value={filters.min_seats}
            onChange={handleFilterChange}
            placeholder="Min seats"
          />
          <button type="submit">Search</button>
        </div>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : offers.length === 0 ? (
        <p>No available rides match your filters.</p>
      ) : (
        <ul className="offers-list">
          {offers.map((offer) => (
            <li key={offer.id} className="offer-item">
              <div className="offer-summary">
                <strong>{offer.start_address}</strong> → <strong>{offer.end_address}</strong>
              </div>
              <div className="offer-meta">
                {offer.departure_time && <span>Departs {offer.departure_time}</span>}
                {offer.recurrence && <span> · {offer.recurrence}</span>}
                <span> · {offer.seats_available} seat(s) available</span>
              </div>
              <div className="offer-driver">
                Driver: {offer.driver?.name || offer.driver?.email || '—'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
