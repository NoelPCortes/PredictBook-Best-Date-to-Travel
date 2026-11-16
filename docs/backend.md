# Backend

## Current implementation

The Django project lives in `backend/config/`. Settings load the local environment
through python-dotenv and use PostgreSQL. Credentials remain local. Accounts,
flights, traffic, Django admin, DRF, and SimpleJWT token blacklisting are configured.
Django's `TIME_ZONE` remains `UTC` and `USE_TZ=True`.

Accounts retain their existing sign-up, username/email sign-in, rotating JWT
refresh, logout, self-profile, password, and Head management behavior. See
[accounts](features/accounts.md) for the existing contract. `/api/dashboard/`
continues to enforce Staff/Head access and identify its existing sample panels.

## Flight and crowd forecast API

`config/urls.py` includes `flights.urls` at `/api/flights/` and `traffic.urls` at
`/api/traffic/`. Requests use the existing JWT bearer authentication. Signed-out
requests return 401. Every signed-in role can read. Travelers receive 403 on
writes. Staff and Heads can create records. Staff can update/delete only their
own records; Heads can update/delete any record. Current database roles apply on
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
`mine=true`. Departure-date filtering uses the Philippine day from midnight to
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
400 messages. Staff/Head responses include `created_by_username` and a
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

`accounts/management/commands/seed_sample_data.py` requires the existing Staff
user named by `SEED_STAFF_USERNAME`; its error directs the owner to run
`python manage.py seed_staff` first. It uses `update_or_create` on unique keys
inside one transaction for five Philippine airports, three airlines, 70 flights
across 14 days, and 300 forecasts across 60 days, including the current Philippine
day. Flights and forecasts belong to that Staff user. Forecast levels follow a
fixed weekday pattern with `data_source="Sample data"` and null scores. Output
contains counts and a sample-data notice only. This is sample data, not verified
schedules or a measured forecasting model.

Run `python -m pytest` and `ruff check .` from `backend/`. Tests use Django's
separate PostgreSQL test database and cover Standard Features, ownership,
permissions, privacy, server-managed fields, documented validation, filters,
constraint races, and seed idempotence. They do not prove browser integration.

## Remaining work

Production datasets, crowd-level thresholds, score meaning, historical prediction
logic, accuracy evaluation, dedicated flight search contracts/results, date
suggestions, and chart APIs remain TBD. `suggestions` and the remaining dashboard
work are scaffolded. `backend/database/` remains reserved for datasets and SQL
scripts; management-command fixtures are generated by the command above.
