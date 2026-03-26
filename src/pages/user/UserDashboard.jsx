import { useState, useEffect } from 'react'
import { getUserDashboard } from '../../services/api.js'
import { PageHeader, Card, CardTitle, StatusDot, AlertToast, Grid } from '../../components/UI.jsx'
import { USER_NOTIFICATIONS } from '../../mock-data/mockData.js'

const page = { padding: 20 }

export default function UserDashboard() {
  const [data, setData] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getUserDashboard().then(setData)
  }, [])

  function simulate(label) {
    setToast(`"${label}" simulated — event logged to system`)
    setTimeout(() => setToast(''), 3500)
  }

  return (
    <div style={page}>
      <PageHeader title="USER DASHBOARD" sub="Your account overview and activity" />
      <AlertToast message={toast} />

      {data && (
        <Grid cols={4} gap={12}>
          <Card>
            <CardTitle>ACCOUNT STATUS</CardTitle>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <StatusDot color="green" />
              <span style={{ color: 'var(--neon)', fontSize: 13 }}>ACTIVE</span>
            </div>
          </Card>
          <Card>
            <CardTitle>LAST LOGIN</CardTitle>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{data.lastLogin}</div>
          </Card>
          <Card>
            <CardTitle>SESSIONS TODAY</CardTitle>
            <div style={{ fontSize: 26, color: 'var(--text)', fontWeight: 700 }}>{data.sessionsToday}</div>
          </Card>
          <Card>
            <CardTitle>ALERTS</CardTitle>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <StatusDot color="yellow" />
              <span style={{ fontSize: 12, color: 'var(--yellow)' }}>{data.alerts} advisory</span>
            </div>
          </Card>
        </Grid>
      )}

      <Grid cols={2} gap={16}>
        <Card>
          <CardTitle>SIMULATE ACTIVITY</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Access Privileged File', icon: '📂', sub: 'Simulate privileged file access event' },
              { label: 'Multiple Login Attempts', icon: '🔑', sub: 'Simulate rapid login attempt pattern' },
              { label: 'Unusual Login Time', icon: '🌙', sub: 'Simulate off-hours login behaviour' },
            ].map(({ label, icon, sub }) => (
              <button
                key={label}
                onClick={() => simulate(label)}
                style={{
                  background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 6,
                  padding: 12, cursor: 'pointer', width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cyan)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--slate2)'}
              >
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>RECENT NOTIFICATIONS</CardTitle>
          {USER_NOTIFICATIONS.map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{n.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </Card>
      </Grid>
    </div>
  )
}
