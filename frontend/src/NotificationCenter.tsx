import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export type NotificationItem = {
  id: number
  type: string
  reference_type: string | null
  reference_id: number | null
  read_at: string | null
  created_at: string
}

const TYPE_SUMMARY: Record<string, string> = {
  new_request_on_my_ride_offer: 'New request on your ride offer',
  request_approved: 'Your ride request was approved',
  request_rejected: 'Your ride request was rejected',
}

function getNotificationLink(n: NotificationItem): string {
  if (n.type === 'new_request_on_my_ride_offer') return '/driver-requests'
  if (n.type === 'request_approved' || n.type === 'request_rejected') return '/my-requests'
  return '/'
}

function getSummary(n: NotificationItem): string {
  return TYPE_SUMMARY[n.type] ?? n.type
}

const apiBase = () => import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function NotificationCenter() {
  const { token } = useAuth()
  const [list, setList] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase()}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = (await res.json()) as NotificationItem[]
        setList(data)
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchNotifications()
    const t = setInterval(fetchNotifications, 60000)
    return () => clearInterval(t)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markRead = useCallback(
    async (id: number) => {
      if (!token) return
      try {
        await fetch(`${apiBase()}/api/notifications/${id}/mark_read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        })
        setList((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        )
      } catch {
        // ignore
      }
    },
    [token]
  )

  const markAllRead = useCallback(async () => {
    if (!token) return
    try {
      await fetch(`${apiBase()}/api/notifications/mark_all_read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setList((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    } catch {
      // ignore
    }
  }, [token])

  const handleItemClick = useCallback(
    (n: NotificationItem) => {
      if (!n.read_at) markRead(n.id)
      setOpen(false)
      navigate(getNotificationLink(n))
    },
    [navigate, markRead]
  )

  const unreadCount = list.filter((n) => !n.read_at).length

  return (
    <div className="notification-center" ref={ref}>
      <button
        type="button"
        className="notification-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <span className="notification-bell-icon" aria-hidden>
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" className="notification-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {loading ? (
            <p className="notification-empty">Loading…</p>
          ) : list.length === 0 ? (
            <p className="notification-empty">No notifications</p>
          ) : (
            <ul className="notification-list">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notification-item ${n.read_at ? '' : 'notification-item-unread'}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <span className="notification-summary">{getSummary(n)}</span>
                    <span className="notification-time">
                      {new Date(n.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
