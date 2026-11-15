# Landing page

[Documentation index](../README.md) · [Flight search](../features/flight-search.md)

| Item | Location |
|---|---|
| Route | / |
| Source | [LandingPage.tsx](../../frontend/src/pages/LandingPage.tsx) |
| Calendar | [TrafficCalendar.tsx](../../frontend/src/components/TrafficCalendar.tsx) |
| Styling | [index.css](../../frontend/src/index.css) |
| Tests | [LandingPage.test.tsx](../../frontend/tests/LandingPage.test.tsx) |

## Purpose

Introduce PredictBook to visitors before sign-in. The page explains flight search, airport crowd levels, date suggestions and Staff summary charts. Its main heading is “Fly on the calm days.”

## What visitors can do

- Features, How it works and For staff scroll to sections on this page. For staff targets the feature card, not a Staff dashboard route.
- Sign in navigates to /signin.
- The brand links to /.
- From, To and Date accept text. Date is currently a text field, not a date picker.
- Search flights is an inactive button. Submitting the form prevents a page reload and sends no request.

The page has four feature cards, a three-step explanation and a project footer. Hero columns, fields and cards rearrange on narrow screens.

## Calendar preview

TrafficCalendar renders a fixed 30-day example with three leading blank cells, so day 1 appears under Wednesday. There is no month label or real month calculation. Suggested days 14, 16 and 21 are predetermined and outlined.

Days are static elements, not selectable buttons. A Sample data chip, level legend, accessible crowd text and “Suggested date” labels explain the example. This preview is independent of Home's January 2026 calendar.

## Data and unfinished work

Feature text and step text are constants in LandingPage.tsx; sample crowd levels and suggested days are constants in TrafficCalendar.tsx. No API, authentication, flight results or recommendation logic runs here.

Tests cover the heading, four feature cards, 30 days and the /signin link.
