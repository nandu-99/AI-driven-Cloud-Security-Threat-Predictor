import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import NotificationsPanel from '../components/NotificationsPanel.jsx'

// User pages
import UserDashboard from '../pages/user/UserDashboard.jsx'
import UserActivity from '../pages/user/UserActivity.jsx'
import UserSupport from '../pages/user/UserSupport.jsx'

// Analyst pages
import AnalystDashboard from '../pages/analyst/AnalystDashboard.jsx'
import AnalystAlerts from '../pages/analyst/AnalystAlerts.jsx'
import AnalystRisk from '../pages/analyst/AnalystRisk.jsx'

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import AdminLogs from '../pages/admin/AdminLogs.jsx'
import MonitoringSettings from '../pages/admin/MonitoringSettings.jsx'

const ROLE_DEFAULT = { user: 'dashboard', analyst: 'dashboard', admin: 'dashboard' }

export default function AppShell() {
  const { currentUser } = useAuth()
  const role = currentUser?.role
  const [showNotif, setShowNotif] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar showNotif={showNotif} setShowNotif={setShowNotif} />
      {showNotif && <NotificationsPanel role={role} onClose={() => setShowNotif(false)} />}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar role={role} />
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          <Routes>
            {role === 'user' && (
              <>
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="activity" element={<UserActivity />} />
                <Route path="support" element={<UserSupport />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </>
            )}
            {role === 'analyst' && (
              <>
                <Route path="dashboard" element={<AnalystDashboard />} />
                <Route path="alerts" element={<AnalystAlerts />} />
                <Route path="risk" element={<AnalystRisk />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </>
            )}
            {role === 'admin' && (
              <>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="monitoring" element={<MonitoringSettings isAdmin={true} />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </div>
  )
}
