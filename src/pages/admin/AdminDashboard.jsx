import { useState, useEffect } from 'react'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getAdminDashboard, adminUserAction } from '../../services/api.js'
import { PageHeader, Card, CardTitle, Badge, Button, Grid, AlertToast } from '../../components/UI.jsx'
import { MOCK_USERS, LOGIN_TREND, ALERT_SEVERITY } from '../../mock-data/mockData.js'

const TT   = { contentStyle: { background: '#0d1426', border: '1px solid #1e3a4a', color: '#e2e8f0', fontSize: 11 } }
const TICK = { fill: '#64748b', fontSize: 10 }
const SEVERITY_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e']

const XAI_RAW_DATA = [
  {
    userId: 'USR-1021', riskScore: 92, anomalyScore: 88, driftScore: 74,
    loginAttempts: 14, failedLogins: 8, fileAccess: 47, sessionDuration: '4h 22m',
    geoAnomalies: 2, offHoursAccess: true, baselineDeviation: '3.4×', modelVersion: 'v2.1.4',
    lastUpdated: '2025-01-15 09:14',
    flags: [
      'Attempted to login 14 times — 8 of those failed within a 30-minute window',
      'Accessed 47 privileged files in a single session, all between 01:00–04:00',
      'Triggered 2 geographic location anomalies — logins from 2 different regions',
      'Session lasted 4h 22m — 3.4× longer than this user\'s average session',
      'Attempted to access 3 restricted directories without permission',
    ],
  },
  {
    userId: 'USR-1072', riskScore: 95, anomalyScore: 91, driftScore: 83,
    loginAttempts: 19, failedLogins: 12, fileAccess: 83, sessionDuration: '6h 10m',
    geoAnomalies: 3, offHoursAccess: true, baselineDeviation: '4.1×', modelVersion: 'v2.1.4',
    lastUpdated: '2025-01-15 07:48',
    flags: [
      'Attempted to login 19 times — 12 failed, a 63% failure rate in under 15 minutes',
      'Accessed 83 privileged files — highest file access count recorded this session',
      'Triggered 3 geographic anomalies — logins from 3 different regions in 2 hours',
      'Session lasted 6h 10m — 4.1× above this user\'s normal session duration',
      'Attempted privilege escalation 5 times — all denied by access control',
      'Downloaded 14 sensitive documents flagged as restricted exports',
    ],
  },
  {
    userId: 'USR-1043', riskScore: 67, anomalyScore: 55, driftScore: 42,
    loginAttempts: 6, failedLogins: 2, fileAccess: 18, sessionDuration: '1h 45m',
    geoAnomalies: 1, offHoursAccess: false, baselineDeviation: '1.8×', modelVersion: 'v2.1.4',
    lastUpdated: '2025-01-15 10:32',
    flags: [
      'Attempted to login 6 times — 2 failed from an unrecognised location',
      'Triggered 1 geographic anomaly — login from a country never seen for this account',
      'Accessed 18 files — 1.8× above the normal daily average for this user',
      'Attempted to access 1 restricted directory — denied once',
      'Login occurred 4 hours outside this user\'s normal active window',
    ],
  },
  {
    userId: 'USR-1088', riskScore: 58, anomalyScore: 44, driftScore: 31,
    loginAttempts: 5, failedLogins: 1, fileAccess: 22, sessionDuration: '2h 12m',
    geoAnomalies: 0, offHoursAccess: false, baselineDeviation: '2.0×', modelVersion: 'v2.1.4',
    lastUpdated: '2025-01-15 12:00',
    flags: [
      'Attempted to login 5 times — 1 failed from a recognised location',
      'Accessed 22 files — 2.0× above the daily average of 11 files for this user',
      'Session lasted 2h 12m — 2× longer than the typical session of 1h 05m',
      '0 geographic anomalies detected — all logins from known locations',
    ],
  },
  {
    userId: 'USR-1055', riskScore: 12, anomalyScore: 8, driftScore: 5,
    loginAttempts: 2, failedLogins: 0, fileAccess: 7, sessionDuration: '0h 38m',
    geoAnomalies: 0, offHoursAccess: false, baselineDeviation: '0.9×', modelVersion: 'v2.1.4',
    lastUpdated: '2025-01-15 11:05',
    flags: [
      'Attempted to login 2 times — 0 failures, both from known locations',
      'Accessed 7 files — within the normal daily range for this user',
      'Session lasted 38 minutes — consistent with average usage of 40 minutes',
      '0 anomalies detected across all monitored dimensions',
    ],
  },
]

function riskColor(score) {
  if (score >= 80) return 'var(--red)'
  if (score >= 50) return 'var(--yellow)'
  return 'var(--neon)'
}

export default function AdminDashboard() {
  const [data, setData]         = useState(null)
  const [toast, setToast]       = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { getAdminDashboard().then(setData) }, [])

  async function doAction(userId, action) {
    const labels = { lock: 'Account locked', unlock: 'Account unlocked', reset: 'Force reset triggered' }
    try {
      await adminUserAction({ userId, action })
      setToast(`${labels[action]} — ${userId}`)
      setTimeout(() => setToast(''), 3000)
    } catch (e) { setToast('Error: ' + e.message) }
  }

  function toggleExpand(userId) {
    setExpanded(prev => prev === userId ? null : userId)
  }

  return (
    <div style={{ padding: 20 }}>
      <PageHeader title="ADMIN DASHBOARD" sub="System-wide security control panel" />
      <AlertToast message={toast} />

      {data && (
        <Grid cols={4} gap={12}>
          {[
            { label: 'TOTAL USERS',     value: data.totalUsers,     color: 'var(--text)' },
            { label: 'ACTIVE SESSIONS', value: data.activeSessions, color: 'var(--cyan)' },
            { label: 'CRITICAL ALERTS', value: data.criticalAlerts, color: 'var(--red)' },
            { label: 'LOCKED ACCOUNTS', value: data.lockedAccounts, color: 'var(--yellow)' },
          ].map(m => (
            <Card key={m.label}>
              <CardTitle>{m.label}</CardTitle>
              <div style={{ fontSize: 26, fontWeight: 700, color: m.color }}>{m.value}</div>
            </Card>
          ))}
        </Grid>
      )}

      {/* USER ACTIONS TABLE */}
      <Card style={{ marginBottom: 20 }}>
        <CardTitle>USER ACTIONS</CardTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['User ID', 'Risk', 'Status', 'Force Reset', 'Lock', 'Unlock'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px' }}><span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{u.id}</span></td>
                  <td style={{ padding: '10px 14px' }}><Badge variant={u.risk}>{u.risk}</Badge></td>
                  <td style={{ padding: '10px 14px' }}><Badge variant="cyan">{u.status}</Badge></td>
                  <td style={{ padding: '10px 14px' }}><Button variant="yellow" onClick={() => doAction(u.id, 'reset')}>↻ Reset</Button></td>
                  <td style={{ padding: '10px 14px' }}><Button variant="red"    onClick={() => doAction(u.id, 'lock')}>🔒 Lock</Button></td>
                  <td style={{ padding: '10px 14px' }}><Button variant="green"  onClick={() => doAction(u.id, 'unlock')}>🔓 Unlock</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CHARTS */}
      <Grid cols={2} gap={16}>
        <Card>
          <CardTitle>LOGIN ATTEMPTS OVER TIME</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={LOGIN_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="t" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="attempts" stroke="#06b6d4" strokeWidth={2} name="Login Attempts" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>ALERT SEVERITY DISTRIBUTION</CardTitle>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {ALERT_SEVERITY.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: SEVERITY_COLORS[i], display: 'inline-block' }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={ALERT_SEVERITY}
                cx="50%" cy="50%"
                innerRadius={52} outerRadius={78}
                dataKey="value"
                paddingAngle={3}
                label={false}
              >
                {ALERT_SEVERITY.map((_, i) => <Cell key={i} fill={SEVERITY_COLORS[i]} stroke="transparent" />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      {/* EXPLAINABLE AI — FULL RAW DATA */}
      <Card style={{ marginTop: 20 }}>
        <CardTitle>EXPLAINABLE AI — RAW MODEL OUTPUT</CardTitle>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 14 }}>
          Full inference data with exact counts and flags. Click any row to expand detailed reasons.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['User ID', 'Risk Score', 'Anomaly Score', 'Drift Score', 'Login Attempts', 'Failed Logins', 'File Access', 'Session', 'Geo Anomalies', 'Off-Hours', 'Baseline Dev.', 'Model Ver.', 'Last Updated', 'Details'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 9, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {XAI_RAW_DATA.map(x => (
                <>
                  <tr
                    key={x.userId}
                    style={{ borderBottom: expanded === x.userId ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => toggleExpand(x.userId)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 12px' }}><span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{x.userId}</span></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: riskColor(x.riskScore), fontWeight: 700 }}>{x.riskScore}</span></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: riskColor(x.anomalyScore) }}>{x.anomalyScore}</span></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: riskColor(x.driftScore) }}>{x.driftScore}</span></td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{x.loginAttempts}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: x.failedLogins > 5 ? 'var(--red)' : x.failedLogins > 1 ? 'var(--yellow)' : 'var(--neon)' }}>{x.failedLogins}</span></td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{x.fileAccess}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{x.sessionDuration}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: x.geoAnomalies > 0 ? 'var(--red)' : 'var(--neon)' }}>{x.geoAnomalies}</span></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: x.offHoursAccess ? 'var(--red)' : 'var(--neon)' }}>{x.offHoursAccess ? 'YES' : 'NO'}</span></td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{x.baselineDeviation}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{x.modelVersion}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{x.lastUpdated}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: 'var(--cyan)', fontSize: 11 }}>{expanded === x.userId ? '▲ Hide' : '▼ Flags'}</span>
                    </td>
                  </tr>

                  {expanded === x.userId && (
                    <tr key={`${x.userId}-flags`} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={14} style={{ padding: '0 12px 14px 12px' }}>
                        <div style={{ background: '#0c1a2e', border: '1px solid var(--cyan3)', borderRadius: 6, padding: 14 }}>
                          <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                            Raw Model Flags — {x.userId}
                          </div>
                          {x.flags.map((flag, fi) => (
                            <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                              <span style={{
                                color: '#fff', background: 'var(--cyan2)', fontSize: 10,
                                padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap',
                                flexShrink: 0, marginTop: 1, fontWeight: 700,
                              }}>
                                {fi + 1}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{flag}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
