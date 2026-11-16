# PredictBook: Best Date To Travel

IT317 Project Management, Section G7 | Cebu Institute of Technology, University (College of Computer Studies)

PredictBook is a web application that helps travelers find the best dates to fly. It combines flight search, open seat information, an airport crowd-level calendar (Low, Medium, High), and smart date suggestions. Staff get a dashboard with summary charts of upcoming busy travel days.

For the problem, users, features, scope, and success criteria, see [PRODUCT.md](PRODUCT.md).

## Project Documents

| File | What it covers |
|---|---|
| [PRODUCT.md](PRODUCT.md) | What the product does and does not do |
| [docs/database.md](docs/database.md) | Database tables, fields, and relationships |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | How code must be written |
| [frontend/UI_STYLE_GUIDE.md](frontend/UI_STYLE_GUIDE.md) | How the interface must look and behave |
| [PROMPTING_RULES.md](PROMPTING_RULES.md) | How Codex handles requests in this project |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite), Vitest |
| Linting and formatting (frontend) | ESLint with typescript-eslint, Prettier |
| Backend | Python, Django, Django REST Framework |
| Linting and testing (backend) | Ruff, pytest-django |
| Database | PostgreSQL |
| Authentication | Token-based (JWT), djangorestframework-simplejwt with token_blacklist |

## Repository Layout

This is the planned layout. Adjust app names if the team decides differently.

```
PredictBook/
├── backend/                 Django API
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/              Settings, URLs, WSGI/ASGI
│   ├── accounts/            Sign-up, login, profiles, Traveler/Staff/Head roles, role management
│   ├── flights/             Airports, airlines, flights, flight search
│   ├── traffic/             Historical records, crowd levels, prediction logic
│   ├── suggestions/         Best-date recommendation logic
│   ├── dashboard/           Staff summary charts data
│   ├── database/            Database files: sample flight data and SQL scripts
│   └── tests/               Backend tests
├── frontend/                React + TypeScript (Vite) app
│   ├── src/
│   │   ├── api/             Shared API client
│   │   ├── assets/icons/    Icons (see the UI style guide)
│   │   ├── components/      Shared UI (calendar, flight cards, charts)
│   │   ├── features/        One folder per feature (see the coding standards)
│   │   ├── pages/           TBD: not yet decided alongside features/
│   │   ├── references/      Design reference images (never rendered on a page)
│   │   └── types/           Shared TypeScript types
│   ├── UI_STYLE_GUIDE.md
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
├── CODING_STANDARDS.md      How code must be written
├── PROMPTING_RULES.md       How Codex handles requests
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
| `docs/features/staff-dashboard.md` | The Staff Dashboard and Charts pages |

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
python -m pytest
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

## Accounts API

The backend implements the approved [accounts contract](docs/features/accounts.md)
under `/api/accounts/`. Sign-in returns access and refresh tokens plus a safe
profile. Send `Authorization: Bearer <access>` for protected requests. Access
tokens last 15 minutes; refresh tokens last 7 days and rotate, blacklisting the
previous refresh token. Logout blacklists the caller's refresh token; existing
access tokens expire normally.

`accounts.User` is configured before the initial migrations. After running
`createsuperuser`, sign in to `/admin/` and create or edit an initial Head, set
`role=head`, and leave `promoted_by` empty. The app's Staff/Head roles do not grant
Django admin access. No other project models are registered in admin.

Backend tests run against Django's separate PostgreSQL test database (the database
user needs permission to create it). They cover accounts, role permissions, and
schema constraints. They do not switch to SQLite. React Sign-Up and Sign-In now
use the existing API. Home is protected and displays the signed-in username;
its flight, calendar, booking, and search information remains labeled sample data.
Sign out blacklists the refresh token and clears the local session even if the
request fails. Tokens are stored in localStorage only through the shared auth
storage module. A 401 causes one refresh attempt, then a single retry; failed
refresh clears the session and redirects to Sign-In.

## Account areas

For sample flight data, run `python manage.py seed_staff` first, then
`python manage.py seed_sample_data` from `backend/`. The latter requires the
existing Staff user named by `SEED_STAFF_USERNAME` and idempotently creates five
Philippine airports, three airlines, and five flights per day for the next 14
days (including today in Philippine time). Its output contains counts and a
sample-data notice only. These are sample schedules, not real airline data.

No additional dependency, migration, environment variable, or setup command is
needed for the role pages and own-profile UI.

| Role | Sign-in landing page | Other account access |
|---|---|---|
| Traveler | `/home` | `/profile` |
| Staff | `/staff/dashboard` | `/profile` |
| Head | `/head` | `/staff/dashboard` and `/profile` |

The top-bar username opens My account. Users can edit their own username, email,
first name and last name, or change their password with their current password.
Role is read-only. Successful registration shows **Account created. Please sign
in.** The profile and password API already enforce ownership and validation;
frontend guards are backed by current-role checks on protected Staff/Head APIs.

The Staff dashboard is explicitly sample data for January 2026. Its upcoming
panels use the live local date; they show no upcoming sample days after that
month. The Head page assigns Staff by email. No Charts page or promote/remove
screens were added. See [accounts](docs/features/accounts.md) and
[frontend](docs/frontend.md) for paths, payloads, guards, and limitations.

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

SEED_STAFF_USERNAME=seed_staff
SEED_STAFF_EMAIL=staff@example.com
SEED_STAFF_PASSWORD=change-me-staff-password
```

Write values without quotes. Set `DEBUG=False` outside local development.

The three `SEED_STAFF_*` variables are **for local testing only**. Replace
`SEED_STAFF_PASSWORD` in your local `backend/.env` with your own password, then
run `python manage.py seed_staff` from `backend/`. The command refuses to run
unless `DEBUG=True`, refuses the placeholder password, and names missing
variables without printing their values. It creates or updates a Staff account
and hashes its password through Django; existing Heads remain unchanged.
Username/email matching different accounts is rejected. It prints only the
username and created/updated status (or a Head-preservation message), and leaves
pending Staff assignments untouched. It does not grant Django admin access.
Never put Staff credentials in frontend environment files or real passwords in
`.env.example`. Existing `.env` files must not be replaced by template copies.

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
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers "psycopg[binary]" python-dotenv
pip install pytest-django ruff
django-admin startproject config .
python manage.py startapp accounts
python manage.py startapp flights
python manage.py startapp traffic
python manage.py startapp suggestions
python manage.py startapp dashboard
pip freeze > requirements.txt
cd ..
```

Enable DRF JWTAuthentication and add rest_framework_simplejwt.token_blacklist to INSTALLED_APPS. The blacklist app tracks outstanding and revoked refresh tokens through library-managed migrations.

Before the first `python manage.py migrate`, create the custom user model in `accounts` and set `AUTH_USER_MODEL` in `settings.py` (see [docs/database.md](docs/database.md)). Changing it after the first migration is difficult.

```bash
# Frontend (the React + TypeScript template includes ESLint with typescript-eslint)
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D vitest prettier
npm install react-router-dom       # page routing
```
