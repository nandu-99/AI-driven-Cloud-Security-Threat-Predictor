import { useState } from 'react'
import { sendSupportMessage } from '../../services/api.js'
import { PageHeader, Card, AlertToast, ErrorMsg } from '../../components/UI.jsx'

const inputStyle = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)',
  borderRadius: 6, padding: '10px 12px', color: 'var(--text)',
  fontFamily: '"Times New Roman", Times, serif', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle = { fontSize: 11, color: 'var(--text2)', marginBottom: 6, display: 'block', letterSpacing: 1, textTransform: 'uppercase' }

export default function UserSupport() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    setError('')
    if (!subject.trim() || !message.trim()) { setError('Please fill in both subject and message'); return }
    setLoading(true)
    try {
      const res = await sendSupportMessage({ subject, message })
      setSuccess(`Message sent — Ticket ${res.ticketId}. An analyst will respond within 24 hours.`)
      setSubject('')
      setMessage('')
      setTimeout(() => setSuccess(''), 6000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <PageHeader title="SUPPORT CENTER" sub="Send a message to the security analyst team" />
      <AlertToast message={success} />
      <ErrorMsg message={error} />

      <Card style={{ maxWidth: 560 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Subject</label>
          <input style={inputStyle} type="text" placeholder="Describe your issue briefly"
            value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Message</label>
          <textarea
            style={{ ...inputStyle, height: 130, resize: 'vertical' }}
            placeholder="Describe your issue in detail..."
            value={message} onChange={e => setMessage(e.target.value)}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            background: 'var(--cyan2)', border: 'none', color: '#fff',
            padding: '10px 24px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit',
            cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'SENDING...' : 'SEND MESSAGE →'}
        </button>
      </Card>
    </div>
  )
}
