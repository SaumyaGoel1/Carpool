import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from './App'

describe('App', () => {
  it('shows login when unauthenticated', async () => {
    render(<App />)
    expect(await screen.findByText(/log in/i)).toBeInTheDocument()
  })
})
