import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_LABELS = { user: 'USER', analyst: 'ANALYST', admin: 'ADMINISTRATOR' }

const styles = {
  navbar: {
    background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
    padding: '0 20px', height: 52, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexShrink: 0, zIndex: 100,
  },
  logo: { color: 'var(--cyan)', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  bellBtn: {
    background: 'none', border: '1px solid var(--slate2)', color: 'var(--text2)',
    width: 32, height: 32, borderRadius: 6, cursor: 'pointer', position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
  },
  badge: {
    position: 'absolute', top: -4, right: -4, background: 'var(--red)',
    color: '#fff', fontSize: 9, width: 16, height: 16, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userPill: {
    background: 'var(--slate)', border: '1px solid var(--slate2)',
    padding: '4px 12px', borderRadius: 20, fontSize: 11, color: 'var(--text2)',
  },
  roleBadge: {
    background: 'var(--cyan3)', color: 'var(--cyan)', fontSize: 10,
    padding: '2px 8px', borderRadius: 10, marginLeft: 6,
  },
  logoutBtn: {
    background: 'none', border: '1px solid var(--slate2)', color: 'var(--text3)',
    fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
  },
}

export default function Navbar({ showNotif, setShowNotif, notificationCount = 0 }) {
  const { currentUser, logoutUser } = useAuth()
  const navigate = useNavigate()
  const role = currentUser?.role
  const username = currentUser?.email?.split('@')[0] || 'user'

  function handleLogout() {
    logoutUser()
    navigate('/login')
  }

  return (
    <div style={styles.navbar}>
      <div style={styles.logo}>THREAT PREDICTOR</div>
      <div style={styles.navRight}>
        <button style={styles.bellBtn} onClick={() => setShowNotif(!showNotif)}>
          🔔
          {notificationCount > 0 && (
            <span style={{
              ...styles.badge,
              minWidth: 16,
              padding: notificationCount > 99 ? '0 4px' : 0,
              fontSize: notificationCount > 99 ? 8 : 9,
            }}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
        <div style={styles.userPill}>
          {username}
          <span style={styles.roleBadge}>{ROLE_LABELS[role] || role}</span>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>LOGOUT</button>
      </div>
    </div>
  )
}
