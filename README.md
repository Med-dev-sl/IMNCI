# IMNCI Django Project (minimal skeleton)

This repository contains a minimal Django project skeleton to get started.

Quick PowerShell setup and run (Windows):

```powershell
# Create a virtual environment in the project folder
python -m venv .venv

# Activate the venv (PowerShell)
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Apply migrations and run the development server
python manage.py migrate
python manage.py runserver
```

The site will be available at `http://127.0.0.1:8000/` and will display a simple "Hello, IMNCI" page.

Notes:
- Remember to replace the `SECRET_KEY` in `imnci_project/settings.py` before deploying to production.
- This skeleton uses SQLite for simplicity.
