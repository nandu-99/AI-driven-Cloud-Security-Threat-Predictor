import { useState, useEffect } from 'react'
import { getAnalystAlerts, escalateAlert } from '../../services/api.js'
import { PageHeader, Badge, Button, AlertToast } from '../../components/UI.jsx'

const XAI_REASONS = {
  'USR-1072': 'Excess login attempts than usual, with most of them failing. Accessed from locations not seen before for this account.',
  'USR-1021': 'Excess file access than usual, mostly during hours this user is not normally active.',
  'USR-1043': 'Accessed from an unfamiliar location. Login happened at an unusual time compared to normal.',
  'USR-1088': 'Session ran longer than usual. Accessed more files than normally expected.',
}

export default function AnalystAlerts() {
  const [alerts, setAlerts] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => { getAnalystAlerts().then(setAlerts) }, [])

  function notify(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div style={{ padding: 20 }}>
      <PageHeader title="ACTIVE ALERTS" sub="Real-time threat alert feed" />
      <AlertToast message={toast} />

      {alerts.map((a, i) => (
        <div key={i} style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: 14,
          marginBottom: 12,
          borderLeft: `3px solid ${a.level === 'high' ? 'var(--red)' : 'var(--yellow)'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
            <span style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: 13 }}>{a.id}</span>
            <Badge variant={a.level === 'high' ? 'red' : 'yellow'}>{a.level.toUpperCase()}</Badge>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{a.desc}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10 }}>Flagged: {a.time} today</div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <Button variant="cyan"    onClick={() => notify(`Investigating ${a.id}`)}>Investigate</Button>
            <Button variant="yellow"  onClick={() => escalateAlert({ userId: a.id, reason: 'Alert escalation' }).then(() => notify(`Escalated ${a.id}`))}>Escalate</Button>
            <Button variant="outline" onClick={() => notify(`${a.id} dismissed`)}>Dismiss</Button>
          </div>

          <div style={{
            background: '#0a1628',
            border: '1px solid #1a3a5a',
            borderRadius: 5,
            padding: '10px 14px',
          }}>
            <div style={{
              fontSize: 9, color: 'var(--cyan)', letterSpacing: 2,
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Explainable AI — Abstraction Layer
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{
                color: 'var(--cyan)', fontWeight: 700, fontSize: 12,
                whiteSpace: 'nowrap', paddingTop: 2, minWidth: 80,
              }}>
                {a.id}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
                {XAI_REASONS[a.id] || 'More unusual activity than normal. Further review recommended.'}
              </span>
            </div>
          </div>

        </div>
      ))}
    </div>
  )
}
