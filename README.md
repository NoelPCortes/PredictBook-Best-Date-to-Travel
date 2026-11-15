# PredictBook: Best Date To Travel

IT317 Project Management, Section G7 | Cebu Institute of Technology, University (College of Computer Studies)

PredictBook is a web application that helps travelers find the best dates to fly. It combines flight search, open seat information, an airport crowd-level calendar (Low, Medium, High), and smart date suggestions. Staff get a dashboard with summary charts of upcoming busy travel days.

For the problem, users, features, scope, and success criteria, see [PRODUCT.md](PRODUCT.md).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite), Vitest |
| Linting and formatting (frontend) | ESLint with typescript-eslint, Prettier |
| Backend | Python, Django, Django REST Framework |
| Linting and testing (backend) | Ruff, pytest-django |
| Database | PostgreSQL |

## Repository Layout

This is the planned layout. Adjust app names if the team decides differently.

```
PredictBook/
├── backend/                 Django API
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/              Settings, URLs, WSGI/ASGI
│   ├── accounts/             Sign-up, login, profiles, Traveler/Staff/Head roles, role management
│   ├── flights/             Airports, airlines, flights, flight search
│   ├── traffic/             Historical records, crowd levels, prediction logic
│   ├── suggestions/         Best-date recommendation logic
│   ├── dashboard/           Staff summary charts data
│   ├── database/            Database files: sample flight data and SQL scripts
│   └── tests/               Backend tests
├── frontend/                React + TypeScript (Vite) app
│   ├── src/
│   │   ├── api/             API client
│   │   ├── components/      Shared UI (calendar, flight cards, charts)
│   │   ├── pages/           Search, Calendar, Suggestions, Profile, Staff Dashboard
│   │   └── types/           Shared TypeScript types
│   ├── .env.example
│   └── package.json
├── docs/                    Documentation (see Docs Layout below)
│   ├── README.md            Index of all docs
│   ├── architecture.md      How the frontend, backend, and database fit together
│   ├── backend.md           Django apps, models, and API structure
│   ├── frontend.md          React structure, pages, components, and API usage
│   ├── database.md          PostgreSQL tables and relationships
│   └── features/            One file per feature
│       ├── accounts.md
│       ├── flight-search.md
│       ├── traffic-calendar.md
│       ├── date-suggestions.md
│       └── staff-dashboard.md
├── .gitignore
├── PRODUCT.md               What the product does and does not do
└── README.md                Setup and overview
```

## Docs Layout

The `docs/` folder explains how the codebase is built. Keep these files updated when the structure or a feature changes.

| File | What it explains |
|---|---|
| `docs/README.md` | Index linking to every doc below |
| `docs/architecture.md` | The overall structure: how React, Django, and PostgreSQL connect, and how a request flows from the browser to the database |
| `docs/backend.md` | Each Django app (`accounts`, `flights`, `traffic`, `suggestions`, `dashboard`), its models, and its API endpoints |
| `docs/frontend.md` | Folder structure, pages, shared components, and how the frontend calls the API |
| `docs/database.md` | Tables, fields, and relationships |
| `docs/features/accounts.md` | Sign-up, login, profiles, Traveler/Staff/Head roles, and Head management permissions |
| `docs/features/flight-search.md` | Flight search and flight details |
| `docs/features/traffic-calendar.md` | The crowd-level calendar and how Low, Medium, and High are calculated |
| `docs/features/date-suggestions.md` | How the best dates are chosen and explained |
| `docs/features/staff-dashboard.md` | The Staff summary charts |

Each feature doc should cover what the feature does, which backend app and frontend page it uses, and how it works.

## Setup

### Prerequisites

- Python 3.12 or newer
- Node.js (current LTS) and npm
- PostgreSQL, with the default port 5432

### 1. Clone the repository

```bash
git clone <repository-url>
cd PredictBook
```

### 2. Create the database

Open `psql` as a PostgreSQL superuser and run the following. The quotes keep the capital letters in the database name.

```sql
CREATE DATABASE "PredictBook";
```

The name must match `DB_NAME` in `backend/.env` (see [Database Configuration](#database-configuration)). Django reads the database name, user, password, host, and port from that file, so no credentials are written in the code.

### 3. Backend (Django)

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows (cmd): .venv\Scripts\activate
                                   # Windows (PowerShell): .venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy the environment template and fill in values locally (never commit .env)
cp .env.example .env               # Windows (cmd): copy .env.example .env

# Apply migrations and create an admin account
python manage.py migrate
python manage.py createsuperuser

# Run the API
python manage.py runserver         # http://localhost:8000

# Tests and lint
pytest
ruff check .
```

### 4. Frontend (React + TypeScript)

```bash
cd frontend

npm install

# Copy the environment template
cp .env.example .env               # Windows (cmd): copy .env.example .env

npm run dev                        # http://localhost:5173
npm test                           # Vitest
npm run lint                       # ESLint
```

## Environment Variables

### `backend/.env`

```env
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=PredictBook
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Write values without quotes. Set `DEBUG=False` outside local development.

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

Commit only the `.env.example` files. Never commit `.env`. The root `.gitignore` already ignores `.env`, including `backend/.env` and `frontend/.env`.

## Database Configuration

The backend reads all database settings from `backend/.env`. Nothing is hard-coded in `settings.py`.

| Variable in `backend/.env` | Used for |
|---|---|
| `DB_NAME` | Database name (`PredictBook`) |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | Database host (`localhost`) |
| `DB_PORT` | Database port (`5432`) |

In `backend/config/settings.py`, load the file with `python-dotenv` and read the values from the environment:

```python
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = [h for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["DB_NAME"],
        "USER": os.environ["DB_USER"],
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

CORS_ALLOWED_ORIGINS = [
    o for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o
]
```

`SECRET_KEY`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` are required. Django stops with a `KeyError` if any is missing from `.env`, which tells you what to fix. To check the connection, run `python manage.py migrate`. A wrong name, user, or password shows up there as a connection error.

## First-Time Project Bootstrap

You only need this section if the `backend/` and `frontend/` folders do not exist yet. Skip it once the code is in the repository.

```bash
# Backend
mkdir backend && cd backend
python -m venv .venv
source .venv/bin/activate          # Windows (cmd): .venv\Scripts\activate
pip install django djangorestframework django-cors-headers "psycopg[binary]" python-dotenv
pip install pytest-django ruff
django-admin startproject config .
python manage.py startapp accounts
python manage.py startapp flights
python manage.py startapp traffic
python manage.py startapp suggestions
python manage.py startapp dashboard
pip freeze > requirements.txt
cd ..

# Frontend (the React + TypeScript template includes ESLint with typescript-eslint)
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D vitest prettier
```