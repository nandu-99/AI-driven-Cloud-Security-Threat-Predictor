import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../services/api.js'
import { ErrorMsg } from '../components/UI.jsx'

const s = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, width: 380, maxWidth: '95vw' },
  title: { fontSize: 18, color: 'var(--cyan)', marginBottom: 4, letterSpacing: 1 },
  sub: { fontSize: 11, color: 'var(--text3)', marginBottom: 24 },
  label: { fontSize: 11, color: 'var(--text2)', marginBottom: 6, display: 'block', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)',
    borderRadius: 6, padding: '10px 12px', color: 'var(--text)',
    fontFamily: '"Times New Roman", Times, serif', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)',
    borderRadius: 6, padding: '10px 12px', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    width: '100%', background: 'var(--cyan2)', border: 'none', color: '#fff',
    padding: 11, borderRadius: 6, fontSize: 12, fontFamily: 'inherit',
    cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase',
  },
  success: {
    background: '#0f2d1a', border: '1px solid var(--neon)', color: 'var(--neon)',
    padding: '8px 12px', borderRadius: 6, fontSize: 11, marginBottom: 12,
  },
  switchLine: { textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text3)' },
  link: { color: 'var(--cyan)', cursor: 'pointer' },
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleRegister() {
    setError('')
    setSuccess('')
    if (!email || !password) { setError('All fields are required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register({ email, password, role })
      setSuccess('Registration successful! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>REGISTER ACCOUNT</div>
        <div style={s.sub}>Create your security platform account</div>

        <ErrorMsg message={error} />
        {success && <div style={s.success}>{success}</div>}

        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Email (@gmail.com only)</label>
          <input style={s.input} type="email" placeholder="you@gmail.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="Min 6 characters"
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Role</label>
          <select style={s.select} value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="analyst">System Analyst</option>
            <option value="admin">Security Administrator</option>
          </select>
        </div>

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleRegister} disabled={loading}>
          {loading ? 'REGISTERING...' : 'REGISTER →'}
        </button>

        <div style={s.switchLine}>
          Have account?{' '}
          <span style={s.link} onClick={() => navigate('/login')}>Login here</span>
        </div>
      </div>
    </div>
  )
}
