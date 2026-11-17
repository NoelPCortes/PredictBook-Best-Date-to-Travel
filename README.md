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

For optional **local sample data**, configure `SEED_FLIGHT_NUMBERS` below and
ensure the Staff user named by `SEED_STAFF_USERNAME` exists. If it is missing,
set a non-placeholder `SEED_STAFF_PASSWORD` locally and run
`python manage.py seed_staff` first. With `DEBUG=True`, run from `backend/`:

```bash
python manage.py seed_sample_data
```

This creates invented sample flights, not real timetables. Existing environment
files must not be replaced. Existing Staff users do not need `seed_staff` rerun.

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
its calendar reads airport forecasts and flights from the API. The booking and
recent-search cards show empty states because neither is stored. The inactive
sample flight-search form has been removed.
Sign out blacklists the refresh token and clears the local session even if the
request fails. Tokens are stored in localStorage only through the shared auth
storage module. A 401 causes one refresh attempt, then a single retry; failed
refresh clears the session and redirects to Sign-In.

## Account areas

`python manage.py seed_sample_data` is for local development with `DEBUG=True`.
It seeds seven airports (MNL, CEB, DVO, SIN, NRT, KIX, FUK) in the Philippines,
Singapore, and Japan, two airlines (Cebu Pacific / 5J and Singapore Airlines / SQ),
and ten invented flights. Flight numbers come from `SEED_FLIGHT_NUMBERS`, in order.
The variable must contain exactly ten distinct, nonempty comma-separated values,
each at most ten characters. The command requires the existing Staff user named
by `SEED_STAFF_USERNAME` and sets that user as each new flight's creator.

Lookups use `get_or_create` without modifying existing airports or airlines.
Matching seed-owned flights are updated by airline and flight number, so reruns
move their times forward and reset seats without adding more sample flights.
Other users' flights are never changed. Ambiguous seed-owned matches or conflicting
departures stop the whole operation without partial writes. No rows are deleted.
The command recalculates forecasts from the seeded flights in the same
transaction, preserving manual forecasts and removing only old rows whose source
is exactly `Sample data`. Scores now measure the booked-seat percentage.

The ten departures span tomorrow through nine days after today in the project's
`TIME_ZONE` (currently UTC). Arrival durations are real elapsed time. These are
invented local sample schedules, not real timetables or validated predictions.
Output contains only counts and the sample-data label.

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

The Staff dashboard uses real forecasts for today through today + 29 days at
one selected airport. It shows counts, every date by level, the busiest weekday,
next seven days, and own-record counts. The Head page lists Staff and pending
assignments and supports Assign and Remove. Charts and promote/remove-Head
screens remain unbuilt. See [accounts](docs/features/accounts.md) and
[frontend](docs/frontend.md) for paths, payloads, guards, and limitations.

## Flight and crowd forecast management

Staff and Heads can create, view, update, and delete flights and crowd forecasts.
Staff can change their own flights and manual forecasts; Heads can change any
flight or manual forecast. Automatically calculated forecasts are read-only
through the API and UI, including for Heads. PostgreSQL
stores a required, protected creator relationship for both record types. The
server sets ownership and forecast calculation timestamps; clients cannot send
those fields. Travelers read the data without creator information. Other users'
email addresses are never included in these responses.

Run `python manage.py migrate` from `backend/` to apply the ownership migrations.
The local tables were empty when these migrations were introduced. If adopting
them with existing flight or forecast rows, obtain an approved ownership backfill
before applying the required fields; do not invent a default owner.

| Frontend route | Access and purpose |
|---|---|
| `/staff/flights` | Staff/Head flight table |
| `/staff/flights/new` | Staff/Head flight creation |
| `/staff/flights/:id/edit` | Staff owner or Head flight editing |
| `/staff/forecasts` | Staff/Head forecast table |
| `/staff/forecasts/new` | Staff/Head forecast creation |
| `/staff/forecasts/:id/edit` | Staff owner or Head forecast editing |
| `/calendar` | Traveler airport calendar and selected-day flights |

Home and Traffic Calendar share the same airport dropdown, month grid, crowd
legend, and selected-date panel listing arrivals and departures. Missing forecasts show `No data`.
Month navigation remains enabled. Flight entry, display, and departure-date filters
use Philippine time (`Asia/Manila`, UTC+08:00). Sample seeding uses the project's
`TIME_ZONE` (currently UTC), so its times are converted for frontend display.
Django's `TIME_ZONE` remains `UTC`, with timezone-aware flight storage.

Staff navigation contains Dashboard, Flights, and Crowd forecasts. The dashboard
includes live `Your records` counts through `mine=true`. Head navigation always
shows Dashboard, Flights, Crowd forecasts, and Head management in that order,
including when a Head opens Staff pages.

The authenticated API provides read-only `/api/flights/airports/` and
`/api/flights/airlines/`, flight CRUD at `/api/flights/` and `/api/flights/<id>/`,
and forecast CRUD at `/api/traffic/forecasts/` and
`/api/traffic/forecasts/<id>/`. Detail updates use PATCH. See
[backend](docs/backend.md) for filters and validation behavior.

## Automatic forecast calculation and cleanup

Flight create, PATCH, and delete operations recalculate the old and new affected
airport/date pairs in the same database transaction. Dates use the project's
`TIME_ZONE` (currently UTC). For each pair, count departing flights by departure
date and arriving flights by arrival date. Sum their total seats and booked seats
(total minus available). The score is the booked-seat percentage, rounded to one
decimal: below 50 is Low, 50 to below 75 is Medium, and 75 or above is High.
No flights or zero total seats yields no calculated row.

Calculated rows use `Calculated from flights`; their first triggering user stays
the creator. Subsequent calculations keep that owner. Commands use the seed Staff
user named by `SEED_STAFF_USERNAME`. Every other source except the legacy exact
`Sample data` marker is manual and is never overwritten or deleted by calculation.
Forecast responses include live flight_count, seats_total, and seats_booked;
calculated rows have is_calculated=true, created_by_username=null, and can_edit=false.

Run from `backend/` with the existing seed Staff user:

```bash
python manage.py recalculate_forecasts
python manage.py recalculate_forecasts --remove-sample-data
```

The first command recalculates all flight-backed pairs and removes stale
calculated rows while preserving manual entries. The optional cleanup flag also
deletes only forecasts whose source is exactly `Sample data`. Both print counts
only. The approved one-time cleanup has been run locally; reruns are idempotent.
Neither command is evidence that invented sample flight schedules are real.

`GET /api/flights/?airport=<id>&date=YYYY-MM-DD` returns the same counted flights
using project-local dates. Existing origin/date filtering keeps its Philippine
departure-date behavior. Flight entry and time display remain Philippine time.
The forecast table links to `/staff/flights?airport=<id>&date=<date>` and the
flight list provides a removable filter notice.

Staff/Head summary: `GET /api/dashboard/summary/?airport=<id>`. With airport
omitted, it selects the first airport by code with a forecast in the next 30 days,
or the first airport by code. It returns airport, period_start, period_end,
counts, dates grouped by level (date and weekday), busiest_weekday, and next_7_days.
Ties choose the weekday whose first high date is earliest. All Airports remains TBD.

Head-only list: `GET /api/accounts/staff/`, returning staff username/email and
pending email/assigned_by_username/assigned_at only. Assign and Remove reuse
`POST /api/accounts/staff/assign/` and `/api/accounts/staff/revoke/`. Removing
Staff makes the account a Traveler; pending removal deletes only its assignment.

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
SEED_FLIGHT_NUMBERS=5J501,5J502,5J503,5J504,5J505,SQ901,SQ902,SQ903,SQ904,SQ905
```

Write values without quotes. Set `DEBUG=False` outside local development.

`SEED_FLIGHT_NUMBERS` contains invented sample identifiers for local development,
not secrets or real timetable information. Its first five values are assigned to
the Cebu Pacific samples and its final five to the Singapore Airlines samples.
Keep this list in the local backend environment; never commit `.env`.

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
