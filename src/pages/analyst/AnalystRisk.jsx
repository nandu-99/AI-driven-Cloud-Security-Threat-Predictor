import {
  LineChart, Line, PieChart, Pie, Cell,
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

export default function AnalystRisk() {
  return (
    <div style={{ padding: 20 }}>
      <PageHeader title="RISK OVERVIEW" sub="Anomaly trends and behaviour drift analysis" />
      <Grid cols={2} gap={16}>
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
          <CardTitle>WEEKLY RISK DISTRIBUTION</CardTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={WEEKLY_RISK}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="t" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip {...TT} />
              {/* Manual legend */}
              <Line type="monotone" dataKey="high"   stroke="#ef4444" strokeWidth={2} name="High" />
              <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} name="Medium" />
              <Line type="monotone" dataKey="low"    stroke="#22c55e" strokeWidth={2} name="Low" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
            {[['High','#ef4444'],['Medium','#eab308'],['Low','#22c55e']].map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color }}>
                <span style={{ width: 20, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
                {name}
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </div>
  )
}
