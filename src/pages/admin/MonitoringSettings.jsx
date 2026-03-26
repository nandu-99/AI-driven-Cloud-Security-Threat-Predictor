import { useState } from 'react'
import { saveMonitoringSettings } from '../../services/api.js'
import { PageHeader, Card, CardTitle, Button, StatusDot, AlertToast } from '../../components/UI.jsx'

const SERVICES = [
  { label: 'Log Ingestion Service',     status: 'RUNNING',  color: 'green' },
  { label: 'ML Inference Engine',       status: 'ACTIVE',   color: 'green' },
  { label: 'Threat Intelligence Feed',  status: 'SYNCED',   color: 'cyan' },
  { label: 'Behaviour Drift Analyser',  status: 'RUNNING',  color: 'green' },
  { label: 'Alert Dispatcher',          status: 'STANDBY',  color: 'yellow' },
]

export default function MonitoringSettings({ isAdmin = false }) {
  const [hours, setHours]   = useState('02')
  const [mins,  setMins]    = useState('30')
  const [toast, setToast]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      await saveMonitoringSettings({ hours, minutes: mins })
      setToast(`Ingestion interval saved: ${hours}h ${mins}m`)
      setTimeout(() => setToast(''), 3000)
    } catch (e) { setToast('Error: ' + e.message) } finally { setLoading(false) }
  }

  function pad(val) { return String(parseInt(val) || 0).padStart(2, '0') }

  return (
    <div style={{ padding: 20 }}>
      <PageHeader
        title="MONITORING SETTINGS"
        sub={isAdmin ? 'Configure automated log ingestion timing' : 'View-only — configuration managed by Security Administrator'}
      />
      <AlertToast message={toast} />

      <Card style={{ marginBottom: 16 }}>
        <CardTitle>LOG INGESTION INTERVAL</CardTitle>

        <div style={{ fontSize: 36, color: 'var(--cyan)', fontFamily: '"Courier New", monospace', letterSpacing: 6, margin: '8px 0' }}>
          {hours}:{mins}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 16 }}>HH:MM — current automated log ingestion interval</div>

        {isAdmin ? (
          <>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>HOURS</label>
                <input
                  type="number" min="0" max="23" value={hours}
                  onChange={e => setHours(pad(e.target.value))}
                  style={{
                    background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5,
                    padding: 8, color: 'var(--cyan)', fontSize: 20, fontFamily: '"Courier New", monospace',
                    width: 80, textAlign: 'center', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>MINUTES</label>
                <input
                  type="number" min="0" max="59" value={mins}
                  onChange={e => setMins(pad(e.target.value))}
                  style={{
                    background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5,
                    padding: 8, color: 'var(--cyan)', fontSize: 20, fontFamily: '"Courier New", monospace',
                    width: 80, textAlign: 'center', outline: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button variant="cyan" onClick={handleSave} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'SAVING...' : 'SAVE INTERVAL'}
              </Button>
              <Button variant="outline" onClick={() => { setHours('02'); setMins('30') }}>RESET DEFAULT</Button>
            </div>
          </>
        ) : (
          <div style={{ padding: '8px 12px', background: '#0d1426', borderRadius: 4, fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            ⚠ View only — contact your Security Administrator to modify ingestion settings
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>SYSTEM STATUS</CardTitle>
        {SERVICES.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < SERVICES.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <StatusDot color={s.color} />
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text2)' }}>{s.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              color: { green: 'var(--neon)', yellow: 'var(--yellow)', cyan: 'var(--cyan)' }[s.color],
            }}>{s.status}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
