import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getAdminLogs } from '../../services/api.js'
import { PageHeader, Card, CardTitle, Grid } from '../../components/UI.jsx'
import { FILE_ACCESS_DATA, FAILED_TREND } from '../../mock-data/mockData.js'

const TT   = { contentStyle: { background: '#0d1426', border: '1px solid #1e3a4a', color: '#e2e8f0', fontSize: 12 } }
const TICK = { fill: '#64748b', fontSize: 10 }

const RISK_PIE_COLORS = ['#7f1d1d', '#ef4444', '#eab308', '#22c55e']

function riskColor(val, high, med) {
  if (val > high) return 'var(--red)'
  if (val > med)  return 'var(--yellow)'
  return 'var(--neon)'
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]
    return (
      <div style={{ background: '#0d1426', border: '1px solid #1e3a4a', padding: '6px 12px', borderRadius: 5, fontSize: 12, color: '#e2e8f0' }}>
        <span style={{ color: RISK_PIE_COLORS[['Critical', 'High', 'Medium', 'Low'].indexOf(d.name)] }}>{d.name}</span>: {d.value} users
      </div>
    )
  }
  return null
}

export default function AdminLogs() {
  const [logs, setLogs]     = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getAdminLogs().then(setLogs)
    const id = setInterval(() => getAdminLogs().then(setLogs), 5000)
    return () => clearInterval(id)
  }, [])

  const RISK_DIST = [
    { name: 'Critical', value: logs.filter(u => u.risk === 'Critical').length },
    { name: 'High', value: logs.filter(u => u.risk === 'High').length },
    { name: 'Medium', value: logs.filter(u => u.risk === 'Medium').length },
    { name: 'Low', value: logs.filter(u => u.risk === 'Low').length },
  ]

  const filtered = logs.filter(u => {
    const matchSearch = u.id.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.risk.toLowerCase() === filter
    return matchSearch && matchFilter
  })

  const fileAccessData = filtered.length > 0
    ? filtered.slice(0, 10).map(u => ({ user: u.id, count: Number(u.fileAccess || 0) }))
    : FILE_ACCESS_DATA

  const failedTrend = filtered.length > 0
    ? filtered.slice(0, 10).map((u, idx) => ({ t: u.id || `U-${idx + 1}`, failed: Number(u.failedLogins || 0) }))
    : FAILED_TREND

  return (
    <div style={{ padding: 20 }}>
      <PageHeader title="SYSTEM LOGS" sub="Full audit log — search and filter" />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Search User ID..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5,
            padding: '8px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 12,
            outline: 'none', flex: 1, minWidth: 160,
          }}
        />
        <select
          value={filter} onChange={e => setFilter(e.target.value)}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--slate2)', borderRadius: 5,
            padding: '8px 12px', color: 'var(--text2)', fontFamily: 'inherit', fontSize: 11, outline: 'none',
          }}
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['User ID', 'Timestamp', 'Login Attempts', 'Failed Logins', 'File Access', 'Session Duration'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px' }}><span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{u.id}</span></td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{u.ts}</td>
                  <td style={{ padding: '10px 14px' }}><span style={{ color: riskColor(u.loginAttempts, 10, 5) }}>{u.loginAttempts}</span></td>
                  <td style={{ padding: '10px 14px' }}><span style={{ color: riskColor(u.failedLogins, 5, 2) }}>{u.failedLogins}</span></td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{u.fileAccess}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{u.session}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No results found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle>RISK DISTRIBUTION</CardTitle>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            {RISK_DIST.map((d, i) => (
              <div key={d.name} style={{
                background: RISK_PIE_COLORS[i] + '22',
                border: `1px solid ${RISK_PIE_COLORS[i]}`,
                borderRadius: 6, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: RISK_PIE_COLORS[i], fontWeight: 700,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_PIE_COLORS[i], display: 'inline-block', flexShrink: 0 }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={RISK_DIST}
                cx="50%" cy="50%"
                innerRadius={42}
                outerRadius={65}
                dataKey="value"
                paddingAngle={4}
                label={false}
                startAngle={90}
                endAngle={-270}
              >
                {RISK_DIST.map((_, i) => (
                  <Cell key={i} fill={RISK_PIE_COLORS[i]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>FAILED LOGIN TREND</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={failedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="t" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed Logins" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>FILE ACCESS ACTIVITY</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fileAccessData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="user" tick={{ fill: '#64748b', fontSize: 9 }} />
              <YAxis tick={TICK} />
              <Tooltip {...TT} />
              <Bar dataKey="count" fill="#06b6d4" name="File Access Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
