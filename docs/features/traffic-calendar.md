# Traffic calendar

[Documentation index](../README.md) · [Landing](../pages/landing.md) · [Home](../pages/home.md)

## Purpose

Show estimated airport crowd levels by date so travelers can compare travel days. The product targets a 30–60 day forecast window. Forecasts will be calculated by backend logic in traffic from historical records; no AI model is involved.

## Existing calendar displays

| Display | Source | Data and interaction |
|---|---|---|
| Landing preview | components/TrafficCalendar.tsx | Static 30 days; day 1 under Wednesday; outlined sample suggestions on 14, 16 and 21 |
| Auth page previews | components/AuthLayout.tsx; constants in each auth page | Two static rows per page; no real-month navigation or selection |
| Home calendar | components/HomeCalendar.tsx; data/homeSample.ts | January 2026 with 31 selectable dates; real Date-based alignment, starting Thursday |
| Dedicated /calendar page | No implementation | Home navbar links here, but no route exists |

The name TrafficCalendar currently identifies the Landing preview component, not a routed Traffic Calendar page. The Home calendar does not fetch airport-specific forecasts.

## Levels, selection and accessibility

All displays use shared global Low/Medium/High color classes and calendar-grid/calendar-day styles. Text legends or accessible level descriptions convey meaning beyond color.

Home day buttons include the full date and crowd level in aria-label. aria-pressed marks the selected date. January 14 starts selected; choosing a day updates the booking information and crowd chip. A polite live region announces that panel. Only January 14 has sample booking/seat values; other dates use dashes and zero bookings. Month navigation remains disabled.

Sample color and level values are display fixtures. Landing's outlined suggestions are fixed values, not prediction results.

## Backend work still needed

The [database specification](../database.md) describes crowd_forecasts and historical_records, with one record per airport/date. The database stores the level, not its display color.

Datasets, Low/Medium/High thresholds, the meaning of crowd_score, API contracts, live forecast generation and accuracy evaluation remain TBD. The product's 75% accuracy target has not been measured by these sample screens.

Landing tests cover its 30-day preview. Home tests cover 31 dates, Thursday alignment, default selection, January 17 selection and booking-panel values.
