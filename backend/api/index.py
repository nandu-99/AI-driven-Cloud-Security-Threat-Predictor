import sys
import os

# Add the parent directory (backend root) to sys.path
# This is required for both local development and Vercel runtime
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import create_app from main.py in the backend folder
try:
    from main import create_app
except ImportError:
    # Fallback for some IDE configurations
    from backend.main import create_app

app = create_app()

# This is the entry point for Vercel
if __name__ == "__main__":
    app.run()
