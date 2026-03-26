import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { PageHeader, Card, CardTitle, Grid } from '../../components/UI.jsx'
import { ANOMALY_DATA, DRIFT_DATA, RISK_DIST_DATA, WEEKLY_RISK } from '../../mock-data/mockData.js'

const TT   = { contentStyle: { background: '#0d1426', border: '1px solid #1e3a4a', color: '#e2e8f0', fontSize: 11 } }
const TICK = { fill: '#64748b', fontSize: 10 }
const GRID = '#1e293b'
const RISK_PIE_COLORS = ['#ef4444', '#eab308', '#22c55e']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]
    const colors = { High: '#ef4444', Medium: '#eab308', Low: '#22c55e' }
    return (
      <div style={{ background: '#0d1426', border: '1px solid #1e3a4a', padding: '6px 12px', borderRadius: 5, fontSize: 11, color: '#e2e8f0' }}>
        <span style={{ color: colors[d.name] }}>{d.name}</span>: {d.value} users
      </div>
    )
  }
  return null
}

const WEEKLY_RISK_BAR = WEEKLY_RISK.map(d => ({
  day: d.t,
  total: (d.high || 0) + (d.medium || 0) + (d.low || 0),
  high: d.high,
  medium: d.medium,
  low: d.low,
}))

export default function AnalystRisk() {
  return (
    <div style={{ padding: 20 }}>
      <PageHeader title="RISK OVERVIEW" sub="Anomaly trends and behaviour drift analysis" />
      <Grid cols={2} gap={16}>
        <Card>
          <CardTitle>RISK DISTRIBUTION</CardTitle>

          {/* Bold colored badge legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            {RISK_DIST_DATA.map((d, i) => (
              <div key={d.name} style={{
                background: RISK_PIE_COLORS[i] + '22',
                border: `1px solid ${RISK_PIE_COLORS[i]}`,
                borderRadius: 6, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: RISK_PIE_COLORS[i], fontWeight: 700,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_PIE_COLORS[i], display: 'inline-block', flexShrink: 0 }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={RISK_DIST_DATA}
                cx="50%" cy="50%"
                innerRadius={48}
                outerRadius={72}
                dataKey="value"
                paddingAngle={4}
                label={false}
                startAngle={90}
                endAngle={-270}
              >
                {RISK_DIST_DATA.map((_, i) => (
                  <Cell key={i} fill={RISK_PIE_COLORS[i]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>ANOMALY TREND</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ANOMALY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="t" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} name="Anomaly Score" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>BEHAVIOUR DRIFT TREND</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={DRIFT_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="t" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="drift" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Drift Score" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>WEEKLY RISK COUNT BY DAY</CardTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WEEKLY_RISK_BAR} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="day" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip {...TT} />
              <Bar dataKey="high" stackId="a" fill="#06b6d4" name="High" />
              <Bar dataKey="medium" stackId="a" fill="#06b6d4" name="Medium" />
              <Bar dataKey="low" stackId="a" fill="#06b6d4" name="Low" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
            {[['High','#06b6d4'],['Medium','#06b6d4'],['Low','#06b6d4']].map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color }}>
                <span style={{ width: 12, height: 12, background: color, display: 'inline-block', borderRadius: 2 }} />
                {name}
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </div>
  )
}
