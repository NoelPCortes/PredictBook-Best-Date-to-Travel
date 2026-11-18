# Date suggestions

[Documentation index](../README.md) ? [Traffic Calendar](traffic-calendar.md)

## Implemented rule

GET /api/traffic/recommendations/?airport=<id>&date=YYYY-MM-DD requires a signed-in
user of any role. It lives with the shared calculation in traffic/insights.py;
there is no recommendation table or new frontend feature folder.

For selected airport A and date S, consider S minus seven through S plus seven,
excluding S. A candidate must have a stored Low forecast and at least one flight
with positive available seats departing A on that UTC date. Arrivals do not
qualify. Optional destination=<airport id> restricts these departures to the
saved booking's To airport. A lower score than S is no longer required.

Use the stored numeric crowd_score. If a manual Low forecast has no score, use
its matching 2025 history average as a read-only score fallback. Exclude it if
neither score exists; never update the manual forecast. Rank by effective score
ascending, qualifying open seats descending, then earlier date. Return at most
three; fewer/none get a clear message without padding. Window and limit remain
named constants in traffic/calculation.py. Dates use settings.TIME_ZONE (UTC),
while flight times display in Asia/Manila. No past/future exclusion is added.

## Response and reasons

selected retains date, has_data, crowd_score and crowd_level. A missing selected
forecast/score leaves score_difference null. Each recommendation keeps date,
weekday, crowd_level, crowd_score, score_difference, open_seats, flight_count,
history_average_occupancy_percent and reasons. Difference may be zero or negative
because candidates no longer need a lower score than S. Counts and open seats
refer only to qualifying positive-seat departures, restricted to the route when
provided. flights adds up to two departures ordered by departure time then id,
with airline_name, airline_code, flight_number, origin_code, destination_code,
departure_time and available_seats. Top-level route is {origin_code,
destination_code} or null; message is empty only when three qualify.

Backend reasons use these number-backed templates:

- This day has a Low crowd level (score {S}).
- {N} flights from {F} to {T} depart on this date, with {S} open seats. (route)
- {N} flights depart from {F} on this date, with {S} open seats. (no route)
- In 2025, the same weekday around this date averaged {P}% seats booked.
  (only with history)

Every signed-in role may read, with no user details returned. Signed out is 401;
missing/invalid parameters or destination equal to airport is field-level 400;
unknown airport or destination is 404. Forecasts/history and flight aggregates
are read in bulk, plus one related-object-loaded departure query for all previews.
Query-count coverage guards six data queries without destination (seven with
its lookup), with authentication already resolved, rather than a query per date.

## Calendar presentation

Only /calendar shows Recommended best date to travel in its sticky side column,
after Airport, Airline and My booking. Narrow screens show pickers, the calendar
and panel, then recommendations. Up to three button cards use bulbIcon and a Low
text chip, date/score/open seats, actual flight previews with ClockIcon/SeatIcon,
and backend reasons. A positive score difference is shown when available; no
unsupported lower-crowd claim is made for an equal or higher-scoring Low day.
Clicking selects the date and refreshes requests. Loading, error/retry,
fewer/none and missing selected-date data states remain explicit.
Home shows neither recommendations nor Why this level; tests guard exclusions.

Landing's separate marketing preview remains unchanged. Production datasets,
prediction accuracy evaluation, and All Airports aggregation remain TBD.
