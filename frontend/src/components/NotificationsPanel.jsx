import { useEffect, useState } from 'react'
import { clearNotifications, getNotifications } from '../services/api.js'

const panelStyle = {
  position: 'fixed', top: 52, right: 12, width: 300,
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 8, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
}

export default function NotificationsPanel({ role, onClose }) {
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    let mounted = true
    function load() {
      getNotifications(role)
        .then(res => { if (mounted) setNotifs(Array.isArray(res) ? res : []) })
        .catch(() => { if (mounted) setNotifs([]) })
    }
    load()
    const id = setInterval(load, 5000)
    return () => { mounted = false; clearInterval(id) }
  }, [role])

  return (
    <div style={panelStyle}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 11, color: 'var(--cyan)', letterSpacing: 1, textTransform: 'uppercase',
      }}>
        <span>NOTIFICATIONS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={async () => {
              try {
                await clearNotifications(role)
                setNotifs([])
              } catch {
                setNotifs([])
              }
            }}
            style={{
              background: 'none',
              border: '1px solid var(--slate2)',
              color: 'var(--text2)',
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 10,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontFamily: 'inherit',
              opacity: notifs.length ? 1 : 0.6,
            }}
            disabled={notifs.length === 0}
          >
            Clear all
          </button>
          <span onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}>✕</span>
        </div>
      </div>
      {notifs.map((n, i) => (
        <div key={i} style={{
          padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block', marginRight: 6 }} />
            {n.title}
          </div>
          {Array.isArray(n.details) && n.details.length > 0 && (
            <div style={{ marginLeft: 12 }}>
              {n.details.map((detail, idx) => (
                <div key={idx} style={{ fontSize: 10, color: 'var(--text2)', lineHeight: 1.5 }}>
                  {detail}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{n.time}</div>
        </div>
      ))}
      {notifs.length === 0 && (
        <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text3)' }}>
          No notifications yet.
        </div>
      )}
    </div>
  )
}
