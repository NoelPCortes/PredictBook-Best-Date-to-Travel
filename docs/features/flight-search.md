# Flight search

[Documentation index](../README.md) · [Landing](../pages/landing.md) · [Home](../pages/home.md)

## Purpose

Allow a traveler to search by origin, destination and date, then inspect airline, flight times and available-seat counts. Ticket prices are outside the product scope. The planned backend owner is flights.

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
- Planned data models: [airports, airlines and flights](../database.md).

Results and details pages, search endpoint contracts, server validation, datasets and loading/error handling for real requests remain TBD. No results route has been defined. Home tests currently cover field presence and route swapping; they do not test a real flight search.
