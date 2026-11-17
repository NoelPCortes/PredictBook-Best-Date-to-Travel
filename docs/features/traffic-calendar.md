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
They were not changed. Real recommendations now appear only on /calendar;
production datasets and accuracy evaluation remain TBD. The product's 75% accuracy
target has not been measured by this seat-utilization calculation.

## Calculation rule

For airport A and project-local date D, count flights with origin A and departure
local date D, plus flights with destination A and arrival local date D. A route's
origin and destination differ, so one flight contributes once to a given pair.
An overnight flight may contribute on different origin and destination dates.

- seats_total: sum of total_seats for the counted flights.
- seats_booked: sum of total_seats minus available_seats.
- flight occupancy: seats_booked / seats_total * 100.
- history occupancy: simple average of each existing positive-seat historical record
  at D minus 371, 364, and 357 days (matching weekdays around a year earlier).
- crowd_score: 0.5 * flight occupancy + 0.5 * history occupancy, rounded once
  to one decimal. Without history use flights only and explain that fallback.
- Low: score below 50. Medium: 50 to below 75. High: 75 or above.

Rounding uses decimal half-up before classifying the score. MEDIUM_THRESHOLD and
HIGH_THRESHOLD, FLIGHT_WEIGHT=0.5, HISTORY_WEIGHT=0.5,
HISTORY_DAY_OFFSETS=(371,364,357), RECOMMENDATION_WINDOW=7, and
MAX_RECOMMENDATIONS=3 are defined once in backend/traffic/calculation.py. No flights or
zero total seats gives no calculated forecast. Colors remain frontend styles;
no color or aggregate-count column is stored in PostgreSQL.

Calculated rows have exact source Calculated from 2026 flights and 2025 history and the current
calculation timestamp. Their required creator is the user triggering the first
calculation; management commands use the configured seed Staff user. Later
recalculations preserve that original calculated creator.

Legacy Calculated from flights rows are also calculated, read-only, and upgraded
on recalculation without changing their creator. Every source except these two
calculated labels and exact Sample data is manual.
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


## Explanations and recommendations

GET /api/traffic/explanation/?airport=<id>&date=YYYY-MM-DD returns live counted
flights, departing/arriving counts, total/booked seats and occupancy, matching
history records and dates, daily history average, weights/thresholds, the computed
score/level, departing open seats, and number-backed sentences. It shares the
stored calculation function. With no flights/zero seats, has_data=false and the
score/level are null. Manual forecasts stay unchanged: their stored level remains
on the calendar; the explanation is labeled as a separate calculated blend.

Only /calendar enables DateBreakdown (info-circleIcon) and RecommendedDates
(bulbIcon) through optional shared-calendar render slots. Home enables neither.
The breakdown shows backend sentences, flight/history/combined values and the
history dates used. Requests are keyed by airport/date, refreshed on selection
or month changes, and handle loading, errors, retries and obsolete responses.
Flights use the airport/date endpoint and its departing/arriving direction field.

GET /api/traffic/recommendations/?airport=<id>&date=YYYY-MM-DD implements the
[recommendation rule](date-suggestions.md). Cards select their date, refreshing
forecasts, flights, breakdown and recommendations. Neither endpoint returns user
details. Both require authentication (401); missing/invalid parameters return
400, unknown airports 404. Constant-query-count tests cover both endpoints.
Raw SQL changes require an explicit recalculate_forecasts run.
