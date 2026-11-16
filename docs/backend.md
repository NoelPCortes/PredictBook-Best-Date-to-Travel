# Backend

## Current implementation

The Django project lives in [backend/config](../backend/config/). settings.py reads SECRET_KEY and PostgreSQL connection values from backend/.env using python-dotenv. The documented environment template is backend/.env.example; credentials must remain local.

The current URL configuration exposes Django admin at /admin/ only. INSTALLED_APPS contains Django's built-in apps; the five project apps are scaffolded but are not registered there. Their models.py, views.py and tests.py files are placeholders. No business API endpoints or custom account model are implemented.

Database connectivity and migration state are not established by this documentation review. See the root [setup guide](../README.md).

## Planned app responsibilities

| App | Intended responsibility | Feature guide |
|---|---|---|
| accounts | Accounts, authentication, profiles and role management | [Accounts](features/accounts.md) |
| flights | Airports, airlines, flight records and search | [Flight search](features/flight-search.md) |
| traffic | Historical records, forecast calculations and crowd levels | [Traffic calendar](features/traffic-calendar.md) |
| suggestions | Alternative travel dates and explanations | [Date suggestions](features/date-suggestions.md) |
| dashboard | Staff aggregate crowd/trend data | [Staff dashboard](features/staff-dashboard.md) |

backend/database/ is reserved for sample data and SQL scripts; backend/tests/ is reserved for backend tests.

## Before connecting a frontend page

Endpoint names, request/response contracts, the JWT library and role/schema reconciliation are TBD. The frontend TODO comments indicate intended integration points, not existing endpoints.

The [database specification](database.md) describes planned tables, not deployed models. Its account rules conflict with the newer PRODUCT requirements; see the [known gaps](README.md#known-documentation-gaps). Resolve that specification before implementing account migrations.
