// ============================================================
// src/services/api.js
// Centralized API Service Layer
// Toggle USE_MOCK_API to switch between mock and real backend
// ============================================================

import {
  MOCK_USERS,
  MOCK_ALERTS,
  MOCK_REGISTERED_USERS,
  USER_NOTIFICATIONS,
  ANALYST_NOTIFICATIONS,
  ADMIN_NOTIFICATIONS,
} from '../mock-data/mockData.js'

// -----------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------
const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API || 'false') === 'true'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

// -----------------------------------------------------------
// HELPER: In-memory registered users (for mock mode)
// -----------------------------------------------------------
const registeredUsers = new Map(MOCK_REGISTERED_USERS)
const mockLockState = new Map()
const mockUserState = new Map(MOCK_USERS.map(u => [u.id, { ...u }]))

const MOCK_REGISTERED_STORAGE_KEY = 'mockRegisteredUsers'
const MOCK_LAST_HYBRID_MODEL_KEY = 'mockLastHybridModel'
const MOCK_AUTH_STATS_KEY = 'mockAuthStats'

function loadRegisteredUsersFromStorage() {
  try {
    const raw = localStorage.getItem(MOCK_REGISTERED_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return
    for (const [email, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue
      if (typeof value.password !== 'string' || typeof value.role !== 'string') continue
      registeredUsers.set(email, { password: value.password, role: value.role })
    }
  } catch {
    // ignore storage parse errors
  }
}

function persistRegisteredUsersToStorage() {
  try {
    const obj = {}
    for (const [email, value] of registeredUsers.entries()) {
      obj[email] = value
    }
    localStorage.setItem(MOCK_REGISTERED_STORAGE_KEY, JSON.stringify(obj))
  } catch {
    // ignore storage write errors
  }
}

loadRegisteredUsersFromStorage()

function loadLastHybridModelFromStorage() {
  try {
    const raw = localStorage.getItem(MOCK_LAST_HYBRID_MODEL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function persistLastHybridModelToStorage(model) {
  try {
    localStorage.setItem(MOCK_LAST_HYBRID_MODEL_KEY, JSON.stringify(model))
  } catch {
    // ignore
  }
}

function loadAuthStats() {
  try {
    const raw = localStorage.getItem(MOCK_AUTH_STATS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

function persistAuthStats(stats) {
  try {
    localStorage.setItem(MOCK_AUTH_STATS_KEY, JSON.stringify(stats))
  } catch {
    // ignore
  }
}

export function getAuthStatsForEmail(email) {
  if (!USE_MOCK_API) return { loginAttempts: 0, failedLogins: 0 }
  const emailKey = String(email || '').trim().toLowerCase()
  const stats = loadAuthStats()
  const current = stats[emailKey] || {}
  const loginAttempts = Number(current.loginAttempts || 0)
  const failedLogins = Number(current.failedLogins || 0)
  return { loginAttempts, failedLogins }
}

function updateMockUserAuthCountsForEmail(email, { incrementAttempts, incrementFailures }) {
  const userId = (() => {
    const emailKey = String(email || '').trim().toLowerCase()
    const demoMap = { 'user@gmail.com': 'USR-1021', 'analyst@gmail.com': 'USR-1043', 'admin@gmail.com': 'USR-1072' }
    if (demoMap[emailKey]) return demoMap[emailKey]
    const base = emailKey.split('@')[0] || 'user'
    return `USR-${base.slice(0, 6).toUpperCase()}`
  })()

  if (!mockUserState.has(userId)) {
    // Create a placeholder row so tables can show the counters.
    mockUserState.set(userId, {
      id: userId,
      risk: 'Low',
      status: 'Monitoring',
      loginAttempts: 0,
      failedLogins: 0,
      fileAccess: 0,
      session: '0h 0m',
      ts: new Date().toISOString().slice(0, 10),
    })
  }

  const u = mockUserState.get(userId)
  u.loginAttempts = Number(u.loginAttempts || 0) + incrementAttempts
  u.failedLogins = Number(u.failedLogins || 0) + incrementFailures
}

const roleNotifications = {
  user: [...USER_NOTIFICATIONS],
  analyst: [...ANALYST_NOTIFICATIONS],
  admin: [...ADMIN_NOTIFICATIONS],
}

const inboxMessages = { user: [], analyst: [], admin: [] }

function nowTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || '{}')
  } catch {
    return {}
  }
}

function getCurrentRole() {
  return getCurrentUser()?.role || 'system'
}

function getCurrentUserId() {
  const email = getCurrentUser()?.email || ''
  const emailKey = String(email || '').trim().toLowerCase()
  // Keep mock dashboards (USR-xxxx rows) stable for the demo users.
  const demoMap = {
    'user@gmail.com': 'USR-1021',
    'analyst@gmail.com': 'USR-1043',
    'admin@gmail.com': 'USR-1072',
  }
  if (demoMap[emailKey]) return demoMap[emailKey]
  const base = email.split('@')[0] || 'user'
  return `USR-${base.slice(0, 6).toUpperCase()}`
}

function prependNotification(role, payload) {
  roleNotifications[role] = [payload, ...(roleNotifications[role] || [])].slice(0, 30)
}

function prependInbox(role, payload) {
  inboxMessages[role] = [payload, ...(inboxMessages[role] || [])].slice(0, 50)
}

function buildRiskModelNotification({
  userId,
  riskScore,
  anomalyScore,
  driftScore,
  loginAttempts,
  failedLogins,
  fileAccess,
  session,
  geoAnomalies,
  offHours,
  baselineDeviation,
  modelVersion,
  lastUpdate,
  sourceAction,
  alertSeverity,
}) {
  const sevSuffix = alertSeverity ? ` (${String(alertSeverity).toUpperCase()})` : ''
  return {
    title: `${sourceAction}${sevSuffix} for ${userId}`,
    time: nowTimeLabel(),
    details: [
      `User ID: ${userId}`,
      `Alert severity: ${(alertSeverity || 'medium').toUpperCase()}`,
      `Risk score: ${riskScore}`,
      `Anomaly score: ${anomalyScore}`,
      `Drift score: ${driftScore}`,
      `Login attempts: ${loginAttempts}`,
      `Failed logins: ${failedLogins}`,
      `File access: ${fileAccess}`,
      `Session: ${session}`,
      `Geo anomalies: ${geoAnomalies}`,
      `Off-hours: ${offHours ? 'Yes' : 'No'}`,
      `Baseline deviation: ${baselineDeviation}`,
      `Model version: ${modelVersion}`,
      `Last update: ${lastUpdate}`,
    ],
  }
}

const ACTIVITY_EVENT_MAP = {
  privileged_file_access: {
    sourceAction: 'Unusual file access',
    riskLevel: 'high',
    riskScore: 84,
    anomalyScore: 79,
    driftScore: 68,
    loginAttempts: 8,
    failedLogins: 2,
    fileAccess: 47,
    session: '3h 14m',
    geoAnomalies: 1,
    offHours: true,
    baselineDeviation: '3.0x',
    modelVersion: 'v2.1.4',
  },
  multiple_login_attempts: {
    sourceAction: 'Multiple login attempts',
    riskLevel: 'critical',
    riskScore: 93,
    anomalyScore: 91,
    driftScore: 80,
    loginAttempts: 19,
    failedLogins: 12,
    fileAccess: 15,
    session: '1h 02m',
    geoAnomalies: 2,
    offHours: false,
    baselineDeviation: '4.1x',
    modelVersion: 'v2.1.4',
  },
  unusual_login_time: {
    sourceAction: 'Unusual login time',
    riskLevel: 'medium',
    riskScore: 62,
    anomalyScore: 55,
    driftScore: 44,
    loginAttempts: 5,
    failedLogins: 1,
    fileAccess: 22,
    session: '2h 12m',
    geoAnomalies: 0,
    offHours: true,
    baselineDeviation: '1.9x',
    modelVersion: 'v2.1.4',
  },
}

const seedEvent = ACTIVITY_EVENT_MAP.multiple_login_attempts
const seedRiskNotification = buildRiskModelNotification({
  ...seedEvent,
  userId: 'USR-1072',
  lastUpdate: '2025-01-15 07:48',
  alertSeverity: 'medium',
})
roleNotifications.analyst = [seedRiskNotification, ...roleNotifications.analyst]
roleNotifications.admin = [seedRiskNotification, ...roleNotifications.admin]

function computeAlertSeverity(changedCount) {
  // Rules requested:
  // - before any two columns are changed (i.e. <= 2) => Critical
  // - 3 columns changed => Low
  // - more columns changed => Medium
  // - very high number changed => High
  if (changedCount <= 2) return 'critical'
  if (changedCount === 3) return 'low'
  if (changedCount <= 5) return 'medium'
  return 'high'
}

// -----------------------------------------------------------
// HELPER: Simulate network latency in mock mode
// -----------------------------------------------------------
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms))

// -----------------------------------------------------------
// HELPER: Real fetch wrapper (with network error handling)
// -----------------------------------------------------------
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  let res
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    })
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        'Cannot connect to server. Start the backend (cd backend && python main.py) or enable mock API in .env (VITE_USE_MOCK_API=true)'
      )
    }
    throw err
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || 'Request failed')
  }
  return res.json()
}

// ============================================================
// AUTH
// ============================================================

/**
 * Register a new user
 * POST /auth/register
 */
export async function register({ email, password, role }) {
  if (USE_MOCK_API) {
    await delay()
    const emailKey = String(email || '').trim().toLowerCase()
    const roleKey = String(role || 'user').trim().toLowerCase()
    if (!emailKey.endsWith('@gmail.com')) throw new Error('Only @gmail.com emails are allowed')
    if (registeredUsers.has(emailKey)) throw new Error('Email already registered')
    registeredUsers.set(emailKey, { password, role: roleKey })
    persistRegisteredUsersToStorage()
    return { success: true, message: 'Registration successful' }
  }
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  })
}

/**
 * Login user
 * POST /auth/login
 * Returns: { token, user: { email, role } }
 */
export async function login({ email, password }) {
  if (USE_MOCK_API) {
    await delay()
    const emailKey = String(email || '').trim().toLowerCase()
    if (!emailKey.endsWith('@gmail.com')) throw new Error('Only @gmail.com emails are allowed')

    let user = registeredUsers.get(emailKey)
    if (!user) {
      // Auto-register for convenience in mock mode (so you don't need the Register page).
      // Role is inferred from email keywords; otherwise defaults to 'user'.
      const guessedRole = emailKey.includes('admin')
        ? 'admin'
        : emailKey.includes('analyst')
          ? 'analyst'
          : 'user'
      registeredUsers.set(emailKey, { password, role: guessedRole })
      persistRegisteredUsersToStorage()
      user = registeredUsers.get(emailKey)
    }

    if (!user || user.password !== password) throw new Error('Invalid credentials')
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: { email: emailKey, role: user.role },
    }
  }
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Mock-only: record login attempts/failed logins and update mock tables.
 * Intended to be called from the frontend LoginPage on every attempt.
 */
export async function recordLoginAttempt({ email, success }) {
  if (USE_MOCK_API) {
    await delay(50)
    const stats = loadAuthStats()
    const emailKey = String(email || '').trim().toLowerCase()
    const current = stats[emailKey] || {}
    const loginAttempts = Number(current.loginAttempts || 0) + 1
    const failedLogins = Number(current.failedLogins || 0) + (success ? 0 : 1)
    stats[emailKey] = { loginAttempts, failedLogins }
    persistAuthStats(stats)

    updateMockUserAuthCountsForEmail(email, {
      incrementAttempts: 1,
      incrementFailures: success ? 0 : 1,
    })

    // Send Analyst + Admin a notification with the updated counts.
    const demoMap = { 'user@gmail.com': 'USR-1021', 'analyst@gmail.com': 'USR-1043', 'admin@gmail.com': 'USR-1072' }
    const userId = demoMap[emailKey] || `USR-${(emailKey.split('@')[0] || 'user').slice(0, 6).toUpperCase()}`

    const alertSeverity = success
      ? 'low'
      : failedLogins >= 6
        ? 'critical'
        : failedLogins >= 3
          ? 'high'
          : 'medium'

    const note = buildRiskModelNotification({
      userId,
      riskScore: success ? 20 : failedLogins >= 3 ? 90 : 60,
      anomalyScore: success ? 10 : failedLogins >= 3 ? 80 : 45,
      driftScore: success ? 6 : failedLogins >= 3 ? 70 : 30,
      loginAttempts,
      failedLogins,
      fileAccess: 0,
      session: '0h 0m',
      geoAnomalies: failedLogins > 0 ? 1 : 0,
      offHours: failedLogins > 0,
      baselineDeviation: '1.0x',
      modelVersion: 'v2.1.4',
      lastUpdate: new Date().toLocaleString(),
      sourceAction: success ? 'Login success' : 'Failed login',
      alertSeverity,
    })

    prependNotification('analyst', note)
    prependNotification('admin', note)

    return { success: true, loginAttempts, failedLogins }
  }

  // Real-backend mode: still update local counters so the login page UI can show
  // dynamic attempt/failure counts. Analyst/Admin notifications come from backend.
  await delay(25)
  const stats = loadAuthStats()
  const emailKey = String(email || '').trim().toLowerCase()
  const current = stats[emailKey] || {}
  const loginAttempts = Number(current.loginAttempts || 0) + 1
  const failedLogins = Number(current.failedLogins || 0) + (success ? 0 : 1)
  stats[emailKey] = { loginAttempts, failedLogins }
  persistAuthStats(stats)
  return { success: true, loginAttempts, failedLogins }
}

export function getAuthStatsForCurrentUser() {
  if (!USE_MOCK_API) return { loginAttempts: 0, failedLogins: 0 }
  const current = getCurrentUser()
  return getAuthStatsForEmail(current?.email)
}

// ============================================================
// USER
// ============================================================

/**
 * Get user dashboard data
 * GET /user/dashboard
 */
export async function getUserDashboard() {
  if (USE_MOCK_API) {
    await delay()
    return {
      accountStatus: 'Active',
      lastLogin: 'Today 09:14 AM',
      sessionsToday: 3,
      alerts: 1,
    }
  }
  return apiFetch('/user/dashboard')
}

/**
 * Send support message
 * POST /user/support
 */
export async function sendSupportMessage({ subject, message }) {
  if (USE_MOCK_API) {
    await delay()
    const userId = getCurrentUserId()
    const senderRole = getCurrentRole()
    const storedHybrid = loadLastHybridModelFromStorage()
    const riskScore = Number(storedHybrid?.riskScore ?? 55)
    const alertSeverity = String(storedHybrid?.alertSeverity ?? 'medium')
    const riskLevel = alertSeverity === 'critical'
      ? 'critical'
      : alertSeverity === 'high'
        ? 'high'
        : alertSeverity === 'low'
          ? 'low'
          : 'medium'

    const text = `Support message (${userId}) — ${subject}: ${message}`
    prependInbox('analyst', {
      text,
      user_id: userId,
      sender_role: senderRole,
      receiver_role: 'analyst',
      time: nowTimeLabel(),
    })
    prependNotification('analyst', {
      title: `Support from ${userId} — risk ${riskLevel.toUpperCase()}`,
      time: nowTimeLabel(),
      details: [
        `User ID: ${userId}`,
        `Risk score: ${riskScore}`,
        `Risk level: ${riskLevel.toUpperCase()}`,
        `Subject: ${subject}`,
      ],
    })
    prependNotification('admin', {
      title: `Support escalation candidate ${userId} — risk ${riskLevel.toUpperCase()}`,
      time: nowTimeLabel(),
    })
    return { success: true, userId, riskLevel, riskScore }
  }
  return apiFetch('/user/support', {
    method: 'POST',
    body: JSON.stringify({ subject, message }),
  })
}

/**
 * Simulate user activity to update risk
 * POST /user/simulate-activity
 */
export async function simulateUserActivity({ activity }) {
  if (USE_MOCK_API) {
    await delay()
    const event = ACTIVITY_EVENT_MAP[activity] || ACTIVITY_EVENT_MAP.unusual_login_time
    const userId = getCurrentUserId()
    const lastUpdate = new Date().toLocaleString()

    prependNotification('user', {
      title: `${event.sourceAction} detected on your account`,
      time: nowTimeLabel(),
    })

    const modelNote = buildRiskModelNotification({
      ...event,
      userId,
      lastUpdate,
    })
    prependNotification('analyst', modelNote)
    prependNotification('admin', modelNote)

    return {
      success: true,
      activity,
      riskLevel: event.riskLevel,
      riskScore: event.riskScore,
      anomalyScore: event.anomalyScore,
      driftScore: event.driftScore,
      count: 1,
      hybridAlert: event.riskScore >= 85,
      newIpAlert: event.geoAnomalies > 0,
    }
  }
  return apiFetch('/user/simulate-activity', {
    method: 'POST',
    body: JSON.stringify({ activity }),
  })
}

/**
 * Mock: simulate a "hybrid" model alert from user-controlled fields.
 * Severity is computed from the count of changed columns.
 */
export async function simulateHybridAlert(model, changedCount) {
  if (USE_MOCK_API) {
    await delay()
    const alertSeverity = computeAlertSeverity(changedCount)
    const userId = model.userId || getCurrentUserId()
    const lastUpdate = model.lastUpdate || new Date().toLocaleString()

    const detailsNote = buildRiskModelNotification({
      userId,
      riskScore: model.riskScore,
      anomalyScore: model.anomalyScore,
      driftScore: model.driftScore,
      loginAttempts: model.loginAttempts,
      failedLogins: model.failedLogins,
      fileAccess: model.fileAccess,
      session: model.session,
      geoAnomalies: model.geoAnomalies,
      offHours: model.offHours,
      baselineDeviation: model.baselineDeviation,
      modelVersion: model.modelVersion,
      lastUpdate,
      sourceAction: 'Hybrid click',
      alertSeverity,
    })

    // Notify Analyst & Admin with full model fields
    prependNotification('analyst', detailsNote)
    prependNotification('admin', detailsNote)

    // Persist for Support Center message context
    persistLastHybridModelToStorage({
      ...model,
      userId,
      alertSeverity,
      lastUpdate,
    })

    return { success: true, alertSeverity, detailsNote }
  }
  throw new Error('Hybrid alert is mock-only right now. Enable mock API in frontend/.env (VITE_USE_MOCK_API=true).')
}

/**
 * Get notifications for current role
 * GET /notifications
 * Returns role-based notifications (user, analyst, admin)
 */
export async function getNotifications(role = 'user') {
  if (USE_MOCK_API) {
    await delay()
    return roleNotifications[role] || []
  }
  return apiFetch('/notifications')
}

/**
 * Clear all notifications for a given role (mock mode).
 * Used by the notifications dropdown.
 */
export async function clearNotifications(role = 'user') {
  if (USE_MOCK_API) {
    await delay(150)
    roleNotifications[role] = []
    return { success: true }
  }

  // Backend endpoint may not exist in this demo.
  try {
    await apiFetch('/notifications/clear', { method: 'POST' })
    return { success: true }
  } catch {
    // Fallback: UI should still clear locally.
    return { success: false }
  }
}

/**
 * Get inbox messages for current role
 * GET /messages/inbox
 */
export async function getMyInbox() {
  if (USE_MOCK_API) {
    await delay()
    const role = getCurrentRole()
    return inboxMessages[role] || []
  }
  return apiFetch('/messages/inbox')
}

/**
 * Send notification/message to one or more roles
 * POST /notifications/send
 */
export async function sendNotification({ receiverRoles, message, userId = '' }) {
  if (USE_MOCK_API) {
    await delay()
    const senderRole = getCurrentRole()
    const payload = {
      text: message,
      user_id: userId,
      sender_role: senderRole,
      time: nowTimeLabel(),
    }
    receiverRoles.forEach(role => {
      prependInbox(role, { ...payload, receiver_role: role })
      prependNotification(role, {
        title: `${senderRole.toUpperCase()}: ${message}${userId ? ` (${userId})` : ''}`,
        time: nowTimeLabel(),
      })
    })
    return { success: true, message: 'Message sent' }
  }
  return apiFetch('/notifications/send', {
    method: 'POST',
    body: JSON.stringify({ receiverRoles, message, userId }),
  })
}

// ============================================================
// ANALYST
// ============================================================

/**
 * Get analyst alerts
 * GET /analyst/alerts
 */
export async function getAnalystAlerts() {
  if (USE_MOCK_API) {
    await delay()
    return MOCK_ALERTS
  }
  return apiFetch('/analyst/alerts')
}

/**
 * Get analyst dashboard summary
 * GET /analyst/dashboard
 */
export async function getAnalystDashboard() {
  if (USE_MOCK_API) {
    await delay()
    const users = Array.from(mockUserState.values())
    const highRisk = users.filter(u => u.risk === 'High').length
    const underInvestigation = users.filter(u => u.status === 'Under Investigation').length
    const escalated = users.filter(u => u.status === 'Escalated').length
    const clearedToday = users.filter(u => u.status === 'Clear').length
    return {
      users,
      highRisk,
      underInvestigation,
      escalated,
      clearedToday,
    }
  }
  return apiFetch('/analyst/dashboard')
}

/**
 * Respond to user
 * POST /analyst/respond
 */
export async function respondToUser({ userId, message }) {
  if (USE_MOCK_API) {
    await delay()
    prependInbox('user', {
      text: message,
      user_id: userId,
      sender_role: 'analyst',
      receiver_role: 'user',
      time: nowTimeLabel(),
    })
    prependNotification('user', {
      title: `Analyst response for ${userId}: ${message}`,
      time: nowTimeLabel(),
    })
    return { success: true, message: `Response sent to ${userId}` }
  }
  return apiFetch('/analyst/respond', {
    method: 'POST',
    body: JSON.stringify({ userId, message }),
  })
}

/**
 * Escalate alert to Security Administrator
 * POST /analyst/escalate
 */
export async function escalateAlert({ userId, reason, receiverRole = 'admin' }) {
  if (USE_MOCK_API) {
    await delay()
    if (receiverRole !== 'admin') throw new Error('Escalation is allowed only to Security Administrator')
    const id = String(userId || '').trim()
    const user = mockUserState.get(id)
    if (user) user.status = 'Escalated'
    prependInbox('admin', {
      text: `Escalation received: ${reason}`,
      user_id: userId,
      sender_role: 'analyst',
      receiver_role: 'admin',
      time: nowTimeLabel(),
    })
    prependNotification('admin', {
      title: `Analyst escalated ${userId} to administrator`,
      time: nowTimeLabel(),
    })
    return { success: true, message: `${userId} escalated to Security Administrator` }
  }
  return apiFetch('/analyst/escalate', {
    method: 'POST',
    body: JSON.stringify({ userId, reason, receiverRole }),
  })
}

/**
 * Mark user as investigated
 * POST /analyst/mark-investigated
 */
export async function markInvestigated({ userId }) {
  if (USE_MOCK_API) {
    await delay()
    const id = String(userId || '').trim()
    const user = mockUserState.get(id)
    if (user) user.status = 'Investigated'
    prependNotification('admin', {
      title: `User ${userId} marked investigated by analyst`,
      time: nowTimeLabel(),
    })
    return { success: true, message: `${userId} marked as investigated` }
  }
  return apiFetch('/analyst/mark-investigated', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

// ============================================================
// ADMIN
// ============================================================

/**
 * Get system logs
 * GET /admin/logs
 */
export async function getAdminLogs() {
  if (USE_MOCK_API) {
    await delay()
    return Array.from(mockUserState.values())
  }
  return apiFetch('/admin/logs')
}

/**
 * Admin user action (lock / unlock / force reset)
 * POST /admin/user-action
 */
export async function adminUserAction({ userId, action }) {
  if (USE_MOCK_API) {
    await delay()
    const labels = {
      lock: 'Account locked',
      unlock: 'Account unlocked',
      reset: 'Force password reset triggered',
    }
    if (action === 'lock' || action === 'unlock') {
      const locked = action === 'lock'
      mockLockState.set(userId, locked)
      prependInbox('user', {
        text: `${labels[action]} for your account`,
        user_id: userId,
        sender_role: 'admin',
        receiver_role: 'user',
        time: nowTimeLabel(),
      })
      prependNotification('user', {
        title: `${labels[action]} — ${userId}`,
        time: nowTimeLabel(),
      })
      return {
        success: true,
        message: `${labels[action]} — ${userId}`,
        locked,
        nextAction: locked ? 'unlock' : 'lock',
      }
    }
    prependNotification('user', {
      title: `${labels[action] || action} — ${userId}`,
      time: nowTimeLabel(),
    })
    return { success: true, message: `${labels[action] || action} — ${userId}` }
  }
  return apiFetch('/admin/user-action', {
    method: 'POST',
    body: JSON.stringify({ userId, action }),
  })
}

/**
 * Get admin dashboard summary
 * GET /admin/dashboard
 */
export async function getAdminDashboard() {
  if (USE_MOCK_API) {
    await delay()
    const users = Array.from(mockUserState.values()).map(u => ({
      id: u.id,
      risk: u.risk,
      status: u.status,
      locked: !!mockLockState.get(u.id),
      loginAttempts: u.loginAttempts ?? 0,
      failedLogins: u.failedLogins ?? 0,
    }))
    return {
      totalUsers: 247,
      activeSessions: 38,
      criticalAlerts: 4,
      lockedAccounts: [...mockLockState.values()].filter(Boolean).length,
      users,
    }
  }
  return apiFetch('/admin/dashboard')
}

/**
 * Save monitoring interval
 * POST /admin/monitoring-settings
 */
export async function saveMonitoringSettings({ hours, minutes }) {
  if (USE_MOCK_API) {
    await delay()
    return { success: true, interval: `${hours}:${minutes}` }
  }
  return apiFetch('/admin/monitoring-settings', {
    method: 'POST',
    body: JSON.stringify({ hours, minutes }),
  })
}
