import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app" style={{ padding: '2rem', maxWidth: '40rem', margin: '0 auto' }}>
          <h1>Something went wrong</h1>
          <p className="error">{this.state.error?.message || 'Unknown error'}</p>
          <p>Open the browser console (F12 → Console) for details.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
