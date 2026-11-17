# Flight search and management

[Documentation index](../README.md) | [Home](../pages/home.md)

## Traveler Home route search

/home is Traveler-only. It starts with From and To searchable airport pickers and
Search flights. Airports must differ; no date, passengers or seat class is part
of a search. Results stay on Home and use origin, destination and upcoming=true:
only From-to-To departures at or after now, ordered by departure_time then id.
Pagination controls fetch one page at a time. Results show airline, flight number,
route, Philippine departure date/time with ClockIcon, and open seats with SeatIcon.
Empty results name the searched route. Loading, errors and Retry are separate.

recentRoutes.ts in features/homepage is the one route-storage module. It stores
only {origin,destination} pairs under predictbook:recent-routes:<user id>, retains
five distinct routes newest first, and exposes Clear. It stores no timestamps,
passenger data or booking details and never logs the list. Your upcoming booking
means the most recent saved route with at least one upcoming flight, its total
count and next three departure times. It is not a booking record. Empty state:
No upcoming booking yet. Search flights to get started.

Clicking a recent search or upcoming booking reruns that route and updates the
Home calendar to the From airport. GET /api/flights/route-dates/ supplies monthly
departure counts. Only route days receive crowd colors and a visible ring; other
days are neutral and say No flights on this route. Accessible route-day names
include date, route, flight count and crowd level. Show all crowd levels clears
the active route. Home shows neither recommendations nor Why this level.
Landing's separate inactive marketing search remains unchanged.

## Flight reads and route dates

Every signed-in role can GET /api/flights/. Responses use
{count,next,previous,results}, default/capped page size 50, page initially 1.
Filters combine: origin, destination, airline (lookup ids), airport, date,
search, upcoming=true, and mine=true. Search partially matches flight number,
airline name/code and origin/destination code, name or city, case-insensitively.
Default ordering remains departure_time then id.

Without airport, date keeps its existing Philippine departure-date behavior.
With airport, it counts that airport's UTC-local departures and arrivals, matching
forecast dates. Filtered rows include direction=departing or arriving relative
to the airport. Flight timestamp entry/display remains Asia/Manila; TIME_ZONE is
unchanged at UTC. These two date-filter modes are labeled in the UI.

GET /api/flights/route-dates/?origin=<id>&destination=<id>&month=YYYY-MM returns
{dates:[{date,flight_count,open_seats}]}. It groups From-to-To departures only by
project-local UTC departure date, with exclusive next-month bounds. It does not
filter to upcoming flights. Missing/invalid/equal route parameters return 400,
unknown airports 404, signed-out requests 401. A query-count test guards the
single airport existence query plus one aggregate query, with auth resolved.

Airport and airline lookups at /api/flights/airports/ and /api/flights/airlines/
are read-only and paginated. Airport rows add forecast_count from a grouped count.
No lookup write endpoint, price or passenger data is introduced.

## Staff Flights

/staff/flights has a search section above the table: text search, From, To,
Airline, Date, Search and Clear. Lookups use the shared searchable picker; the
text placeholder is Search flight number, airline, or airport. Search/filter
values are reflected in the URL and server query; page controls preserve them.
Existing airport/date View flights links retain a clearable filter notice.
The table still shows airline, number, route, departure/arrival, open/total seats,
creator and permitted actions.

/staff/flights/new and /staff/flights/:id/edit reuse existing forms, now with
searchable airport/airline controls. They submit the same ids and timestamps,
show linked backend field errors, focus the first invalid field, and show success
alerts. Delete retains confirmation with ghost Cancel and danger Delete.
Staff can change only their flights; Heads any flight; Travelers cannot write.
Signed-out reads/writes return 401. Traveler reads omit creator information.
The existing route/time/seat/unique validation and transactional recalculation
behavior remain unchanged. Client-created ownership is rejected with 400.

## Verification and remaining work

Backend tests cover filters, search, upcoming, ordering, pagination, route month
boundaries/timezones/direction, permissions and query counts. Frontend tests
cover Home searches/storage/highlights and Staff controls alongside form/CRUD
regressions. Tests use mocks/jsdom; browser/network rendering remains unverified.
Dedicated search results/details routes and production datasets remain TBD.
There is no booking persistence or new search table. See [setup](../../README.md)
for the existing invented small seed and large SQL dataset; neither is a real
schedule, and neither was rerun for this redesign.
