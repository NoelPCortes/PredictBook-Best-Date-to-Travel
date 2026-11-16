# PredictBook: Product Overview

This document describes what PredictBook is meant to do and what it will not do. For setup and run instructions, see [README.md](README.md). For the database tables, see [docs/database.md](docs/database.md).

PredictBook is a web application that helps travelers find the best dates to fly. Crowd levels and date suggestions are calculated by the backend from historical flight and booking records. They are not produced by an AI model.

## Accounts implementation status

The backend provides sign-up, username/email sign-in, token refresh, logout,
self-only profile updates, password changes, and Head role management. JWT access
tokens last 15 minutes; refresh tokens last 7 days and rotate with blacklisting.
Head management returns result messages without profile details. The existing
frontend sign-in/sign-up forms are not connected to these endpoints yet; profile,
route guards, and Head management UI remain pending. See
[accounts API documentation](docs/features/accounts.md) for the contract.

## Problem

Travelers often have a hard time choosing flight dates because of crowded airports, unpredictable crowd levels, and changing seat availability. Most booking sites show flight schedules and open seats, but not one simple view that combines flight searches with expected airport crowd levels and date suggestions. Staff also need an easy way to see upcoming crowd patterns.

## Users

- **Travelers** search for flights, check expected airport crowd levels, and look at recommended low-crowd dates.
- **Staff** log in to a dashboard with summary charts of busy travel days. Staff access is assigned by a Head using an email address.
- **Heads** manage Staff access, promote Staff to Head, and remove access according to the role-management rules. Heads also retain Staff access.

## Features

- **User accounts and authentication:** sign-up, sign-in, profile updates, and logout, with separate access for Travelers, Staff, and Heads.
  - Sign-up and sign-in connect to the users table in the PostgreSQL database.
  - Passwords are hashed and never stored in plain text.
  - Sign-in is token-based. The frontend uses the token for later requests.
  - Users can sign in with their username or their email address.
  - Public sign-up does not allow users to select Staff or Head access. Staff access is assigned by a Head using an email address, whether an account already exists or not.
- **Home page:** after signing in, users see a Home page with flight search and a traffic calendar preview.
  - "Your bookings", "Your upcoming booking", and "Recent searches" on the Home page are sample data for now. The system does not store bookings (see Privacy), so they must be labeled as sample data until a decision is made.
- **Flight search and details:** search by starting location, destination, and date. View the airline, departure and arrival times, destination, and open seats. Ticket prices are not shown.
- **Traffic calendar:** a color-coded calendar of expected airport crowd levels (Low, Medium, High) for different airports and dates. The color of each date changes with the crowd level stored for that airport and date: Low is light green, Medium is amber, and High is dark orange. Each level is also available as text (in the legend, in the selected date's details, and in each date's accessible label), so color is never the only signal.
- **Prediction tool:** estimates crowd levels from historical flight and booking records, using backend logic.
- **Smart date suggestions:** checks crowd levels and open seats to recommend the best dates to fly, and explains why.
- **Staff dashboard and charts:** two separate pages. The Dashboard shows summary numbers and upcoming high-crowd days. The Charts page shows crowd trends and busy travel days.
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
  - Heads have a management interface to assign Staff by email, promote Staff to Head, and remove access according to these permissions.

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

The system cannot connect to live, private airline systems, so it relies on public or sample flight data. The exact datasets are still to be decided.