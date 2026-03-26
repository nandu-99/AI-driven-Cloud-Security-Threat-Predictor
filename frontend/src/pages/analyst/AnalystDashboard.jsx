import { useState, useEffect } from 'react'
import { getAnalystDashboard, markInvestigated, escalateAlert, respondToUser, sendNotification } from '../../services/api.js'
import { PageHeader, Card, CardTitle, Badge, Button, Grid, AlertToast } from '../../components/UI.jsx'

const STATUS_BADGE = { 'Under Investigation': 'yellow', 'Monitoring': 'cyan', 'Clear': 'green', 'Escalated': 'red', 'Investigated': 'green' }

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
  const [notifyMessage, setNotifyMessage] = useState('')
  const [notifyUserId, setNotifyUserId] = useState('')
  const [toUser, setToUser] = useState(true)
  const [toAdmin, setToAdmin] = useState(true)
  const [sending, setSending] = useState(false)
  const [respondedUsers, setRespondedUsers] = useState({})

  useEffect(() => {
    getAnalystDashboard().then(setData)
    const id = setInterval(() => getAnalystDashboard().then(setData), 5000)
    return () => { clearInterval(id) }
  }, [])

  async function action(fn, args, msg) {
    try {
      await fn(args)
      setToast(msg)
      getAnalystDashboard().then(setData)
      setTimeout(() => setToast(''), 3000)
    } catch (e) { setToast('Error: ' + e.message) }
  }

  async function sendAnalystNotification() {
    const receiverRoles = [
      ...(toUser ? ['user'] : []),
      ...(toAdmin ? ['admin'] : []),
    ]
    if (!notifyMessage.trim()) return setToast('Message is required')
    if (!receiverRoles.length) return setToast('Select at least one receiver role')
    try {
      setSending(true)
      await sendNotification({ receiverRoles, message: notifyMessage, userId: notifyUserId })
      setToast(`Notification sent to ${receiverRoles.join(', ')}`)
      setNotifyMessage('')
      setNotifyUserId('')
      setTimeout(() => setToast(''), 3000)
    } catch (e) {
      setToast('Error: ' + e.message)
    } finally {
      setSending(false)
    }
  }

  async function handleRespond(userId) {
    if (respondedUsers[userId]) return
    try {
      await respondToUser({ userId, message: 'Under review' })
      setRespondedUsers(prev => ({ ...prev, [userId]: true }))
      setToast(`Response sent — ${userId}`)
      getAnalystDashboard().then(setData)
      setTimeout(() => setToast(''), 3000)
    } catch (e) {
      setToast('Error: ' + e.message)
    }
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
        <CardTitle>SEND NOTIFICATION</CardTitle>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            value={notifyUserId}
            onChange={e => setNotifyUserId(e.target.value)}
            placeholder="Optional User ID (e.g. USR-1043)"
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text)' }}
          />
          <textarea
            value={notifyMessage}
            onChange={e => setNotifyMessage(e.target.value)}
            placeholder="Write a notification for users/admin..."
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text)', minHeight: 80 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text2)' }}>
            <label><input type="checkbox" checked={toUser} onChange={e => setToUser(e.target.checked)} /> User</label>
            <label><input type="checkbox" checked={toAdmin} onChange={e => setToAdmin(e.target.checked)} /> Admin</label>
            <Button onClick={sendAnalystNotification} style={{ marginLeft: 'auto' }}>
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardTitle>USER RISK TABLE</CardTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['User ID', 'Risk Level', 'Login Attempts', 'Failed Logins', 'Investigation Status', 'Actions'].map(h => (
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
                  <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{u.loginAttempts ?? 0}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{u.failedLogins ?? 0}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <Badge variant={STATUS_BADGE[u.status] || 'default'}>{u.status}</Badge>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Button
                        variant="green"
                        onClick={() => {
                          if (u.status === 'Investigated') return
                          action(markInvestigated, { userId: u.id, note: 'Reviewed suspicious behavior' }, `Marked investigated — ${u.id}`)
                        }}
                      >
                        {u.status === 'Investigated' ? '✓ Investigated' : 'Investigate'}
                      </Button>
                      <Button
                        variant="yellow"
                        onClick={() => {
                          if (u.status === 'Escalated') return
                          action(escalateAlert, { userId: u.id, reason: 'Manual escalation', receiverRole: 'admin' }, `Escalated to admin — ${u.id}`)
                        }}
                      >
                        {u.status === 'Escalated' ? 'Escalated' : '↑ Escalate'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRespond(u.id)}
                      >
                        {respondedUsers[u.id] ? '✓ Response sent' : '✉ Respond'}
                      </Button>
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
