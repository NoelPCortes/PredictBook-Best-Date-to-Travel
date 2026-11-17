# Date suggestions

[Documentation index](../README.md) ? [Traffic Calendar](traffic-calendar.md)

## Implemented rule

GET /api/traffic/recommendations/?airport=<id>&date=YYYY-MM-DD requires a signed-in
user of any role. It lives with the shared calculation in traffic/insights.py;
there is no recommendation table or new frontend feature folder.

For selected airport A and date S, consider S minus seven through S plus seven,
excluding S. A candidate needs a stored forecast with a numeric crowd_score and
positive available seats on flights departing from A on that local date. Arriving
seats do not qualify a date. When S has a numeric stored score, the candidate
score must be strictly lower. Manual forecasts are preserved and their supplied
scores are used; manual candidates without a numeric score are excluded. If S
has no forecast or has a manual forecast without a score, no score comparison is
possible and score_difference is null.

Rank by crowd_score ascending, departing open seats descending, then earlier date.
Return at most three dates. Fewer/none receive an explicit message; never invent
or pad dates. The window and limit are named constants in traffic/calculation.py.
Dates use settings.TIME_ZONE (currently UTC); no past/future exclusion is added.

## Response and reasons

selected contains date, has_data, crowd_score and crowd_level. Each recommendation
contains date, weekday, crowd_level, crowd_score, score_difference, open_seats,
flight_count, history_average_occupancy_percent and reasons. message is empty when
three qualify, otherwise explains how few are available. No user details appear.
Missing/invalid parameters return 400, unknown airports 404, signed-out requests
401. Existing JWT handling applies. Forecasts and history are fetched in bulk,
with two grouped flight aggregates; a test guards five data queries regardless
of the number of candidates (authentication already resolved).

Backend reasons use only real numbers: score difference when comparable, history
average and optional selected-date history comparison, open departing seats,
and counted flights with their occupancy. No unsupported comparison is emitted.

## Calendar presentation

Only /calendar shows Recommended best date to travel below the selected-date
panel, using bulbIcon and the shared text crowd chip. Up to three clickable cards
show dates, scores, available seats and backend reasons. Selecting a card selects
its date and reloads the associated data. Loading, errors/retry, fewer results,
and no selected-date forecast are explicit. Home has neither this section nor
Why this level; a Home rendering test guards both exclusions.

Landing's separate marketing preview remains unchanged. Production datasets,
prediction accuracy evaluation, and All Airports aggregation remain TBD.
