// ============================================================
// MOCK DATA — AI Cloud Security Threat Predictor
// ============================================================

export const MOCK_USERS = [
  { id: 'USR-1021', risk: 'High',   status: 'Under Investigation', loginAttempts: 14, failedLogins: 8,  fileAccess: 47, session: '4h 22m', ts: '2025-01-15 09:14' },
  { id: 'USR-1043', risk: 'Medium', status: 'Monitoring',          loginAttempts: 6,  failedLogins: 2,  fileAccess: 18, session: '1h 45m', ts: '2025-01-15 10:32' },
  { id: 'USR-1055', risk: 'Low',    status: 'Clear',               loginAttempts: 2,  failedLogins: 0,  fileAccess: 7,  session: '0h 38m', ts: '2025-01-15 11:05' },
  { id: 'USR-1072', risk: 'High',   status: 'Escalated',           loginAttempts: 19, failedLogins: 12, fileAccess: 83, session: '6h 10m', ts: '2025-01-15 07:48' },
  { id: 'USR-1088', risk: 'Medium', status: 'Monitoring',          loginAttempts: 5,  failedLogins: 1,  fileAccess: 22, session: '2h 12m', ts: '2025-01-15 12:00' },
]

export const ANOMALY_DATA = [
  { t: 'Mon', score: 12 }, { t: 'Tue', score: 18 }, { t: 'Wed', score: 34 },
  { t: 'Thu', score: 28 }, { t: 'Fri', score: 52 }, { t: 'Sat', score: 41 }, { t: 'Sun', score: 67 },
]

export const DRIFT_DATA = [
  { t: 'Mon', drift: 5 }, { t: 'Tue', drift: 9 }, { t: 'Wed', drift: 14 },
  { t: 'Thu', drift: 11 }, { t: 'Fri', drift: 22 }, { t: 'Sat', drift: 18 }, { t: 'Sun', drift: 31 },
]

export const RISK_DIST_DATA = [
  { name: 'High', value: 3 }, { name: 'Medium', value: 8 }, { name: 'Low', value: 14 },
]

export const WEEKLY_RISK = [
  { t: 'Mon', high: 2, medium: 5, low: 8 }, { t: 'Tue', high: 3, medium: 6, low: 7 },
  { t: 'Wed', high: 5, medium: 4, low: 6 }, { t: 'Thu', high: 4, medium: 7, low: 5 },
  { t: 'Fri', high: 7, medium: 5, low: 4 }, { t: 'Sat', high: 6, medium: 8, low: 6 },
  { t: 'Sun', high: 9, medium: 6, low: 3 },
]

export const LOGIN_TREND = [
  { t: 'Mon', attempts: 42 }, { t: 'Tue', attempts: 38 }, { t: 'Wed', attempts: 67 },
  { t: 'Thu', attempts: 55 }, { t: 'Fri', attempts: 89 }, { t: 'Sat', attempts: 74 }, { t: 'Sun', attempts: 103 },
]

export const FAILED_TREND = [
  { t: 'Mon', failed: 8 }, { t: 'Tue', failed: 12 }, { t: 'Wed', failed: 21 },
  { t: 'Thu', failed: 16 }, { t: 'Fri', failed: 34 }, { t: 'Sat', failed: 28 }, { t: 'Sun', failed: 47 },
]

export const FILE_ACCESS_DATA = [
  { user: 'USR-1021', count: 47 }, { user: 'USR-1072', count: 83 },
  { user: 'USR-1043', count: 18 }, { user: 'USR-1055', count: 7 }, { user: 'USR-1088', count: 22 },
]

export const ALERT_SEVERITY = [
  { name: 'Critical', value: 4 }, { name: 'High', value: 9 },
  { name: 'Medium', value: 15 }, { name: 'Low', value: 22 },
]

export const USER_NOTIFICATIONS = [
  { title: 'Password change recommended — update overdue', time: '2 hours ago' },
  { title: 'Security advisory: Enable 2FA for enhanced protection', time: '5 hours ago' },
  { title: 'Account alert: Login from new device detected', time: '1 day ago' },
]

export const ANALYST_NOTIFICATIONS = [
  { title: 'New support message from USR-1043 — urgent access issue', time: '14 min ago' },
  { title: 'Risk alert: USR-1072 escalated to critical threat level', time: '1 hour ago' },
  { title: 'Investigation update: USR-1021 — new evidence submitted', time: '3 hours ago' },
]

export const ADMIN_NOTIFICATIONS = [
  { title: 'Analyst escalation: USR-1072 requires immediate action', time: '8 min ago' },
  { title: 'Monitoring alert: Log ingestion delay detected', time: '45 min ago' },
  { title: 'Audit notification: Monthly compliance report ready', time: '2 hours ago' },
]

// Used by analyst alerts — no numbers shown
export const MOCK_ALERTS = [
  { id: 'USR-1072', level: 'high',   desc: 'Excess login attempts with multiple failures — possible brute force attack', time: '07:48' },
  { id: 'USR-1021', level: 'high',   desc: 'Excess privileged file access during off-hours session', time: '09:14' },
  { id: 'USR-1043', level: 'medium', desc: 'Login from unrecognised geographic location', time: '10:32' },
  { id: 'USR-1088', level: 'medium', desc: 'Session duration exceeded usual baseline', time: '12:00' },
]

// Default mock users for demo login
export const MOCK_REGISTERED_USERS = new Map([
  ['user@gmail.com',     { password: 'user123',     role: 'user' }],
  ['analyst@gmail.com',  { password: 'analyst123',  role: 'analyst' }],
  ['admin@gmail.com',    { password: 'admin123',    role: 'admin' }],
])
