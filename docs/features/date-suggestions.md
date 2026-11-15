# Date suggestions

[Documentation index](../README.md) · [Landing](../pages/landing.md)

## Purpose

Recommend three alternative travel dates within the week before and after the chosen date, using lower crowd levels and available seats. Each recommendation should explain why it was chosen. The planned backend owner is suggestions.

## Current implementation

Landing explains Smart date suggestions in its feature cards and How it works section. Its TrafficCalendar component outlines days 14, 16 and 21 from a hardcoded Set and exposes “Suggested date” labels.

Those outlined dates are a marketing example. No route, algorithm, request, seat check or recommendation result page exists. Home's blue selected date represents the user's selection, not a suggested date.

## Planned data and unfinished work

The database specification expects suggestions to read forecasts and flights without a separate suggestions table. Recommendation ranking, tie handling, API contracts, presentation of real results and source datasets are TBD.

Landing tests assert the presence of three suggested labels. They do not validate recommendation quality or the planned date window.
