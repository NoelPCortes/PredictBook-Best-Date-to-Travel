# Database

This file describes the PostgreSQL tables for PredictBook: what each table stores, its fields, and how the tables connect.
It is the single source of truth for the schema. Codex must follow it and must not add, remove, or rename tables or fields without asking the owner (see `PROMPTING_RULES.md`).

Django names each table `<app>_<model>` (for example `accounts_user`). This file uses plain names.

---

## 1. Overview

| Table | Django app | Purpose |
|---|---|---|
| `users` | `accounts` | Accounts for Travelers and Staff |
| `airports` | `flights` | Airports used by flights, forecasts, and history |
| `airlines` | `flights` | Airlines that operate flights |
| `flights` | `flights` | Flight details and open seats (no passenger data) |
| `crowd_forecasts` | `traffic` | Expected crowd level (Low, Medium, High) per airport and date |
| `historical_records` | `traffic` | Past daily totals used to calculate forecasts |

These features have **no table of their own**, because they are calculated from the tables above:

- **Smart date suggestions** (`suggestions` app): read `crowd_forecasts` and `flights`.
- **Staff dashboard charts** (`dashboard` app): read `crowd_forecasts` and `historical_records`.

## 2. Relationships

- One airline has many flights.
- One airport has many departing flights and many arriving flights.
- One airport has many crowd forecasts and many historical records.
- Users are not linked to flights. There are no bookings, so no passenger is tied to a flight.

---

## 3. Tables

### 3.1 `users`

Uses a **custom Django user model**. This must be set up before the first migration, because changing it later is difficult.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | auto number | yes | Primary key |
| username | text (up to 150) | yes | Unique |
| email | email | yes | Unique |
| password | hashed text | yes | Stored only as a Django hash. Never plain text. Never returned by the API. |
| role | choice: `traveler`, `staff` | yes | Defaults to `traveler` |
| position | choice | staff only | Empty for travelers. Known values: Head, HR. Other positions: TBD |
| first_name | text | no | Can be added on the profile page |
| last_name | text | no | Can be added on the profile page |
| is_active | yes/no | yes | Defaults to yes. If no, the user cannot sign in |
| date_joined | date and time | yes | Set automatically |
| last_login | date and time | no | Set automatically |

Rules:

- **Sign-up always creates a Traveler.** The sign-up request must not be able to choose the role or position.
- **Staff accounts are created by an admin.** Admin means a Django superuser.
- Staff with the position Head or HR may also create staff accounts. **TBD until the owner confirms.** Until then, only an admin can.
- Django also has built-in `is_staff` and `is_superuser` flags. `is_staff` means "can open the Django admin site." It is **not** the same as our Staff role. Use `role` for all app logic.
- Phone number, home airport, and similar extras are not included.

### 3.2 `airports`

| Field | Type | Required | Notes |
|---|---|---|---|
| id | auto number | yes | Primary key |
| code | text (3 letters) | yes | Unique, for example `CEB` |
| name | text | yes | |
| city | text | yes | |
| country | text | yes | |

### 3.3 `airlines`

| Field | Type | Required | Notes |
|---|---|---|---|
| id | auto number | yes | Primary key |
| name | text | yes | Unique |
| code | text | yes | Unique short code |

### 3.4 `flights`

Flight details only. This is **not** a passenger ticket.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | auto number | yes | Primary key |
| airline | link to `airlines` | yes | |
| flight_number | text | yes | |
| origin | link to `airports` | yes | |
| destination | link to `airports` | yes | |
| departure_time | date and time | yes | Stored with time zone |
| arrival_time | date and time | yes | Stored with time zone |
| total_seats | whole number | yes | |
| available_seats | whole number | yes | |

Rules:

- Origin and destination must be different.
- Arrival must be after departure.
- Available seats must be between 0 and total seats.
- The same airline, flight number, and departure time cannot appear twice.
- **No price.** Ticket prices are not stored or shown.
- **No passenger names and no booking reference numbers.** Open seats are a count only.
- Terminal, gate, flight status, and cabin class are not included. Add them only if the owner asks.

### 3.5 `crowd_forecasts`

Expected airport crowd level for each airport and date. This table feeds the traffic calendar, the date suggestions, and the Staff charts.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | auto number | yes | Primary key |
| airport | link to `airports` | yes | |
| date | date | yes | |
| crowd_level | choice: `low`, `medium`, `high` | yes | Must always be set |
| crowd_score | number | no | The value behind the level, such as expected seats booked. Exact meaning: TBD |
| calculated_at | date and time | yes | When this forecast was made |
| data_source | text | no | Which dataset it came from. TBD |

Rules:

- One forecast per airport per date.
- **The color is not stored.** The frontend picks it from `crowd_level` (see `../frontend/UI_STYLE_GUIDE.md`, traffic calendar).
- Keep forecasts after their date passes. Comparing them with `historical_records` shows whether the 75% accuracy goal is met.
- The rules that turn data into Low, Medium, or High (thresholds) are **TBD**. They will be written in `docs/features/traffic-calendar.md`.

### 3.6 `historical_records`

Past daily totals per airport. The prediction logic uses these to calculate forecasts.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | auto number | yes | Primary key |
| airport | link to `airports` | yes | |
| date | date | yes | |
| total_flights | whole number | yes | |
| seats_total | whole number | yes | |
| seats_booked | whole number | yes | |

Rules:

- One record per airport per date.
- Totals only. No individual passenger or booking data.
- The dataset these come from is **TBD** (see `PRODUCT.md`, Data Source). Sample data and SQL scripts go in `backend/database/`.

---

## 4. Privacy and security

- Passwords are hashed by Django's built-in password hashing. They are never stored or logged in plain text.
- API responses never include the `password` field.
- Sign-in uses tokens. The password is only sent at sign-in, and the token is used for later requests.
- A user's profile details are visible only to that user and admins.
- The Staff dashboard shows summary charts only, never individual traveler details.
- No table stores passenger names, booking references, payment details, or ticket prices.
- Secrets and database credentials stay in `backend/.env` and are never committed.

## 5. Rules for changing the database

- Every schema change goes through a Django migration.
- Update this file in the same change as the migration.
- Do not add a table, field, or relationship that is not listed here without owner approval.
- Do not store passenger names, booking references, payment data, or prices without owner approval.
- Never delete or rewrite an applied migration without asking.

## 6. Open items (TBD)

- Whether Staff with the position Head or HR can create staff accounts, and the full list of staff positions.
- How `crowd_level` is calculated (thresholds), and what `crowd_score` measures.
- The dataset for flights, airports, airlines, and historical records.
