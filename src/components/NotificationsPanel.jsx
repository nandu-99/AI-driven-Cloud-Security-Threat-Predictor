import { USER_NOTIFICATIONS, ANALYST_NOTIFICATIONS, ADMIN_NOTIFICATIONS } from '../mock-data/mockData.js'

function getNotifs(role) {
  if (role === 'analyst') return ANALYST_NOTIFICATIONS
  if (role === 'admin') return ADMIN_NOTIFICATIONS
  return USER_NOTIFICATIONS
}

const panelStyle = {
  position: 'fixed', top: 52, right: 12, width: 300,
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 8, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
}

export default function NotificationsPanel({ role, onClose }) {
  const notifs = getNotifs(role)
  return (
    <div style={panelStyle}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 11, color: 'var(--cyan)', letterSpacing: 1, textTransform: 'uppercase',
      }}>
        NOTIFICATIONS
        <span onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}>✕</span>
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
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{n.time}</div>
        </div>
      ))}
    </div>
  )
}
