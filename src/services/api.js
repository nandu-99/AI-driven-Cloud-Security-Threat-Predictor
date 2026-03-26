// ============================================================
// src/services/api.js
// Centralized API Service Layer
// Toggle USE_MOCK_API to switch between mock and real backend
// ============================================================

import {
  MOCK_USERS,
  MOCK_ALERTS,
  MOCK_REGISTERED_USERS,
} from '../mock-data/mockData.js'

// -----------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------
const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API || 'false') === 'true'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// -----------------------------------------------------------
// HELPER: In-memory registered users (for mock mode)
// -----------------------------------------------------------
const registeredUsers = new Map(MOCK_REGISTERED_USERS)

// -----------------------------------------------------------
// HELPER: Simulate network latency in mock mode
// -----------------------------------------------------------
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms))

// -----------------------------------------------------------
// HELPER: Real fetch wrapper
// -----------------------------------------------------------
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
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
    if (!email.endsWith('@gmail.com')) throw new Error('Only @gmail.com emails are allowed')
    if (registeredUsers.has(email)) throw new Error('Email already registered')
    registeredUsers.set(email, { password, role })
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
    const user = registeredUsers.get(email)
    if (!user || user.password !== password) throw new Error('Invalid credentials')
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: { email, role: user.role },
    }
  }
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
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
    return { success: true, ticketId: 'TKT-' + Math.floor(Math.random() * 9000 + 1000) }
  }
  return apiFetch('/user/support', {
    method: 'POST',
    body: JSON.stringify({ subject, message }),
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
    return {
      users: MOCK_USERS,
      highRisk: 3,
      underInvestigation: 2,
      escalated: 1,
      clearedToday: 7,
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
export async function escalateAlert({ userId, reason }) {
  if (USE_MOCK_API) {
    await delay()
    return { success: true, message: `${userId} escalated to Security Administrator` }
  }
  return apiFetch('/analyst/escalate', {
    method: 'POST',
    body: JSON.stringify({ userId, reason }),
  })
}

/**
 * Mark user as investigated
 * POST /analyst/mark-investigated
 */
export async function markInvestigated({ userId }) {
  if (USE_MOCK_API) {
    await delay()
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
    return MOCK_USERS
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
    return {
      totalUsers: 247,
      activeSessions: 38,
      criticalAlerts: 4,
      lockedAccounts: 2,
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
