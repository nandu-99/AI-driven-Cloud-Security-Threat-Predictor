"""
AI Cloud Security Threat Predictor — Flask Backend
Connects to the React frontend at http://localhost:5173
Run: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import jwt
import datetime
import uuid

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ─── CONFIG ────────────────────────────────────────────────────────────────
SECRET_KEY = "sec-threat-predictor-secret-2025"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# ─── IN-MEMORY DATA STORES ─────────────────────────────────────────────────

# Users registered in the system (email → {password, role})
USERS = {
    "user@gmail.com":     {"password": "user123",     "role": "user"},
    "analyst@gmail.com":  {"password": "analyst123",  "role": "analyst"},
    "admin@gmail.com":    {"password": "admin123",    "role": "admin"},
}

# Mock user risk profiles (for analyst/admin views)
MOCK_USERS = [
    {"id": "USR-1021", "risk": "High",   "status": "Under Investigation", "loginAttempts": 14, "failedLogins": 8,  "fileAccess": 47, "session": "4h 22m", "ts": "2025-01-15 09:14"},
    {"id": "USR-1043", "risk": "Medium", "status": "Monitoring",          "loginAttempts": 6,  "failedLogins": 2,  "fileAccess": 18, "session": "1h 45m", "ts": "2025-01-15 10:32"},
    {"id": "USR-1055", "risk": "Low",    "status": "Clear",               "loginAttempts": 2,  "failedLogins": 0,  "fileAccess": 7,  "session": "0h 38m", "ts": "2025-01-15 11:05"},
    {"id": "USR-1072", "risk": "High",   "status": "Escalated",           "loginAttempts": 19, "failedLogins": 12, "fileAccess": 83, "session": "6h 10m", "ts": "2025-01-15 07:48"},
    {"id": "USR-1088", "risk": "Medium", "status": "Monitoring",          "loginAttempts": 5,  "failedLogins": 1,  "fileAccess": 22, "session": "2h 12m", "ts": "2025-01-15 12:00"},
]

MOCK_ALERTS = [
    {"id": "USR-1072", "level": "high",   "desc": "Excess login attempts with multiple failures — possible brute force attack", "time": "07:48"},
    {"id": "USR-1021", "level": "high",   "desc": "Excess privileged file access during off-hours session",                   "time": "09:14"},
    {"id": "USR-1043", "level": "medium", "desc": "Login from unrecognised geographic location",                               "time": "10:32"},
    {"id": "USR-1088", "level": "medium", "desc": "Session duration exceeded usual baseline",                                  "time": "12:00"},
]

# Support tickets store
SUPPORT_TICKETS = []

# Monitoring settings store
MONITORING_SETTINGS = {"hours": "00", "minutes": "30"}

# ─── JWT HELPERS ───────────────────────────────────────────────────────────

def generate_token(email, role):
    payload = {
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """Decorator: require valid Bearer token in Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"message": "Token missing"}), 401
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload is None:
            return jsonify({"message": "Token invalid or expired"}), 401
        request.current_user = payload
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    """Decorator: require one of the specified roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.current_user.get("role") not in roles:
                return jsonify({"message": "Forbidden — insufficient role"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ─── HEALTH CHECK ──────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "AI Cloud Security Threat Predictor"})


# ══════════════════════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/register", methods=["POST"])
def register():
    """
    POST /api/auth/register
    Body: { email, password, role }
    Returns: { success, message }
    """
    data = request.get_json() or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role     = (data.get("role") or "user").strip().lower()

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if not email.endswith("@gmail.com"):
        return jsonify({"message": "Only @gmail.com emails are allowed"}), 400

    if role not in ("user", "analyst", "admin"):
        return jsonify({"message": "Invalid role — must be user, analyst, or admin"}), 400

    if email in USERS:
        return jsonify({"message": "Email already registered"}), 409

    USERS[email] = {"password": password, "role": role}
    return jsonify({"success": True, "message": "Registration successful"}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    """
    POST /api/auth/login
    Body: { email, password }
    Returns: { token, user: { email, role } }
    """
    data = request.get_json() or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = USERS.get(email)
    if not user or user["password"] != password:
        return jsonify({"message": "Invalid credentials"}), 401

    token = generate_token(email, user["role"])
    return jsonify({
        "token": token,
        "user": {"email": email, "role": user["role"]},
    })


# ══════════════════════════════════════════════════════════════════════════════
#  USER ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/user/dashboard")
@token_required
def user_dashboard():
    """GET /api/user/dashboard — returns user dashboard summary"""
    return jsonify({
        "accountStatus": "Active",
        "lastLogin": "Today 09:14 AM",
        "sessionsToday": 3,
        "alerts": 1,
    })


@app.route("/api/user/activity")
@token_required
def user_activity():
    """GET /api/user/activity — returns recent activity log"""
    return jsonify([
        {"icon": "🔑", "text": "Login from Chrome / Windows 11",         "time": "Today 09:14 AM"},
        {"icon": "📂", "text": "Accessed file: /reports/q4-2024.xlsx",   "time": "Today 09:22 AM"},
        {"icon": "🔑", "text": "Login from mobile device",                "time": "Today 02:45 PM"},
        {"icon": "⚙",  "text": "Password change attempted",               "time": "Today 03:10 PM"},
        {"icon": "🌍", "text": "Session from new location detected",       "time": "Yesterday"},
        {"icon": "📄", "text": "Accessed file: /configs/system.json",     "time": "Yesterday"},
        {"icon": "🔑", "text": "Login from Chrome / macOS",               "time": "2 days ago"},
    ])


@app.route("/api/user/support", methods=["POST"])
@token_required
def user_support():
    """
    POST /api/user/support
    Body: { subject, message }
    Returns: { success, ticketId }
    """
    data    = request.get_json() or {}
    subject = data.get("subject") or ""
    message = data.get("message") or ""

    if not subject or not message:
        return jsonify({"message": "Subject and message are required"}), 400

    ticket_id = "TKT-" + str(uuid.uuid4())[:8].upper()
    SUPPORT_TICKETS.append({
        "ticketId":  ticket_id,
        "from":      request.current_user["email"],
        "subject":   subject,
        "message":   message,
        "createdAt": datetime.datetime.utcnow().isoformat(),
    })
    return jsonify({"success": True, "ticketId": ticket_id})


# ══════════════════════════════════════════════════════════════════════════════
#  ANALYST ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/analyst/alerts")
@token_required
def analyst_alerts():
    """GET /api/analyst/alerts — returns current threat alerts"""
    return jsonify(MOCK_ALERTS)


@app.route("/api/analyst/dashboard")
@token_required
def analyst_dashboard():
    """GET /api/analyst/dashboard — returns analyst summary stats"""
    return jsonify({
        "users":                MOCK_USERS,
        "highRisk":             3,
        "underInvestigation":   2,
        "escalated":            1,
        "clearedToday":         7,
    })


@app.route("/api/analyst/risk")
@token_required
def analyst_risk():
    """GET /api/analyst/risk — returns risk analytics data"""
    return jsonify({
        "anomalyData": [
            {"t": "Mon", "score": 12}, {"t": "Tue", "score": 18}, {"t": "Wed", "score": 34},
            {"t": "Thu", "score": 28}, {"t": "Fri", "score": 52}, {"t": "Sat", "score": 41}, {"t": "Sun", "score": 67},
        ],
        "driftData": [
            {"t": "Mon", "drift": 5},  {"t": "Tue", "drift": 9},  {"t": "Wed", "drift": 14},
            {"t": "Thu", "drift": 11}, {"t": "Fri", "drift": 22}, {"t": "Sat", "drift": 18}, {"t": "Sun", "drift": 31},
        ],
        "riskDistData": [
            {"name": "High", "value": 3}, {"name": "Medium", "value": 8}, {"name": "Low", "value": 14},
        ],
        "weeklyRisk": [
            {"t": "Mon", "high": 2, "medium": 5, "low": 8},  {"t": "Tue", "high": 3, "medium": 6, "low": 7},
            {"t": "Wed", "high": 5, "medium": 4, "low": 6},  {"t": "Thu", "high": 4, "medium": 7, "low": 5},
            {"t": "Fri", "high": 7, "medium": 5, "low": 4},  {"t": "Sat", "high": 6, "medium": 8, "low": 6},
            {"t": "Sun", "high": 9, "medium": 6, "low": 3},
        ],
    })


@app.route("/api/analyst/respond", methods=["POST"])
@token_required
def analyst_respond():
    """
    POST /api/analyst/respond
    Body: { userId, message }
    Returns: { success, message }
    """
    data    = request.get_json() or {}
    user_id = data.get("userId") or ""
    message = data.get("message") or ""
    if not user_id or not message:
        return jsonify({"message": "userId and message are required"}), 400
    return jsonify({"success": True, "message": f"Response sent to {user_id}"})


@app.route("/api/analyst/escalate", methods=["POST"])
@token_required
def analyst_escalate():
    """
    POST /api/analyst/escalate
    Body: { userId, reason }
    Returns: { success, message }
    """
    data    = request.get_json() or {}
    user_id = data.get("userId") or ""
    reason  = data.get("reason") or ""
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
    return jsonify({"success": True, "message": f"{user_id} escalated to Security Administrator"})


@app.route("/api/analyst/mark-investigated", methods=["POST"])
@token_required
def analyst_mark_investigated():
    """
    POST /api/analyst/mark-investigated
    Body: { userId }
    Returns: { success, message }
    """
    data    = request.get_json() or {}
    user_id = data.get("userId") or ""
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
    return jsonify({"success": True, "message": f"{user_id} marked as investigated"})


# ══════════════════════════════════════════════════════════════════════════════
#  ADMIN ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/admin/dashboard")
@token_required
def admin_dashboard():
    """GET /api/admin/dashboard — returns system-wide summary"""
    return jsonify({
        "totalUsers":       247,
        "activeSessions":   38,
        "criticalAlerts":   4,
        "lockedAccounts":   2,
    })


@app.route("/api/admin/logs")
@token_required
def admin_logs():
    """GET /api/admin/logs — returns user audit log rows"""
    return jsonify(MOCK_USERS)


@app.route("/api/admin/user-action", methods=["POST"])
@token_required
def admin_user_action():
    """
    POST /api/admin/user-action
    Body: { userId, action }   action: "lock" | "unlock" | "reset"
    Returns: { success, message }
    """
    data    = request.get_json() or {}
    user_id = data.get("userId") or ""
    action  = data.get("action") or ""

    labels = {
        "lock":   "Account locked",
        "unlock": "Account unlocked",
        "reset":  "Force password reset triggered",
    }
    if action not in labels:
        return jsonify({"message": "Invalid action — must be lock, unlock, or reset"}), 400

    return jsonify({"success": True, "message": f"{labels[action]} — {user_id}"})


@app.route("/api/admin/monitoring-settings", methods=["POST"])
@token_required
def admin_monitoring_settings():
    """
    POST /api/admin/monitoring-settings
    Body: { hours, minutes }
    Returns: { success, interval }
    """
    data = request.get_json() or {}
    hours   = data.get("hours", "00")
    minutes = data.get("minutes", "30")
    MONITORING_SETTINGS["hours"]   = str(hours)
    MONITORING_SETTINGS["minutes"] = str(minutes)
    return jsonify({"success": True, "interval": f"{hours}:{minutes}"})


@app.route("/api/admin/monitoring-settings")
@token_required
def get_monitoring_settings():
    """GET /api/admin/monitoring-settings — returns current interval"""
    return jsonify(MONITORING_SETTINGS)


# ─── ANALYTICS (shared) ───────────────────────────────────────────────────

@app.route("/api/analytics/login-trend")
@token_required
def login_trend():
    return jsonify([
        {"t": "Mon", "attempts": 42}, {"t": "Tue", "attempts": 38}, {"t": "Wed", "attempts": 67},
        {"t": "Thu", "attempts": 55}, {"t": "Fri", "attempts": 89}, {"t": "Sat", "attempts": 74}, {"t": "Sun", "attempts": 103},
    ])


@app.route("/api/analytics/failed-trend")
@token_required
def failed_trend():
    return jsonify([
        {"t": "Mon", "failed": 8},  {"t": "Tue", "failed": 12}, {"t": "Wed", "failed": 21},
        {"t": "Thu", "failed": 16}, {"t": "Fri", "failed": 34}, {"t": "Sat", "failed": 28}, {"t": "Sun", "failed": 47},
    ])


@app.route("/api/analytics/file-access")
@token_required
def file_access():
    return jsonify([
        {"user": "USR-1021", "count": 47}, {"user": "USR-1072", "count": 83},
        {"user": "USR-1043", "count": 18}, {"user": "USR-1055", "count": 7},  {"user": "USR-1088", "count": 22},
    ])


@app.route("/api/analytics/alert-severity")
@token_required
def alert_severity():
    return jsonify([
        {"name": "Critical", "value": 4}, {"name": "High",   "value": 9},
        {"name": "Medium",   "value": 15}, {"name": "Low",    "value": 22},
    ])


# ─── ERROR HANDLERS ────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({"message": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"message": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"message": "Internal server error"}), 500


# ─── ENTRY POINT ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n🔐  AI Cloud Security Threat Predictor — Backend")
    print("=" * 52)
    print("  Server  : http://localhost:5000")
    print("  Health  : http://localhost:5000/api/health")
    print("  Frontend: http://localhost:5173  (run: npm run dev)")
    print("=" * 52)
    print("\n  Demo login credentials:")
    print("    user@gmail.com     / user123")
    print("    analyst@gmail.com  / analyst123")
    print("    admin@gmail.com    / admin123")
    print()
    app.run(host="0.0.0.0", port=5000, debug=True)
