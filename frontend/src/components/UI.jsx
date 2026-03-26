// ============================================================
// Shared reusable UI components
// ============================================================

export function PageHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 16, color: 'var(--cyan)', letterSpacing: 2, textTransform: 'uppercase' }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: 16, ...style,
    }}>
      {children}
    </div>
  )
}

export function CardTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase',
      marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ display: 'block', width: 3, height: 10, background: 'var(--cyan)', borderRadius: 1 }} />
      {children}
    </div>
  )
}

const BADGE_STYLES = {
  Critical:  { background: '#3a0a0a', color: '#fca5a5', border: '1px solid #7f1d1d' },
  High:      { background: '#2d0f0f', color: 'var(--red)',    border: '1px solid #4a1515' },
  Medium:    { background: '#2d2300', color: 'var(--yellow)', border: '1px solid #4a3a00' },
  Low:       { background: '#0f2d1a', color: 'var(--neon)',   border: '1px solid #1a4a2a' },
  default:   { background: 'var(--slate)', color: 'var(--text2)', border: '1px solid var(--slate2)' },
  cyan:      { background: 'var(--cyan3)', color: 'var(--cyan)', border: '1px solid #1a4a5a' },
  red:       { background: '#2d0f0f', color: 'var(--red)',    border: '1px solid #4a1515' },
  yellow:    { background: '#2d2300', color: 'var(--yellow)', border: '1px solid #4a3a00' },
  green:     { background: '#0f2d1a', color: 'var(--neon)',   border: '1px solid #1a4a2a' },
}

export function Badge({ children, variant = 'default' }) {
  const style = BADGE_STYLES[variant] || BADGE_STYLES[children] || BADGE_STYLES.default
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
      letterSpacing: 1, ...style,
    }}>
      {children}
    </span>
  )
}

const BTN_STYLES = {
  cyan:    { background: '#0e7490', borderColor: 'var(--cyan2)', color: '#fff' },
  green:   { background: '#15803d', borderColor: 'var(--neon2)', color: '#fff' },
  yellow:  { background: '#854d0e', borderColor: 'var(--yellow)', color: 'var(--yellow)' },
  red:     { background: '#7f1d1d', borderColor: 'var(--red)', color: 'var(--red)' },
  outline: { background: 'none', borderColor: 'var(--slate2)', color: 'var(--text2)' },
}

export function Button({ children, variant = 'cyan', onClick, style = {} }) {
  const base = BTN_STYLES[variant] || BTN_STYLES.cyan
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 5, fontSize: 11, fontFamily: 'inherit',
        cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase',
        transition: 'all 0.15s', border: '1px solid transparent', ...base, ...style,
      }}
    >
      {children}
    </button>
  )
}

export function StatusDot({ color = 'green' }) {
  const colors = { green: 'var(--neon)', yellow: 'var(--yellow)', red: 'var(--red)', cyan: 'var(--cyan)' }
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
      marginRight: 6, background: colors[color] || color,
      ...(color === 'green' ? { boxShadow: '0 0 6px var(--neon)' } : {}),
    }} />
  )
}

export function AlertToast({ message }) {
  if (!message) return null
  return (
    <div style={{
      background: '#0f2d1a', border: '1px solid var(--neon)', color: 'var(--neon)',
      padding: '8px 12px', borderRadius: 6, fontSize: 11, marginBottom: 12,
    }}>
      {message}
    </div>
  )
}

export function ErrorMsg({ message }) {
  if (!message) return null
  return (
    <div style={{
      background: '#2d0f0f', border: '1px solid var(--red)', color: 'var(--red)',
      padding: '8px 12px', borderRadius: 6, fontSize: 11, marginBottom: 12,
    }}>
      {message}
    </div>
  )
}

export function Grid({ cols = 2, children, gap = 16 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, marginBottom: 20 }}>
      {children}
    </div>
  )
}

export const TOOLTIP_STYLE = {
  contentStyle: { background: '#0d1426', border: '1px solid #1e3a4a', color: '#e2e8f0', fontSize: 11 }
}

export const AXIS_TICK = { fill: '#64748b', fontSize: 10 }
export const GRID_STROKE = '#1e293b'
export const LEGEND_STYLE = { wrapperStyle: { fontSize: 11, color: '#94a3b8' } }
