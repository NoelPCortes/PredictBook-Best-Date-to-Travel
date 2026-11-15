# Developer guide

Start here to understand what the app does today and where to change it. These docs describe the source as reviewed on November 16, 2026. **Implemented** means the frontend interaction exists; it does not imply that a backend service exists.

## Pages at a glance

Routes are registered in [App.tsx](../frontend/src/App.tsx).

| Route | Page and purpose | Current status |
|---|---|---|
| / | [Landing](pages/landing.md): introduce PredictBook to visitors | Implemented with a static calendar and inactive search |
| /signin | [Sign in](pages/sign-in.md): collect existing account credentials | Client validation only; no authentication or redirect |
| /signup | [Sign up](pages/sign-up.md): collect new account details | Client validation only; no account creation |
| /home | [Home](pages/home.md): preview the signed-in travel workspace | Sample data, selectable dates and route swapping; publicly accessible |
| /calendar | Dedicated Traffic Calendar page | Linked from Home; no route or page implementation |

Profile, flight results, date suggestions, Staff dashboard, and Head management pages are not implemented. Their routes have not been defined.

## Where to read next

| Guide | What you will learn |
|---|---|
| [Frontend](frontend.md) | Source locations, shared components, styles, and test commands |
| [Architecture](architecture.md) | How the current app works and what remains to connect |
| [Backend](backend.md) | Django scaffolding and planned responsibilities |
| [Database](database.md) | Existing schema specification; see the discrepancy below |
| [Accounts](features/accounts.md) | Form behavior, authentication status and planned access rules |
| [Flight search](features/flight-search.md) | Current search inputs and unfinished search actions |
| [Traffic calendar](features/traffic-calendar.md) | Differences between the three sample calendar displays |
| [Date suggestions](features/date-suggestions.md) | Static preview versus the planned recommendation feature |
| [Staff dashboard](features/staff-dashboard.md) | Planned summary charts and access |

Use the root [README](../README.md) for setup and [PRODUCT](../PRODUCT.md) for product requirements.

## Known documentation gaps

- The database specification still describes Traveler/Staff roles, Head/HR positions, and administrator-created Staff. PRODUCT and CODING_STANDARDS now describe Head-managed Staff access and Head promotion/removal rules. The schema needed to support those rules is unresolved; this documentation update does not redefine tables.
- Home displays sample booking counts, an upcoming booking and cabin information. The database specification explicitly has no user-to-flight booking relationship and excludes cabin class from flights. These UI samples do not establish a booking schema.
- README describes ESLint tooling; the current frontend lint script runs Oxlint. See [frontend commands](frontend.md#commands-and-tests).

When implementation changes, update its page guide and related feature guide together. Keep planned behavior clearly labeled.
