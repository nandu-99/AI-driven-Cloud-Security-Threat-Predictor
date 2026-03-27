from flask import Flask
from flask_cors import CORS

from routes.admin_routes import admin_bp
from routes.analyst_routes import analyst_bp
from routes.auth_routes import auth_bp
from routes.notification_routes import notification_bp
from routes.prediction_routes import prediction_bp
from routes.user_routes import user_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(user_bp, url_prefix="/api")
    app.register_blueprint(analyst_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")
    app.register_blueprint(notification_bp, url_prefix="/api")
    app.register_blueprint(prediction_bp, url_prefix="/api")

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "threat-predictor-ml-backend"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5001, debug=True)
else:
    # Module-level app for gunicorn: gunicorn main:app
    app = create_app()
