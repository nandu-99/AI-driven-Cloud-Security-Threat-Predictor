import { useState, useEffect } from 'react'
import { getUserDashboard, getNotifications, simulateHybridAlert } from '../../services/api.js'
import { PageHeader, Card, CardTitle, StatusDot, AlertToast, Grid } from '../../components/UI.jsx'

const page = { padding: 20 }

const DEFAULT_MODEL = {
  userId: 'USR-1021',
  riskScore: 55,
  anomalyScore: 44,
  driftScore: 38,
  fileAccess: 18,
  session: '1h 45m',
  geoAnomalies: 1,
  offHours: false,
  baselineDeviation: '1.9x',
  modelVersion: 'v2.1.4',
  lastUpdate: '2025-01-15 10:32',
}

export default function UserDashboard() {
  const [data, setData] = useState(null)
  const [toast, setToast] = useState('')
  const [notifications, setNotifications] = useState([])
  const [lastRisk, setLastRisk] = useState('')

  const [model, setModel] = useState({ ...DEFAULT_MODEL })

  useEffect(() => {
    getUserDashboard().then(setData)
    getNotifications().then(res => setNotifications(Array.isArray(res) ? res : [])).catch(() => setNotifications([]))
    const notifId = setInterval(() => getNotifications().then(res => setNotifications(Array.isArray(res) ? res : []))
      .catch(() => setNotifications([])), 5000)
    return () => { clearInterval(notifId) }
  }, [])

  // Hybrid alert is user-controlled via the inputs below

  function getChangedColumnCount() {
    const keys = [
      'userId',
      'riskScore',
      'anomalyScore',
      'driftScore',
      'fileAccess',
      'session',
      'geoAnomalies',
      'offHours',
      'baselineDeviation',
      'modelVersion',
      'lastUpdate',
    ]

    let changed = 0
    for (const k of keys) {
      const a = model[k]
      const b = DEFAULT_MODEL[k]
      const isNum = typeof b === 'number'
      if (isNum) {
        if (Number(a) !== Number(b)) changed += 1
      } else {
        if (String(a ?? '').trim() !== String(b ?? '').trim()) changed += 1
      }
    }
    return changed
  }

  function parseModelForApi() {
    const currentUser = (() => {
      try { return JSON.parse(localStorage.getItem('currentUser') || '{}') } catch { return {} }
    })()
    const emailKey = String(currentUser?.email || '').trim().toLowerCase()
    let loginAttempts = 0
    let failedLogins = 0
    try {
      const raw = localStorage.getItem('mockAuthStats') || '{}'
      const stats = JSON.parse(raw)
      if (stats && typeof stats === 'object' && stats[emailKey]) {
        loginAttempts = Number(stats[emailKey].loginAttempts || 0)
        failedLogins = Number(stats[emailKey].failedLogins || 0)
      }
    } catch {
      // ignore
    }

    return {
      userId: String(model.userId || '').trim(),
      riskScore: Number(model.riskScore),
      anomalyScore: Number(model.anomalyScore),
      driftScore: Number(model.driftScore),
      loginAttempts,
      failedLogins,
      fileAccess: Number(model.fileAccess),
      session: String(model.session || '').trim(),
      geoAnomalies: Number(model.geoAnomalies),
      offHours: !!model.offHours,
      baselineDeviation: String(model.baselineDeviation || '').trim(),
      modelVersion: String(model.modelVersion || '').trim(),
      lastUpdate: String(model.lastUpdate || '').trim(),
    }
  }

  async function handleHybridAlert() {
    const changedCount = getChangedColumnCount()
    const parsedModel = parseModelForApi()
    try {
      const res = await simulateHybridAlert(parsedModel, changedCount)
      const sev = String(res?.alertSeverity || '').toLowerCase()
      setLastRisk(sev)
      setToast(`Hybrid alert sent. Severity: ${String(res?.alertSeverity || '').toUpperCase()} (changed ${changedCount} fields)`)
      const refreshed = await getNotifications()
      setNotifications(Array.isArray(refreshed) ? refreshed : [])
    } catch (e) {
      setToast('Error: ' + e.message)
    }
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
        </Grid>
      )}

      <Grid cols={2} gap={16}>
        <Card>
          <CardTitle>HYBRID CONTROLS</CardTitle>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.5 }}>
            Change multiple columns, then trigger Hybrid Alert.
            Severity rules: &lt;=2 changed =&gt; Critical, 3 =&gt; Low, 4-5 =&gt; Medium, &gt;=6 =&gt; High.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>User ID</label>
              <input
                value={model.userId}
                onChange={e => setModel(prev => ({ ...prev, userId: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Risk score</label>
              <input
                type="number"
                value={model.riskScore}
                onChange={e => setModel(prev => ({ ...prev, riskScore: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Anomaly score</label>
              <input
                type="number"
                value={model.anomalyScore}
                onChange={e => setModel(prev => ({ ...prev, anomalyScore: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Drift score</label>
              <input
                type="number"
                value={model.driftScore}
                onChange={e => setModel(prev => ({ ...prev, driftScore: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>File access</label>
              <input
                type="number"
                value={model.fileAccess}
                onChange={e => setModel(prev => ({ ...prev, fileAccess: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Session</label>
              <input
                value={model.session}
                onChange={e => setModel(prev => ({ ...prev, session: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Geo anomalies</label>
              <input
                type="number"
                value={model.geoAnomalies}
                onChange={e => setModel(prev => ({ ...prev, geoAnomalies: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
              <input
                type="checkbox"
                checked={model.offHours}
                onChange={e => setModel(prev => ({ ...prev, offHours: e.target.checked }))}
              />
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Off-hours</label>
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Baseline deviation</label>
              <input
                value={model.baselineDeviation}
                onChange={e => setModel(prev => ({ ...prev, baselineDeviation: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Model version</label>
              <input
                value={model.modelVersion}
                onChange={e => setModel(prev => ({ ...prev, modelVersion: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>Last update</label>
              <input
                value={model.lastUpdate}
                onChange={e => setModel(prev => ({ ...prev, lastUpdate: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5, padding: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              onClick={handleHybridAlert}
              style={{ background: 'var(--cyan2)', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: 6, cursor: 'pointer', width: '100%', fontSize: 12, fontFamily: 'inherit', letterSpacing: 1, textTransform: 'uppercase', opacity: 1 }}
            >
              Trigger Hybrid Alert
            </button>
          </div>
        </Card>

        <Card>
          <CardTitle>RECENT NOTIFICATIONS</CardTitle>
          {notifications.map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{n.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{n.time}</div>
                {Array.isArray(n.details) && n.details.length > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>
                    {n.details.slice(0, 6).map((d, idx) => (
                      <div key={idx}>{d}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>No notifications yet.</div>
          )}
        </Card>
      </Grid>

    </div>
  )
}
