# Staff dashboard

[Documentation index](../README.md) ? [Accounts and access](accounts.md)

## Period, airport and permissions

`/staff/dashboard` is protected by the existing RoleRoute for Staff and Heads.
The page retains the existing `/api/dashboard/` access probe, but ignores its
legacy sample marker and takes all displayed figures from
`GET /api/dashboard/summary/?airport=<id>`. The summary endpoint independently
requires authenticated Staff/Head access: 401 signed out and 403 for Travelers.
No user identity fields appear in its response.

The period is today through today + 29 days inclusive in settings.TIME_ZONE,
currently UTC. It covers one airport. With airport omitted, the server chooses
the first airport alphabetically by code with any forecast in the period, or the
first airport by code if none has forecasts. No airports yields airport=null and
empty counts/date lists. All Airports aggregation remains TBD.

## Summary response

- airport: id, code, name (or null).
- period_start and period_end: ISO dates.
- counts: low, medium, high day counts.
- dates: low, medium, high arrays of {date, weekday}, sorted by date.
- busiest_weekday: the weekday with most high days, or null. Ties choose the
  weekday whose first high-crowd date occurs earliest in the period.
- next_7_days: seven {date, weekday, crowd_level} rows from today; absent forecasts
  use crowd_level=null.

Both manual and calculated forecasts contribute their stored levels. The page
shows a clear no-data message when the selected airport has no forecast in the
period. Busiest weekday then shows No data; it is not invented from empty counts.

## Layout and interaction

The header has STAFF DASHBOARD, Crowd overview, an airport dropdown, Next 30 days,
and the returned date range. Four cards show High, Medium, Low day counts and
Busiest weekday. Three equal-height grid cards list every date under its level,
with a count and text/color date chips or a level-specific empty message. These
cards stack on narrow screens. A seven-day strip shows weekday, date and level
or No data. Your records is last and uses mine=true flight and forecast reads.
Every container has content; no placeholder chart link or fixed empty panel is
rendered. Shared spacing, colors, controls, focus and table styles follow the UI
guide. Summary and own-record errors have independent retry states.

January fixtures, their calculation helper, and the Home sample-data module have
been removed. There are no sample labels or fixed future dates on this page.
Heads retain Dashboard, Flights, Crowd forecasts and Head management navigation
on this and every other Staff page. Staff see the first three links only.

Chart definitions, chart API contracts and routes remain TBD. There is no Charts
page, no new dashboard table, and no individual traveler detail in these summaries.

## Verification

Backend tests cover counts, ordered dates, weekdays, tie behavior, period bounds,
airport selection, project timezone, permissions and response privacy. Frontend
API-mocked tests cover the real layout/data, airport changes, zero-data states,
loading, retries and own-record counts. A live visual/browser walkthrough remains
unverified; tests do not establish a pixel-perfect layout on each viewport.
