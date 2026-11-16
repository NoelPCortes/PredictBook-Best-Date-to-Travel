# Flight search

[Documentation index](../README.md) · [Landing](../pages/landing.md) · [Home](../pages/home.md)

## Purpose

Allow a traveler to search by origin, destination and date, then inspect airline, flight times and available-seat counts. Ticket prices are outside the product scope. The backend owner is flights.

## What exists today

| Location | Inputs and behavior |
|---|---|
| Landing / | From, To and Date text fields; Search flights is inactive |
| Home /home | From, To and Date text fields; a swap button exchanges From/To values; Search flights is inactive |

Both forms prevent a page reload and make no API request. Date inputs are plain text, not date pickers. Search buttons do not navigate or validate a route. Home's calendar selection does not populate the search Date field.

Home's recent searches are fixed constants, not actual history. Clicking them or View all does nothing. There are no passenger or seat-class search controls.

## Files and unfinished work

- Page markup/state: frontend/src/pages/LandingPage.tsx and HomePage.tsx.
- Search styling: global src/index.css, with Home-specific layout in HomePage.css.
- Home fixtures: src/data/homeSample.ts.
- Implemented data models: [airports, airlines and flights](../database.md).

Dedicated search results/details pages, search contracts, production datasets, and their loading/error handling remain TBD. Flight-management validation and calendar reads are implemented below. No results route has been defined. Home tests currently cover field presence and route swapping; they do not test a real flight search.


## Flight management and calendar reads

Staff and Heads use `/staff/flights`, `/staff/flights/new`, and
`/staff/flights/:id/edit` from `features/flights/`. The list shows airline,
number, route, departure/arrival, open/total seats, and creator. Add is available
to Staff/Heads; Edit/Delete follow the server's can_edit flag. Forms use lookup
selects and date/time inputs, backend field errors, first-invalid focus, and
success alerts. Delete requires confirmation with Cancel and danger Delete.

Authenticated reads use `GET /api/flights/`, optionally filtered by
`origin=<airport id>`, `date=YYYY-MM-DD`, and `mine=true`. Creation uses POST on
the same path. Detail GET, PATCH, and DELETE use `/api/flights/<id>/`. Airports
and airlines are read-only at `/api/flights/airports/` and
`/api/flights/airlines/`. Responses include airline and airport names/codes.

The server links records to their creator. Staff can update/delete only their
own flights; Heads can change any flight. Travelers receive 403 on writes and
signed-out callers receive 401. Traveler reads omit creator information. No
other user's email is returned. Clients supplying created_by receive a field
error. The documented route/time/seat/uniqueness constraints produce field-level
400 errors, including partial updates and documented constraint races.

Home and `/calendar` show flights departing the chosen airport on the selected
date through the same shared AirportCalendar. Dates and flight times use
Philippine time, explicitly labeled; Django remains UTC. These calendar reads do
not activate the existing sample flight-search forms or introduce a new search
results route.

The idempotent seed_sample_data command generates sample airports, airlines, and
five flights per day for 14 Philippine days. These are not verified schedules.
See [setup](../../README.md) and [backend](../backend.md) for details.
