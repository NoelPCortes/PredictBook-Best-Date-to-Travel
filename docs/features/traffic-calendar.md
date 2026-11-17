# Traffic calendar and forecast calculation

[Documentation index](../README.md) ? [Database](../database.md)

## Live calendars

HomeCalendar and the Traveler-only `/calendar` route reuse AirportCalendar. One
airport is chosen from the authenticated airport lookup; All Airports aggregation
remains TBD. Month navigation uses the existing PNG chevrons, real month lengths,
and real weekdays. Every day exposes its date and level in its accessible name.
Selection uses aria-pressed, today uses aria-current=date, and the legend and
selected-date chip keep levels available as text. Missing forecasts show No data.
Loading and request failures are distinct from missing data, with retry controls
and stale-response protection.

Forecast dates and the calendar's initial today use the project timezone,
currently UTC. Flight entry and time display remain Philippine time; the panel
labels that distinction. It reads arrivals and departures through
`GET /api/flights/?airport=<id>&date=YYYY-MM-DD`, so the displayed flight set
matches the forecast's live references. The earlier origin/date filter retains
its Philippine departure-date behavior. Flight details include airline, flight
number, route, departure/arrival times with ClockIcon, and open seats with SeatIcon.
No flights listed for this date is shown only for a successful empty response.
There is no Your bookings row. Home's other two cards show only their empty states.

Landing and sign-in/sign-up marketing previews retain their separate samples.
They were not changed. Smart date suggestions, production datasets, historical
prediction logic, and accuracy evaluation remain TBD. The product's 75% accuracy
target has not been measured by this seat-utilization calculation.

## Calculation rule

For airport A and project-local date D, count flights with origin A and departure
local date D, plus flights with destination A and arrival local date D. A route's
origin and destination differ, so one flight contributes once to a given pair.
An overnight flight may contribute on different origin and destination dates.

- seats_total: sum of total_seats for the counted flights.
- seats_booked: sum of total_seats minus available_seats.
- crowd_score: seats_booked / seats_total * 100, rounded to one decimal.
- Low: score below 50. Medium: 50 to below 75. High: 75 or above.

Rounding uses decimal half-up before classifying the score. MEDIUM_THRESHOLD and
HIGH_THRESHOLD are defined once in backend/traffic/calculation.py. No flights or
zero total seats gives no calculated forecast. Colors remain frontend styles;
no color or aggregate-count column is stored in PostgreSQL.

Calculated rows have exact source Calculated from flights and the current
calculation timestamp. Their required creator is the user triggering the first
calculation; management commands use the configured seed Staff user. Later
recalculations preserve that original calculated creator.

Any source other than exact Calculated from flights and Sample data is manual.
Manual forecasts, including old blank/null sources, always take precedence and
are never overwritten or deleted by recalculation. Blank API source input is
normalized to Staff entry. Manual score/level inputs remain possible under their
existing validation; the automatic thresholds do not override them.

## Transactions, permissions and references

Existing flight create, PATCH and DELETE services explicitly recalculate the
affected pairs in the same database transaction. Updates include both old and new
origin/departure and destination/arrival pairs. Failure rolls back the flight
change. If no seats remain, only a calculated row is removed. No signals are used.
Airport locks serialize flight calculations and manual writes.

All signed-in roles can read forecasts. Staff/Heads can create manual forecasts;
Staff can edit/delete their own manual records and Heads any manual record.
Calculated PATCH and DELETE return 403 even for Heads. Client attempts to use the
reserved calculated source return a field-level 400. Every request still rejects
client-supplied created_by and calculated_at.

Forecast responses add is_calculated, flight_count, seats_total and seats_booked.
The numbers are live aggregates even for manual forecasts. Staff/Head responses
use created_by_username=null and can_edit=false for calculated rows; the UI shows
Calculated automatically. Traveler responses omit creator information. Two
aggregate flight queries serve the entire forecast list, rather than querying
per row; a regression test fixes the nonempty list at three forecast-data queries with authentication already resolved.

`GET /api/traffic/forecasts/` supports airport, month=YYYY-MM, and mine=true.
POST creates manual entries. Detail GET/PATCH/DELETE remains at
`/api/traffic/forecasts/<id>/`. One airport/date row is still enforced, and expected
constraint failures return field-level 400 messages.

The Staff forecast table shows Airport, Date, Crowd level, Seats booked, Flights,
Source and Actions. Seats booked uses live numbers and their percentage; with
zero total seats it says no seat data. View flights links to
`/staff/flights?airport=<id>&date=<date>`, where the filter can be cleared.
Calculated rows have no Edit/Delete actions, including direct edit navigation.

## Commands and cleanup

`python manage.py recalculate_forecasts` recalculates all flight-backed pairs and
removes stale calculated rows. `--remove-sample-data` additionally deletes only
forecasts whose source is exactly Sample data. Manual rows, accounts, airports,
airlines, and flights are not cleanup targets. The command requires the existing
Staff user named by SEED_STAFF_USERNAME and prints only counts.

`python manage.py seed_sample_data` remains a DEBUG-only invented ten-flight seed
using the configured flight numbers. It now calls the same recalculation service
inside its transaction and removes the old exact Sample data forecast fixtures.
It no longer invents weekday-based forecast levels. Invented flight schedules do
not become real timetables because they feed this calculation.

Backend tests cover threshold boundaries, combined arrivals/departures, timezone
dates, zero seats, manual protection, original creator retention, idempotence,
old/new pairs, deletion, rollback, exact-source cleanup, read-only permissions,
and query count. Frontend tests use mocked API data; live browser layout and the
complete browser-to-database walkthrough remain unverified.
