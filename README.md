# AI-Driven Cloud Security Threat Predictor
### Behaviour Drift Detection & Explainable AI (Abstraction Layer)

A production-structured React + Tailwind CSS frontend for a SOC cybersecurity platform with RBAC dashboards, mock API service layer, and Recharts visualisations.

---

## Split Structure

```
frontend/   -> React + Vite UI
backend/    -> Flask API + ML pipeline
```

## Quick Start

Backend:
```bash
cd backend
pip install -r requirements.txt
python main.py
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Open:
- Frontend: http://localhost:5173
- Backend: http://localhost:5001/api/health

---

## Demo Accounts

| Email                  | Password     | Role                   |
|------------------------|--------------|------------------------|
| user@gmail.com         | user123      | User                   |
| analyst@gmail.com      | analyst123   | System Analyst         |
| admin@gmail.com        | admin123     | Security Administrator |

---

## Tech Stack

- **React 18** + **Vite**
- **Tailwind CSS**
- **Recharts** — all charts render with live mock data
- **React Router v6** — client-side routing

---

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx            — Top navigation bar
│   ├── Sidebar.jsx           — Role-based sidebar
│   ├── NotificationsPanel.jsx — Bell-icon notifications
│   └── UI.jsx                — Shared card/badge/button components
├── context/
│   └── AuthContext.jsx       — Auth state, localStorage persistence
├── layouts/
│   └── AppShell.jsx          — Main layout with routing
├── mock-data/
│   └── mockData.js           — All mock datasets
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── user/
│   │   ├── UserDashboard.jsx
│   │   ├── UserActivity.jsx
│   │   └── UserSupport.jsx
│   ├── analyst/
│   │   ├── AnalystDashboard.jsx
│   │   ├── AnalystAlerts.jsx
│   │   └── AnalystRisk.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── AdminLogs.jsx
│       └── MonitoringSettings.jsx
└── services/
    └── api.js                — Centralized API service layer
```

---

## Frontend -> Backend Connection

Create `frontend/.env` from `frontend/.env.example`:

```bash
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:5001/api
```

### Expected Endpoints

| Method | Endpoint                    | Description               |
|--------|-----------------------------|---------------------------|
| POST   | /auth/login                 | Login                     |
| POST   | /auth/register              | Register                  |
| GET    | /user/dashboard             | User dashboard data       |
| POST   | /user/support               | Send support message      |
| GET    | /analyst/alerts             | Analyst alerts            |
| GET    | /analyst/dashboard          | Analyst dashboard stats   |
| POST   | /analyst/respond            | Respond to user           |
| POST   | /analyst/escalate           | Escalate alert            |
| POST   | /analyst/mark-investigated  | Mark user investigated    |
| GET    | /admin/logs                 | System logs               |
| GET    | /admin/dashboard            | Admin dashboard stats     |
| POST   | /admin/user-action          | Lock/unlock/reset user    |
| POST   | /admin/monitoring-settings  | Save ingestion interval   |

---

## RBAC Roles

| Role                   | Sidebar Pages                            |
|------------------------|------------------------------------------|
| User                   | Dashboard, Activity, Support             |
| System Analyst         | Dashboard, Alerts, Risk Overview         |
| Security Administrator | Dashboard, Logs, Monitoring Settings     |

---

## Features

- ✅ RBAC role-based dashboards (3 roles)
- ✅ Secure login / register flow (@gmail.com only, no duplicate email)
- ✅ Role NOT selectable at login — bound at registration
- ✅ JWT token stored in localStorage
- ✅ Notification bell per role with 3 notifications each
- ✅ All charts render immediately (no placeholders)
- ✅ Explainable AI reasoning panel (analysts)
- ✅ Admin user actions: lock / unlock / force reset
- ✅ Monitoring settings: editable by admin, view-only for analyst
- ✅ Search + filter on admin logs table
- ✅ Activity simulation buttons (users)
- ✅ Support ticket system
- ✅ Dark SOC theme (navy/black + cyan/neon green)
- ✅ Mock API with `USE_MOCK_API` toggle for backend connection
