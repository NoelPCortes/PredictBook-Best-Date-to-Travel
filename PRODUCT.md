# PredictBook: Product Overview

This document describes what PredictBook is meant to do and what it will not do. For setup and run instructions, see [README.md](README.md).

PredictBook is a web application that helps travelers find the best dates to fly. Crowd levels and date suggestions are calculated by the backend from historical flight and booking records. They are not produced by an AI model.

## Problem

Travelers often have a hard time choosing flight dates because of crowded airports, unpredictable crowd levels, and changing seat availability. Most booking sites show flight schedules and open seats, but not one simple view that combines flight searches with expected airport crowd levels and date suggestions. Staff also need an easy way to see upcoming crowd patterns.

## Users

- **Travelers** search for flights, check expected airport crowd levels, and look at recommended low-crowd dates.
- **Staff** log in to a dashboard with summary charts of busy travel days.

## Features

- **User accounts:** sign-up, login, profile updates, and logout, with separate access for Travelers and Staff.
- **Flight search and details:** search by starting location, destination, and date. View the airline, departure and arrival times, destination, and open seats.
- **Traffic calendar:** a color-coded calendar of expected airport crowd levels (Low, Medium, High) for different airports and dates.
- **Prediction tool:** estimates crowd levels from historical flight and booking records, using backend logic.
- **Smart date suggestions:** checks crowd levels and open seats to recommend the best dates to fly, and explains why.
- **Staff dashboard:** summary charts of upcoming crowd trends and busy travel days.

## Out of Scope

- Processing ticket payments, credit card fees, or sending official airline tickets
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