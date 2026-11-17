# PredictBook: Product Overview

This document describes what PredictBook is meant to do and what it will not do. For setup and run instructions, see [README.md](README.md). For the database tables, see [docs/database.md](docs/database.md).

PredictBook is a web application that helps travelers find the best dates to fly. Crowd levels blend 2026 flights with 2025 history, with manual forecasts still possible. The Traffic Calendar explains the calculated levels and recommends qualifying alternative dates. They are not produced by an AI model.

## Accounts implementation status

The backend provides sign-up, username/email sign-in, token refresh, logout,
self-only profile updates, password changes, and Head role management. JWT access
tokens last 15 minutes; refresh tokens last 7 days and rotate with blacklisting.
Head management actions return result messages. The Head-only list exposes Staff
id/username/email in the list and the approved Staff detail fields, plus limited pending-assignment fields. Existing account forms,
profile, guards, and role dashboards are connected; Head lists, Assign, and Remove
are implemented. See
[accounts API documentation](docs/features/accounts.md) for the contract.

## Problem

Travelers often have a hard time choosing flight dates because of crowded airports, unpredictable crowd levels, and changing seat availability. Most booking sites show flight schedules and open seats, but not one simple view that combines flight searches with expected airport crowd levels and date suggestions. Staff also need an easy way to see upcoming crowd patterns.

## Users

- **Travelers** search for flights, check expected airport crowd levels, and look at recommended low-crowd dates.
- **Staff** log in to a dashboard with summary charts of busy travel days. Staff access is assigned by a Head using an email address.
- **Heads** manage Staff access, promote Staff to Head, and remove access according to the role-management rules. Heads also retain Staff access.

## Features

- **Flight and crowd forecast management:** Staff and Heads create and manage flights and airport/date forecasts. Staff can change their own flights and manual forecasts; Heads can change any flight or manual forecast. Calculated forecasts are read-only and preserve their first calculator. Travelers view the stored crowd levels and daily flights through the read-only Traffic Calendar and Home preview.
- **User accounts and authentication:** sign-up, sign-in, profile updates, and logout, with separate access for Travelers, Staff, and Heads.
  - Sign-up and sign-in connect to the users table in the PostgreSQL database.
  - Passwords are hashed and never stored in plain text.
  - Sign-in is token-based. The frontend uses the token for later requests.
  - Users can sign in with their username or their email address.
  - Public sign-up does not allow users to select Staff or Head access. Staff access is assigned by a Head using an email address, whether an account already exists or not.
- **Home route search:** Travelers search From and To airports only, with different airports required. Upcoming From-to-To flights are ordered by departure and paginated. The last five distinct routes are stored in this browser per signed-in user, newest first, with Clear. Your upcoming booking means the most recent saved route with upcoming flights, showing its count and next three departure times; it is not a booking record. Route dates highlight the From airport calendar; Show all crowd levels restores normal colors. No dates, passenger data, bookings table, recommendations, or breakdown are added to Home.
- **Searchable pickers:** every airport/airline picker uses the shared searchable combobox/listbox with code/name matching, city/country airport matching, keyboard and touch support, visible labels, error states, and existing icons.
- **Flight search and details:** search by starting location, destination, and date. View the airline, departure and arrival times, destination, and open seats. Ticket prices are not shown.
- **Traffic calendar:** a color-coded calendar of expected airport crowd levels (Low, Medium, High) for different airports and dates. The color of each date changes with the crowd level stored for that airport and date: Low is light green, Medium is amber, and High is dark orange. Each level is also available as text (in the legend, in the selected date's details, and in each date's accessible label), so color is never the only signal.
- **Forecast calculation:** blend the booked-seat percentage of counted 2026 departures/arrivals equally with the average daily percentage from available 2025 records at 371, 364, and 357 days earlier. Without history, use flights only. Round once to one decimal: below 50 is Low, 50 to below 75 is Medium, and 75 or above is High. Flight changes recalculate affected pairs transactionally; raw SQL requires explicit recalculation. No flights or zero seats gives no calculated row. Manual forecasts remain possible and take precedence.
- **Smart date suggestions:** on Traffic Calendar only, explain the calculated level using actual flight/history numbers and recommend up to three other dates within seven days before or after the selection. Dates need a forecast and open departing seats, and a lower stored score when the selection has a numeric score. Rank by score, open seats, then date; never pad missing results. Home shows neither explanations nor recommendations.
- **Staff pages:** Crowd overview adds a selectable 30-day column chart with score heights, level colors, 50/75 reference lines, and live flight/seat details, retaining all existing summary cards, date lists, seven-day strip, comparison and own-record counts. Missing manual scores use matching 2025 history for the chart without changing stored forecasts. Flights has server-side search and pagination. Crowd forecasts starts with airport counts, with per-airport filters or global search. A separate Charts page remains TBD.
- **Role management:**
  - Django administrators create the initial Heads.
  - A Head can assign Staff access by entering an email address, whether the account already exists or not.
  - A Head can promote Staff members to Head.
  - A Head can remove Staff access, returning the user to Traveler.
  - A Head can remove Head access only from Heads they promoted, or from themselves.
  - A Head cannot remove the Head who promoted them.
  - A Head created by a Django administrator can only have Head access removed by the administrator or themselves.
  - When removing Head access (including their own), the authorized acting Head chooses whether the user returns to Staff or is fully revoked to Traveler. The removed user's promoted_by link is cleared.
  - Fully revoking Staff access returns the user to Traveler.
  - Removing a Head does not affect the Heads they previously promoted.
  - Role removal does not delete the user's account.
- **Head management:** a searchable Staff side list and pending assignments sit beside Assign Staff and the selected Staff details. Heads may read only id, username, email, first_name, last_name, date_joined, flights_created, and forecasts_created for Staff; no Traveler or Head details are exposed. Remove retains confirmation and changes Staff to Traveler without deleting the account. An unchanged assignment is an info alert. Existing Head navigation and promote/remove-Head backend rules remain; those additional management screens remain future work.

## Privacy

- Traveler personal information is kept private.
- The system does not store passenger names, booking reference numbers, or payment details.
- The Staff dashboard shows summary charts only, never individual traveler details.

## Out of Scope

- Processing ticket payments, credit card fees, or sending official airline tickets
- Storing passenger names, booking reference numbers, or ticket prices
- Direct connections to private, real-time airline reservation networks
- Live radar or GPS tracking of aircraft or passengers
- Mobile apps for iPhone or Android
- Guarantees that crowd predictions will match the exact head count at the airport

## Success Criteria (from the Project Charter)

- Account and search features work properly, and searches load in under 2 seconds.
- The traffic calendar shows estimated crowd levels for the next 30 to 60 days, with predictions that are correct at least 75% of the time.
- The recommendation tool checks a week before and after the chosen date and suggests 3 alternative dates with fewer crowds and available seats.
- Staff accounts can log in securely and view summary charts of busy travel days.

## Data Source

The system cannot connect to live, private airline systems, so it relies on public or sample flight data. Local development has invented 2026 flights and 2025 history from backend/database/sample_flights.sql. These are not real schedules. Production datasets remain TBD.