# Traffic calendar

[Documentation index](../README.md) · [Landing](../pages/landing.md) · [Home](../pages/home.md)

## Purpose

Show estimated airport crowd levels by date so travelers can compare travel days. The product targets a 30–60 day forecast window. Forecasts will be calculated by backend logic in traffic from historical records; no AI model is involved.

## Existing calendar displays

| Display | Source | Data and interaction |
|---|---|---|
| Landing preview | components/TrafficCalendar.tsx | Static 30 days; day 1 under Wednesday; outlined sample suggestions on 14, 16 and 21 |
| Auth page previews | components/AuthLayout.tsx; constants in each auth page | Two static rows per page; no real-month navigation or selection |
| Home calendar | components/HomeCalendar.tsx; components/AirportCalendar.tsx | API forecasts and selected-day flights for one chosen airport; real month navigation |
| Dedicated /calendar page | features/calendar/TrafficCalendarPage.tsx | Traveler-only route using the same AirportCalendar as Home |

The name TrafficCalendar currently identifies the Landing preview component, not a routed Traffic Calendar page. Home and the dedicated page fetch airport-specific forecasts and daily departing flights.

## Levels, selection and accessibility

All displays use shared global Low/Medium/High color classes and calendar-grid/calendar-day styles. Text legends or accessible level descriptions convey meaning beyond color.

The shared live calendar starts at today's Philippine date and the first available
airport. Day buttons include the full date and crowd level in aria-label;
aria-pressed marks selection and aria-current=date marks today. Selecting a day
updates a polite live panel with a dot-and-text crowd chip and departing flights.
Missing forecasts show No data. The legend includes Low, Medium, High, and No
data. Enabled PNG chevron buttons navigate real months, including year changes.
Airport changes preserve the selected date. Request errors remain distinct from
missing data, and obsolete responses do not overwrite a changed selection.

Landing and auth sample color and level values remain display fixtures. Landing's outlined suggestions are fixed values, not prediction results.

## Backend work still needed

The [database specification](../database.md) describes crowd_forecasts and historical_records, with one record per airport/date. The database stores the level, not its display color.

Production datasets, Low/Medium/High thresholds, the meaning of crowd_score, live forecast generation and accuracy evaluation remain TBD. The management/read API contracts are implemented below. The product's 75% accuracy target has not been measured by these sample screens.

Landing tests retain its 30-day preview coverage. Home and TrafficCalendarPage tests cover API levels, real weekdays, No data, selected flights, airport/month changes, Philippine date boundaries, errors, obsolete responses, and role guards. They use mocked APIs and do not prove live browser integration.


## Forecast management and API

Staff/Heads use `/staff/forecasts`, `/staff/forecasts/new`, and
`/staff/forecasts/:id/edit` in features/calendar/. Lists show airport, date,
crowd-level chip, optional score, and author. Forms collect airport, date, level,
optional score, and optional source. Backend errors are associated with fields
and focus the first invalid control. Creates, updates, and deletes show success
alerts. Delete requires ghost Cancel and danger Delete confirmation.

`GET /api/traffic/forecasts/` accepts airport=<airport id>, month=YYYY-MM, and
mine=true filters. POST creates. Detail GET, PATCH, and DELETE use
`/api/traffic/forecasts/<id>/`. Signed-in users can read; signed-out callers get
401. Travelers cannot write (403). Staff can create and change only their own
records; Heads can change any record. The server supplies created_by and protects
that user relationship. Staff/Head responses include created_by_username and
can_edit; Traveler responses omit both. No other user's email is returned.

Clients cannot send created_by or calculated_at: either produces a field-level
400. The server sets calculated_at on create and update, stores Staff entry for
blank data sources, validates low/medium/high, and enforces one forecast per
airport/date with a date-level 400, including uniqueness races. No score range,
forecast-window restriction, or production thresholds were added.

The shared selected-date panel reads `/api/flights/?origin=<id>&date=YYYY-MM-DD`
and shows airline, flight number, route, departure/arrival with ClockIcon, and
open seats with SeatIcon. No flights listed for this date is distinct from a
failed flight request. Flight times and departure-date boundaries use Philippine
time (Asia/Manila, UTC+08:00); Django remains UTC. The calendar uses one airport
at a time. All Airports aggregation remains TBD.

## Sample forecast data

After seed_staff, run python manage.py seed_sample_data with an existing Staff
user named by SEED_STAFF_USERNAME. It updates unique keys idempotently and creates
one forecast for each of five airports over 60 days, including today in Philippine
time. The weekday pattern is Low Monday/Tuesday, Medium Wednesday/Thursday/Sunday,
and High Friday/Saturday. Scores stay null. Source is Sample data, also shown in
selected-date details. This fixture pattern is not a production prediction rule
or evidence of the product's accuracy target.
