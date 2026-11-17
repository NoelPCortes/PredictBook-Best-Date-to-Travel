# Frontend

## Entry point and routing

[main.tsx](../frontend/src/main.tsx) imports the global stylesheet and mounts App inside React StrictMode. [App.tsx](../frontend/src/App.tsx) uses BrowserRouter and declares `/`, `/signin`, `/signup`, `/home`, `/staff/dashboard`, `/head`, and `/profile`.

The routes use session and role guards. Traveler lands at `/home`, Staff at `/staff/dashboard`, and Head at `/head`. Heads can also visit the Staff dashboard. `/profile` is available to every authenticated role. Signed-out protected requests go to Sign-In; wrong-role navigation goes to the user's own landing page. Signed-in visitors to `/signin` or `/signup` go to their role landing page. `/` remains public. There is still no fallback route. Production hosting must serve the frontend entry HTML for client routes such as /home.

See the [page index](README.md#pages-at-a-glance) for behavior and status.

## Source map

Paths below are relative to frontend/.

| Location | Responsibility |
|---|---|
| src/pages/ | Existing LandingPage; no new page files added |
| src/features/signin/ | Reused SignInPage and its API calls |
| src/features/signup/ | Reused SignUpPage and its API calls |
| src/features/homepage/ | Reused HomePage, its CSS, profile restoration and shared logout export |
| src/features/staff-dashboard/ | StaffDashboard, protected access/summary API, live date lists and CSS |
| src/features/head/ | HeadPage, protected access and email assignment API, CSS |
| src/features/flights/ | Staff flight list, create/edit forms, and management API |
| src/features/calendar/ | Staff forecast list/forms and Traveler TrafficCalendarPage |
| src/features/profile/ | ProfilePage, ProfileInformation, PasswordSecurity, own-profile API and CSS |
| src/components/ | Shared layouts, fields, navigation, calendars and icons |
| src/index.css | Global fonts, CSS variables, shared buttons, search fields and calendar styles |
| src/components/AuthLayout.css | Styles shared by sign-in and sign-up; class names still use the signin- prefix |
| src/components/AppNavbar.css | Signed-in navbar and existing shared icon sizing |
| src/features/homepage/HomePage.css | Home layout, interactive calendar, chips and summary rows |
| src/api/client.ts | Environment-based API client, bearer authorization, one refresh attempt and one retry |
| src/api/authStorage.ts | Only module that reads/writes/clears access and refresh tokens in localStorage |
| src/api/authState.ts | Safe in-memory profile state and session clearing |
| src/api/lookups.ts | Authenticated airport and airline lookups |
| src/api/traffic.ts | Shared flight/forecast reads with origin/date/airport/month/mine filters |
| src/types/flights.ts; src/types/traffic.ts | Shared flight, lookup, forecast, and crowd-level contracts |
| src/api/session.ts | Shared logout request using the current refresh token |
| src/components/useSignOut.ts | Shared logout/local clearing/navigation behavior |
| src/components/RoleRoute.tsx | Role navigation guard, including Staff access for Heads |
| src/types/auth.ts | Shared safe profile/token types and ROLE_LANDING_PATHS |
| src/references/ | Design references; these screenshots are not rendered as pages |
| tests/ | Vitest page tests |
| index.html | Title, root element and Google Fonts links |

The three account-related UIs were moved from existing `src/pages` files into the authorized feature folders without rebuilding them. Landing remains in its existing location. Whether `src/pages` is used alongside features remains TBD; no new files were created there.

## Reuse before adding a component

| Component | Used by | Contract and behavior |
|---|---|---|
| Brand | AuthLayout, AppNavbar, ProfilePage | Existing CSS calendar mark and PredictBook link; role areas link to their landing page |
| AuthLayout | SignInPage, SignUpPage | Accepts pageId, title, intro, panelTitle, panelIntro, typed sample days and children; owns the split layout and static calendar |
| AuthField | SignInPage, SignUpPage, HeadPage, profile forms | Label, input and optional error; accepts input attributes/ref; links errors with aria-describedby and sets aria-invalid |
| AppNavbar | HomePage, StaffDashboard, HeadPage | Role-specific existing links, real username linked to /profile, and shared Sign out action |
| Icon | Unused legacy helper | Retained legacy inline-SVG helper; changed Home and role pages do not render it |
| TrafficCalendar | LandingPage | Static 30-day marketing preview; not the /calendar page |
| HomeCalendar | HomePage | Wraps the shared real-data AirportCalendar; no booking fixture or named sample chip export |

Landing currently writes its logo markup inline, using the same global logo styles; it does not import Brand. CrowdChip is a shared dot/text component with its own stylesheet.

## Styles and accessibility

Reuse variables from src/index.css: --bg, --ink, --muted, --border, --accent, --low, --medium, --high and --white. Shared .calendar-grid, .calendar-day and level classes underpin the calendar displays.

Inter and Space Grotesk are loaded through Google Fonts in index.html, with sans-serif fallbacks. Auth pages share one CSS file; changes there affect both pages. Home styles are scoped to its own classes.

Pages use labels, visible focus styles and one H1. Auth errors are text alerts associated with inputs. Calendar day buttons expose date/crowd level and aria-pressed; selected-date information uses a polite live region. Calendars include text or accessible crowd descriptions.

## Commands and tests

Run from frontend/:

~~~sh
npm run dev
npm run lint
npm test
npm run build
~~~

The actual scripts run Vite, Oxlint, Vitest, and TypeScript followed by Vite respectively. Build enables strict TypeScript checking. Tests cover frontend behavior with API mocks, not live data or browser integration. Sign-Up preserves required/email/password-match checks and displays backend validator messages with linked field errors; Sign-In stores tokens through the shared module and uses a generic credential error. Profile restoration supplies the backend role after reload. RoleRoute guards the role areas, and SessionRoute protects the shared profile page. Failed refresh clears the session and redirects to Sign-In. Logout clears tokens even when its request fails.

| Test file | Main coverage |
|---|---|
| LandingPage.test.tsx | Heading, four feature cards, 30-day preview, sign-in link |
| authFlow.test.tsx | Sign-up success/validation, role redirects/guards, Head payloads, profile persistence/payloads, password payloads, logout and one-attempt refresh |
| SignInPage.test.tsx | Fields, links, required errors, first-invalid focus and valid resubmission |
| SignUpPage.test.tsx | Fields, links, required/email/matching errors, error clearing and no extra password rule |
| HomePage.test.tsx | Greeting, real calendar, empty booking/search states, no sample controls and navbar |
| StaffDashboard.test.tsx | API counts/date lists, selected airport, period, empty data, loading/errors and own-record counts |
| HeadPage.test.tsx | Email assignment, backend success/errors, pending requests and authorization |
| ProfilePage.test.tsx | Editable fields, read-only role, linked errors, password confirmation, successes and sidebar focus |

Landing tests render static HTML. The other suites use jsdom with React act and createRoot to exercise DOM events. None of these tests proves a pixel-perfect match to the reference screenshots.

## Authentication configuration

`VITE_API_URL` is read from the frontend environment, with the example value in
`frontend/.env.example`. Feature API modules own endpoint calls; components invoke
those functions. No Staff credentials belong in the frontend environment.
The shared client uses `/api/accounts/token/refresh/` only on protected 401s and
shares a pending refresh to avoid concurrent rotation attempts. Rotated tokens
replace the previous pair in localStorage; public Sign-In errors never refresh.
Only safe profile fields are held in memory, and the backend enforces ownership
and role access. Django CORS origins come from the backend environment.

Home, Email, and Lock icons are omitted: they would belong beside Home navigation,
the email/identifier input, and password inputs. Existing inline SVGs elsewhere in
unused legacy helpers predate this task; changed Home/role pages render no
inline SVG. Landing has not been changed.

## Role pages and account forms

SessionBootstrap loads the user's profile from `/api/accounts/profile/` after a
reload. The server role determines navigation; changing browser state does not
grant API access. StaffDashboard calls `GET /api/dashboard/` and HeadPage calls
`GET /api/accounts/head/` before displaying protected content. Both handle server
denial without exposing their forms or summaries. Head assignments call
`POST /api/accounts/staff/assign/`; permission is checked again on submission.

The dashboard uses the real summary endpoint for the next 30 project-local days
and one airport. Its layout contains four metrics, three date-list cards, a
seven-day strip and Your records last. All sample constants and fixed-height
placeholder panels are removed. Charts and All Airports remain unbuilt.
The Staff top bar contains Dashboard, Flights, and Crowd forecasts. The Head
top bar contains Dashboard, Flights, Crowd forecasts and Head management, in that
order, on every Staff page. Traveler navigation remains Home and Traffic Calendar. New dark
navigation links use text while white icon variants are unavailable.

Profile uses the Account reference's sidebar and two cards. The shared top bar's
username links to `/profile`. Profile Information edits username, email, first
name and last name; Role is text, with no selector. Only UserCircleIcon is used
for the avatar. There is no photo upload or edit pencil. Password & Security
requires current/new/confirmation values; confirmation is checked locally and
excluded from requests. Both forms display backend errors beside the matching
fields, focus the first invalid input, and display success/general error messages.
Profile saves update memory; reload obtains persisted values from the backend.
Sidebar section links move focus and indicate the selected section. Sign Out
uses the same shared behavior as the other authenticated pages.

Sign-Up success sends a consumed navigation flag to Sign-In and shows
**Account created. Please sign in.** with successIcon. Form edits or navigation
clear the message without persisting it in browser storage. Email and Lock
icons are absent and omitted. EyeOpen/EyeClosed exist but are not used here;
passwords remain masked. Dark sidebar navigation uses text because white icon
variants remain unavailable. No new dependencies or files under src/pages were
added for these features.


## Flight and crowd forecast management

The core routes reuse RoleRoute: `/calendar` permits Travelers only;
`/staff/flights`, `/staff/flights/new`, `/staff/flights/:id/edit`,
`/staff/forecasts`, `/staff/forecasts/new`, and `/staff/forecasts/:id/edit`
permit Staff and Heads. Backend permissions remain authoritative.

The flight and forecast features reuse RecordLayout, RecordField, RecordAlert,
and DeleteConfirmation. Lists show tables, empty states, and Add actions.
Edit/Delete controls appear only for server-computed `can_edit=true`. Forms load
lookup choices through the shared API client and show backend errors below the
matching field with aria-describedby, aria-invalid, and first-invalid focus.
Non-field messages appear in an error alert. Successful saves return to the list
with a consumed navigation-state success message. Deletes require inline,
nonmodal confirmation with ghost Cancel and danger Delete, block duplicate
submissions, update the table, and announce success. Focus is restored afterward.

HomeCalendar and TrafficCalendarPage use the same shared AirportCalendar. It
starts with the first airport returned by the lookup and today's project date
(currently UTC).
Airport changes preserve the selected date; month changes select day one. Real
dates determine weekdays and month lengths. Stored levels determine colors,
accessible date labels, the text legend, and the selected-date CrowdChip. Missing
forecasts show No data; failed requests show separate errors and retry actions.
The selected-date panel lists departing and arriving flights with airline, number, route,
times, and open seats, or No flights listed for this date.

Calendar month arrows, flight times, and seats use the existing PNG assets. No
new inline SVG or dependency was added. Shared calendar styles use global tokens,
44px control heights, and responsive layouts. Home's booking and search cards show only empty states; the sample form, rows,
View all, labels, constants and booking-count row are gone.

Flight entry/display and existing origin/date filtering use Philippine time
(Asia/Manila, UTC+08:00). The shared calendar and new airport/date flight filter
use project-local forecast dates, currently UTC; Django keeps TIME_ZONE=UTC. Date-only calendar values
are formatted without browser-timezone shifts. useRemoteResource keys reads by
airport/month/date and discards obsolete responses after selection changes.

StaffDashboard adds OwnRecordsCard after server authorization. It reads flight
and forecast lists with mine=true and counts their returned arrays. Loading,
errors, and retry affect only that card. All other displayed dashboard data comes
from GET /api/dashboard/summary/. Shared auth/profile behavior is unchanged.

New tests in FlightListPage.test.tsx, FlightFormPage.test.tsx,
ForecastPages.test.tsx, TrafficCalendarPage.test.tsx, and trafficApi.test.ts cover
management flows, permission-based UI, errors, successes, confirmations, filters,
No data, selected flights, month/airport changes, stale responses, and role guards.
StaffDashboard tests also cover own-record counts. Tests use jsdom and mocked APIs;
a live browser walkthrough and pixel-level verification remain unverified.

Dedicated search results, booking persistence, and All Airports aggregation remain TBD. Forecast thresholds and score meaning are
now defined in the backend calculation service.


## Current live feature behavior

The forecast table uses live seat numbers, their percentage, the flight count,
and a View flights link to /staff/flights?airport=<id>&date=<date>. The Flights
page reads those query parameters, requests the same backend filter and shows a
Clear filter action. Source is Calculated automatically or Staff entry.
Calculated rows have no Edit/Delete buttons, and direct edit routes with
can_edit=false withhold the form. The backend also rejects those writes.

StaffDashboard keeps its existing authorization probe and loads the real summary
and airport choices through its API/shared lookup modules. The backend chooses
the initial airport. The header shows Next 30 days and its returned date range.
Dates grouped under High/Medium/Low use the guide's colors and text, with no
empty fixed-height cards. Next 7 days shows explicit No data where absent.
Summary and own-record requests have independent loading/error/retry handling.

AppNavbar derives links from the signed-in profile role, preserving the Head
management link when a Head opens any Staff page. Staff see three work links;
Travelers see Home and Traffic Calendar. Existing current-page/focus styles apply.
Head management preserves its Assign Staff form and adds Staff and Pending
assignments tables. GET /api/accounts/staff/ supplies only approved fields.
Assign and Remove refresh both tables; Remove uses the unchanged revoke endpoint
with email only, after ghost Cancel/danger Remove confirmation. Staff becomes
Traveler without account deletion; a pending removal deletes only its assignment.
Backend messages, empty lists, loading, errors and retry are visible.

AppNavbar, HeadPage, StaffDashboard, Home, flight and forecast tests cover these
changes alongside Standard Feature regressions. Browser layout and the complete
live browser-to-database walkthrough remain unverified; jsdom/API tests do not
prove viewport-perfect rendering.


## Blended forecast explanation and recommendations

TrafficCalendarPage supplies optional renderDetails/renderAfter callbacks to
AirportCalendar. CalendarSelection passes airport, date, stored forecast and
onSelectDate; the shared component never imports a feature module. DateBreakdown
and RecommendedDates live in the existing calendar feature; its api.ts and
types.ts define their calls/contracts. Home supplies neither slot, keeping its
preview free of explanations and recommendations. No Home source file changed.

DateBreakdown renders the backend sentences and a flight/history/combined table,
plus history dates, with info-circleIcon. Manual levels stay visible with the
calculated blend identified separately. RecommendedDates renders bulbIcon, up to
three cards with crowd-chip text, score/difference, open seats and reasons. A card
uses a native button to select its date, reloading all relevant requests. Both
sections use keyed resources with loading/error/retry and stale-response protection.
The calendar enables showFlightDirections and uses the server direction field
from /api/flights/?airport=<id>&date=<date>; filtering remains server-owned.

StaffDashboard adds ComparisonCard from the existing summary response's comparison
object, with no chart library. Tests cover real numbers, absent history and
existing states/role guards. Calendar tests cover breakdown, no history/data,
flight directions, recommendations, selection, airport/month changes and errors.
Home tests assert both new sections are absent. Browser/viewport verification
remains unperformed; automated tests use jsdom with mocked APIs.
