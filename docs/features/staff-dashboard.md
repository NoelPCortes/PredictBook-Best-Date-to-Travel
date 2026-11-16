# Staff dashboard

[Documentation index](../README.md) · [Accounts and access](accounts.md)

## Purpose

Give Staff summary charts of upcoming crowd trends and busy travel days. The planned backend owner is dashboard. The product requires aggregate data rather than individual traveler details.

## Current implementation

Landing contains a Staff dashboard feature card with id="staff". Its For staff navigation link scrolls to that card. The link does not open a Staff page.

There is no dashboard route, chart implementation, dashboard API or access enforcement. Sign-in's text says Staff sign in there too, but the form currently performs only local validation. Home is a public sample screen, not a Staff dashboard.

## Planned data and permissions

The database specification expects charts to read crowd_forecasts and historical_records without a dashboard table. PRODUCT specifies that Heads retain Staff access; the separate Head management interface assigns and removes access according to the [account rules](accounts.md).

Chart definitions, endpoint contracts and routes remain TBD. The accounts/schema discrepancy documented in the [index](../README.md#known-documentation-gaps) must be resolved before role enforcement is implemented.
