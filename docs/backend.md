# Backend

## Current implementation

The Django project lives in `backend/config/`. Settings load the local environment
through python-dotenv and use PostgreSQL. Credentials remain local. Accounts,
flights, traffic, Django admin, DRF, and SimpleJWT token blacklisting are configured.
Django's `TIME_ZONE` remains `UTC` and `USE_TZ=True`.

Accounts retain their existing sign-up, username/email sign-in, rotating JWT
refresh, logout, self-profile, password, and Head management behavior. See
[accounts](features/accounts.md) for the existing contract. `/api/dashboard/`
continues as a legacy Staff/Head access probe. Displayed dashboard data comes
from the new authenticated summary endpoint.

## Flight and crowd forecast API

`config/urls.py` includes `flights.urls` at `/api/flights/` and `traffic.urls` at
`/api/traffic/`. Requests use the existing JWT bearer authentication. Signed-out
requests return 401. Every signed-in role can read. Travelers receive 403 on
writes. Staff and Heads can create records. Staff can update/delete only their
own flights/manual forecasts; Heads can update/delete any flight or manual
forecast. Calculated forecasts are read-only for every role. Current database roles apply on
every request, including when the caller's token predates a role change.

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/api/flights/airports/` | Read-only airport lookup |
| GET | `/api/flights/airlines/` | Read-only airline lookup |
| GET, POST | `/api/flights/` | List or create flights |
| GET, PATCH, DELETE | `/api/flights/<id>/` | Retrieve, update or delete a flight |
| GET, POST | `/api/traffic/forecasts/` | List or create crowd forecasts |
| GET, PATCH, DELETE | `/api/traffic/forecasts/<id>/` | Retrieve, update or delete a forecast |

Lists return arrays ordered by departure time for flights and by date/airport for
forecasts. Flight filters are `origin=<airport id>`, `date=YYYY-MM-DD`, and
`mine=true`. The new `airport=<id>` filter counts departures and arrivals using
project-local dates when combined with date. Without airport, existing
departure-date filtering uses the Philippine day from midnight to
midnight in `Asia/Manila`. Forecast filters are `airport=<airport id>`,
`month=YYYY-MM`, and `mine=true`. Filters combine. Omitting filters returns all
readable records; `mine=true` restricts results to the signed-in creator.

Flight input uses `airline`, `flight_number`, `origin`, `destination`,
`departure_time`, `arrival_time`, `total_seats`, and `available_seats`. Responses
also include `id`, `airline_name`, `airline_code`, `origin_code`, `origin_name`,
`destination_code`, and `destination_name`, so callers need no flight lookup
requests. Flight timestamps are timezone-aware; frontend entry and display use
Philippine time without changing Django's timezone.

Forecast input uses `airport`, `date`, `crowd_level`, optional `crowd_score`, and
optional `data_source`. Responses also include `id` and `calculated_at`. The
server sets `calculated_at` to the current time on create and update. Blank or
omitted sources on creation become `Staff entry`; updates retain an existing
source unless a replacement is supplied, normalizing blank sources the same way.

Both models have required `created_by` foreign keys to the custom user model with
`on_delete=PROTECT`. The server sets ownership; clients cannot reassign it.
Requests containing `created_by`, or forecast `calculated_at`, return field-level
400 messages. The calculated source is reserved for the calculation service. Staff/Head responses include `created_by_username` and a
server-computed `can_edit`. Traveler responses omit both. Creator IDs and other
users' email addresses are not returned.

Serializers enforce the [database rules](database.md), including partial updates.
Flight route, time, seat range, and duplicate constraints return field-level 400
errors. Forecasts accept only low/medium/high and one airport/date record.
Duplicate forecasts return a `date` error. Save services translate PostgreSQL
constraint races for the documented constraints into field-level 400 responses.
Create returns 201, successful PATCH returns 200, and DELETE returns 204.

Views use DRF generics, the existing ownership permission class, and related
object loading. Business saves live in services. No raw SQL or new dependency is
used. Airports and airlines have no write endpoints.

## Migrations, samples, and checks

Ownership migrations are additive and have no default owner. The local flight
and forecast tables were empty before each migration was written and applied.
An existing-row installation requires an owner-approved backfill decision first.
Applied migrations must not be rewritten.

`accounts/management/commands/seed_sample_data.py` remains DEBUG-only and requires
the Staff user named by SEED_STAFF_USERNAME. SEED_FLIGHT_NUMBERS must supply ten
distinct comma-separated identifiers, each at most ten characters. Lookups use
get_or_create for seven approved airports and Cebu Pacific/Singapore Airlines.
It creates or updates ten invented seed-owned flights without modifying another
user's flights or existing lookups. Its transaction now invokes recalculation
and removes exact Sample data forecast fixtures. It prints counts only. These
are invented local schedules, not real timetables.

`python manage.py recalculate_forecasts` uses that same existing seed Staff user.
Its optional --remove-sample-data flag deletes only exact Sample data forecast
rows. It reports created, updated, deleted, manual skipped, and sample deleted
counts. Manual records are preserved. No new migration or dependency is required.

Run `python -m pytest` and `ruff check .` from `backend/`. Tests use Django's
separate PostgreSQL test database and cover Standard Features, ownership,
permissions, privacy, server-managed fields, documented validation, filters,
constraint races, and seed idempotence. They do not prove browser integration.

## Remaining work

Production datasets, historical prediction logic, accuracy evaluation, dedicated flight search contracts/results, date
suggestions, and chart APIs remain TBD. `suggestions` and the remaining dashboard
work are scaffolded. `backend/database/` remains reserved for datasets and SQL
scripts; management-command fixtures are generated by the command above.


## Flight-based calculation service

traffic/calculation.py defines MEDIUM_THRESHOLD=50, HIGH_THRESHOLD=75, and the
calculated/source markers in one place. It groups origin/departure dates and
destination/arrival dates in settings.TIME_ZONE. Total seats and booked seats
(total minus available) are summed, and percentage score is decimal half-up
rounded to one decimal before classifying Low (<50), Medium (<75), or High.
No flights/zero seats gives no calculated row. See
[traffic calendar](features/traffic-calendar.md) for the full rule.

The first triggering user owns a new calculated row. Later recalculations keep
that owner. Manual rows (sources other than exact Calculated from flights or
Sample data) always win. Explicit flight save/delete services recalculate old/new
pairs atomically with the flight mutation, without signals. Airport locks
coordinate flight changes, recalculations and manual saves. Empty pairs delete
only calculated rows. A failed calculation rolls back the flight change.

Forecast reads add is_calculated and live flight_count, seats_total, seats_booked.
Two grouped aggregate queries cover a list of any size; the query-count guard
expects three forecast-data queries with authentication already resolved. Calculated
rows return can_edit=false and created_by_username=null to Staff/Heads. Travelers
continue to omit creator information. Calculated detail writes return 403 for
Staff and Heads; attempts to create the reserved source return field-level 400.

## Real dashboard and limited Head list

GET /api/dashboard/summary/?airport=<id> admits Staff/Heads only. Its optional
airport parameter selects one airport; default selection prefers the first code
with a forecast in today..today+29, otherwise the first code. It returns airport,
period_start, period_end, counts (low/medium/high), dates (date/weekday arrays by
level), busiest_weekday or null, and next_7_days (date/weekday/crowd_level or null).
Tied busiest weekdays use the earliest first high date. No user details appear.
The approved [dashboard contract](features/staff-dashboard.md) covers empty data.

GET /api/accounts/staff/ admits Heads only, returning staff and pending arrays.
Staff records have username/email only; pending records have email,
assigned_by_username and assigned_at only. No IDs, names, passwords or other
fields are returned. Existing POST /api/accounts/staff/assign/ and staff/revoke/
retain their rules and message-only responses. Revoking Staff sets Traveler;
revoking a pending assignment deletes only that assignment. Authentication,
profile and Head promotion/removal behavior remains unchanged.
