import { useNavigate, useLocation } from 'react-router-dom'

const SIDEBARS = {
  user: [
    { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
    { id: 'activity',  icon: '◈', label: 'Activity' },
    { id: 'support',   icon: '◎', label: 'Support' },
  ],
  analyst: [
    { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
    { id: 'alerts',    icon: '⚠', label: 'Alerts' },
    { id: 'risk',      icon: '◈', label: 'Risk Overview' },
  ],
  admin: [
    { id: 'dashboard',  icon: '⬡', label: 'Dashboard' },
    { id: 'logs',       icon: '≡', label: 'Logs' },
    { id: 'monitoring', icon: '◎', label: 'Monitoring Settings' },
  ],
}

const ROLE_TITLES = {
  user: 'USER PORTAL',
  analyst: 'ANALYST SOC',
  admin: 'ADMIN CONTROL',
}

const styles = {
  sidebar: {
    width: 200, background: '#0c1220', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
  },
  sidebarLogo: { padding: 16, borderBottom: '1px solid var(--border)' },
  sysTitle: { fontSize: 9, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1.5 },
  navSection: { padding: '8px 0' },
  navLabel: { fontSize: 9, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase', padding: '8px 16px 4px' },
}

function navItemStyle(active) {
  return {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
    cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
    borderLeft: `2px solid ${active ? 'var(--cyan)' : 'transparent'}`,
    background: active ? '#0e2233' : 'transparent',
    color: active ? 'var(--cyan)' : 'var(--text2)',
  }
}

export default function Sidebar({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const items = SIDEBARS[role] || []
  const title = ROLE_TITLES[role] || ''
  const currentPage = location.pathname.split('/').pop()

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarLogo}>
        <div style={styles.sysTitle}>{title}<br />DASHBOARD</div>
      </div>
      <div style={styles.navSection}>
        <div style={styles.navLabel}>NAVIGATION</div>
        {items.map(item => (
          <div
            key={item.id}
            style={navItemStyle(currentPage === item.id)}
            onClick={() => navigate(`/app/${item.id}`)}
          >
            <span style={{ fontSize: 14, width: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
