# Home page

[Documentation index](../README.md) · [Traffic calendar](../features/traffic-calendar.md) · [Flight search](../features/flight-search.md)

| Item | Location |
|---|---|
| Route | /home |
| Source | [HomePage.tsx](../../frontend/src/pages/HomePage.tsx) |
| Shared UI | [AppNavbar](../../frontend/src/components/AppNavbar.tsx), [HomeCalendar](../../frontend/src/components/HomeCalendar.tsx), [Icon](../../frontend/src/components/Icon.tsx), Brand |
| Data | [homeSample.ts](../../frontend/src/data/homeSample.ts) |
| Styling | [HomePage.css](../../frontend/src/pages/HomePage.css), AppNavbar.css and global index.css |
| Tests | [HomePage.test.tsx](../../frontend/tests/HomePage.test.tsx) |

## Purpose

Preview the signed-in travel workspace: search inputs, expected crowd levels by date, booking information and recent searches.

**Access is currently public.** There is no route guard or real signed-in user. The greeting “WELCOME BACK, LARCE” and navbar name come from sampleUser.

## Navbar and search

The brand and Home link target /home. Home is marked active through NavLink with aria-current="page". Traffic Calendar points to /calendar, which has no page yet. The user-chip button has an account-menu TODO and no behavior. There is no notification bell.

The search form contains From, a swap button, To and Date. From and To are controlled text inputs; swap exchanges their current values, including empty values. Date is a text input. These fields are independent of the calendar selection.

Search flights does nothing yet; the form prevents reload. There are no passenger or seat-class search fields, results or API calls.

## Calendar and booking information

HomeCalendar owns selectedDay in React state, initially 14. It displays January 2026 only, with 31 day buttons. JavaScript Date objects determine alignment: January 1 is Thursday, preceded by four blank cells.

Each button's accessible name includes the date and crowd level. Clicking, Enter or Space selects that day; aria-pressed identifies selection. Selected cells use blue fill with a white ring. Previous/next month buttons are disabled, and the month label has no action.

Selecting a date updates the polite live region on the right:

| Selected day | Heading / crowd | Flights | Estimated seats | Your bookings |
|---|---|---|---|---|
| January 14 | Wed, Jan 14, 2026 / Low crowd | 124 | ~ 82% | 1, with chevron |
| January 17 example | Sat, Jan 17, 2026 / Medium crowd | — | — | 0 |
| Every other day | Selected date and its fixture level | — | — | 0 |

The chevron is shown only for a positive booking count; it is not a booking-details button. A text legend and crowd chip supplement the cell colors.

## Upcoming booking and recent searches

- Upcoming booking: JFK → LAX; Wed, Jan 14, 2026; 1 adult; Economy; Low crowd.
- Recent searches: JFK → LAX, Jan 14–18, 2026; SFO → NRT, Feb 10–18, 2026.
- Upcoming/recent rows and View all are real buttons with TODO comments and no action.
- The upcoming booking remains fixed when another calendar date is selected.
- Typing a route does not append to recent searches.

## Data ownership and limits

homeSample.ts exports sampleUser, januaryLevels, derived januaryDays, sampleBookingInfo, upcomingBooking, recentSearches and formatHomeDate. Dates are built as local JavaScript dates and formatted explicitly with the en-US locale.

No fixture is fetched or persisted. Selection and input state reset when the page remounts. Sample booking data does not imply an implemented booking service or database table; see [known gaps](../README.md#known-documentation-gaps).

Hero columns, summary cards and calendar columns stack at smaller widths. Tests cover the greeting, calendar count/alignment/default selection, January 17 selection, sample values, input swapping, navbar and absence of notifications.
