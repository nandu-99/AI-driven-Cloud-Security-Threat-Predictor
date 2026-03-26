import { PageHeader, Card } from '../../components/UI.jsx'

const EVENTS = [
  { icon: '🔑', text: 'Login from Chrome / Windows 11', time: 'Today 09:14 AM' },
  { icon: '📂', text: 'Accessed file: /reports/q4-2024.xlsx', time: 'Today 09:22 AM' },
  { icon: '🔑', text: 'Login from mobile device', time: 'Today 02:45 PM' },
  { icon: '⚙', text: 'Password change attempted', time: 'Today 03:10 PM' },
  { icon: '🌍', text: 'Session from new location detected', time: 'Yesterday' },
  { icon: '📄', text: 'Accessed file: /configs/system.json', time: 'Yesterday' },
  { icon: '🔑', text: 'Login from Chrome / macOS', time: '2 days ago' },
]

export default function UserActivity() {
  return (
    <div style={{ padding: 20 }}>
      <PageHeader title="ACTIVITY LOG" sub="Your recent account activity" />
      <Card>
        {EVENTS.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < EVENTS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {e.icon}
            </div>
            <div style={{ flex: 1, fontSize: 12, color: 'var(--text2)' }}>{e.text}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{e.time}</div>
          </div>
        ))}
      </Card>
    </div>
  )
}
