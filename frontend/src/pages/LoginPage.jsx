import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { login, recordLoginAttempt } from '../services/api.js'
import { ErrorMsg } from '../components/UI.jsx'

const s = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, width: 380, maxWidth: '95vw' },
  logoWrap: { textAlign: 'center', marginBottom: 28 },
  logoText: { fontSize: 28, color: 'var(--cyan)', letterSpacing: 4, fontWeight: 700 },
  logoSub: { fontSize: 10, color: 'var(--text3)', letterSpacing: 2, marginTop: 4 },
  label: { fontSize: 11, color: 'var(--text2)', marginBottom: 6, display: 'block', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--slate2)',
    borderRadius: 6, padding: '10px 12px', color: 'var(--text)',
    fontFamily: '"Times New Roman", Times, serif', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%', background: 'var(--cyan2)', border: 'none', color: '#fff',
    padding: 11, borderRadius: 6, fontSize: 12, fontFamily: 'inherit',
    cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4,
  },
  switchLine: { textAlign: 'center', marginTop: 18, fontSize: 11, color: 'var(--text3)' },
  link: { color: 'var(--cyan)', cursor: 'pointer' },
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  async function handleLogin() {
    setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      let data
      try {
        data = await login({ email, password })
        await recordLoginAttempt({ email, success: true })
      } catch (err) {
        await recordLoginAttempt({ email, success: false })
        throw err
      }
      loginUser(data.token, data.user)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) { if (e.key === 'Enter') handleLogin() }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logoText}>THREAT PREDICTOR</div>
          <div style={s.logoSub}>AI-DRIVEN CLOUD SECURITY PLATFORM</div>
        </div>

        <ErrorMsg message={error} />

        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Email Address</label>
          <input
            style={s.input} type="email" placeholder="you@gmail.com"
            value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Password</label>
          <input
            style={s.input} type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
          />
        </div>

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? 'AUTHENTICATING...' : 'LOGIN →'}
        </button>

        <div style={s.switchLine}>
          No account?{' '}
          <span style={s.link} onClick={() => navigate('/register')}>Register here</span>
        </div>
      </div>
    </div>
  )
}
