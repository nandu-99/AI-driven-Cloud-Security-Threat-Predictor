import { useState, useEffect } from 'react'
import { getAnalystDashboard, markInvestigated, escalateAlert, respondToUser } from '../../services/api.js'
import { PageHeader, Card, CardTitle, Badge, Button, Grid, AlertToast } from '../../components/UI.jsx'

const STATUS_BADGE = { 'Under Investigation': 'yellow', 'Monitoring': 'cyan', 'Clear': 'green', 'Escalated': 'red' }

const XAI_USER_REASONS = [
  {
    userId: 'USR-1021',
    reason: 'Excess login attempts than usual. Accessed significantly more privileged files than normal, mostly outside working hours.',
  },
  {
    userId: 'USR-1072',
    reason: 'Logged in from multiple unusual locations in a very short time. Session lasted far longer than usual for this user.',
  },
  {
    userId: 'USR-1043',
    reason: 'Logged in from an unrecognised location not seen before. Access occurred at an unusual time compared to normal behaviour.',
  },
  {
    userId: 'USR-1088',
    reason: 'Session ran longer than usual. Accessed more files than typically expected for this user during a single session.',
  },
  {
    userId: 'USR-1055',
    reason: 'No unusual activity detected. Behaviour appears normal and consistent with typical usage patterns.',
  },
]

export default function AnalystDashboard() {
  const [data, setData] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { getAnalystDashboard().then(setData) }, [])

  async function action(fn, args, msg) {
    try {
      await fn(args)
      setToast(msg)
      setTimeout(() => setToast(''), 3000)
    } catch (e) { setToast('Error: ' + e.message) }
  }

  return (
    <div style={{ padding: 20 }}>
      <PageHeader title="ANALYST DASHBOARD" sub="Threat monitoring and investigation overview" />
      <AlertToast message={toast} />

      {data && (
        <Grid cols={4} gap={12}>
          {[
            { label: 'HIGH RISK',            value: data.highRisk,           color: 'var(--red)' },
            { label: 'UNDER INVESTIGATION',  value: data.underInvestigation,  color: 'var(--yellow)' },
            { label: 'ESCALATED',            value: data.escalated,          color: 'var(--orange)' },
            { label: 'CLEARED TODAY',        value: data.clearedToday,       color: 'var(--neon)' },
          ].map(m => (
            <Card key={m.label}>
              <CardTitle>{m.label}</CardTitle>
              <div style={{ fontSize: 26, fontWeight: 700, color: m.color }}>{m.value}</div>
            </Card>
          ))}
        </Grid>
      )}

      <Card style={{ marginBottom: 16 }}>
        <CardTitle>USER RISK TABLE</CardTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['User ID', 'Risk Level', 'Investigation Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{u.id}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <Badge variant={u.risk}>{u.risk}</Badge>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <Badge variant={STATUS_BADGE[u.status] || 'default'}>{u.status}</Badge>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Button variant="green"   onClick={() => action(markInvestigated, { userId: u.id }, `Marked investigated — ${u.id}`)}>✓ Investigated</Button>
                      <Button variant="yellow"  onClick={() => action(escalateAlert,    { userId: u.id, reason: 'Manual escalation' }, `Escalated — ${u.id}`)}>↑ Escalate</Button>
                      <Button variant="outline" onClick={() => action(respondToUser,    { userId: u.id, message: 'Under review' }, `Response sent — ${u.id}`)}>✉ Respond</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* EXPLAINABLE AI ABSTRACTION LAYER */}
      <Card>
        <CardTitle>EXPLAINABLE AI — ABSTRACTION LAYER</CardTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase', whiteSpace: 'nowrap', width: 120 }}>User ID</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase' }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {XAI_USER_REASONS.map((x) => (
                <tr key={x.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                    <span style={{ color: 'var(--cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>{x.userId}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{x.reason}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
