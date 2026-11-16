# Frontend

## Entry point and routing

[main.tsx](../frontend/src/main.tsx) imports the global stylesheet and mounts App inside React StrictMode. [App.tsx](../frontend/src/App.tsx) uses BrowserRouter and declares `/`, `/signin`, `/signup`, `/home`, `/staff/dashboard`, `/head`, and `/profile`.

The routes use session and role guards. Traveler lands at `/home`, Staff at `/staff/dashboard`, and Head at `/head`. Heads can also visit the Staff dashboard. `/profile` is available to every authenticated role. Signed-out protected requests go to Sign-In; wrong-role navigation goes to the user's own landing page. Signed-in visitors to `/signin` or `/signup` go to their role landing page. `/` remains public. There is still no fallback route or `/calendar` route. Production hosting must serve the frontend entry HTML for client routes such as /home.

See the [page index](README.md#pages-at-a-glance) for behavior and status.

## Source map

Paths below are relative to frontend/.

| Location | Responsibility |
|---|---|
| src/pages/ | Existing LandingPage; no new page files added |
| src/features/signin/ | Reused SignInPage and its API calls |
| src/features/signup/ | Reused SignUpPage and its API calls |
| src/features/homepage/ | Reused HomePage, its CSS, profile restoration and shared logout export |
| src/features/staff-dashboard/ | StaffDashboard, protected access API, sample summary calculations and CSS |
| src/features/head/ | HeadPage, protected access and email assignment API, CSS |
| src/features/profile/ | ProfilePage, ProfileInformation, PasswordSecurity, own-profile API and CSS |
| src/components/ | Shared layouts, fields, navigation, calendars and icons |
| src/data/homeSample.ts | Typed Home fixtures and date formatter |
| src/index.css | Global fonts, CSS variables, shared buttons, search fields and calendar styles |
| src/components/AuthLayout.css | Styles shared by sign-in and sign-up; class names still use the signin- prefix |
| src/components/AppNavbar.css | Signed-in navbar and SVG icon sizing |
| src/features/homepage/HomePage.css | Home layout, interactive calendar, chips and summary rows |
| src/api/client.ts | Environment-based API client, bearer authorization, one refresh attempt and one retry |
| src/api/authStorage.ts | Only module that reads/writes/clears access and refresh tokens in localStorage |
| src/api/authState.ts | Safe in-memory profile state and session clearing |
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
| Icon | Navbar, HomePage, HomeCalendar | Typed name selects an inline SVG; decorative SVGs are hidden from assistive technology |
| TrafficCalendar | LandingPage | Static 30-day marketing preview; not the /calendar page |
| HomeCalendar | HomePage | Owns selected-day state and sample booking information; also exports CrowdChip |

Landing currently writes its logo markup inline, using the same global logo styles; it does not import Brand. CrowdChip styling currently lives in HomePage.css, so using it elsewhere requires those styles or an explicit shared-style extraction.

## Styles and accessibility

Reuse variables from src/index.css: --bg, --ink, --muted, --border, --accent, --low, --medium, --high and --white. Shared .calendar-grid, .calendar-day and level classes underpin the calendar displays.

Inter and Space Grotesk are loaded through Google Fonts in index.html, with sans-serif fallbacks. Auth pages share one CSS file; changes there affect both pages. Home styles are scoped to its own classes.

Pages use labels, visible focus styles and one H1. Auth errors are text alerts associated with inputs. Home day buttons expose the date/crowd level and aria-pressed; booking information uses a polite live region. Calendars include text or accessible crowd descriptions.

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
| HomePage.test.tsx | Greeting, 31 days, real weekday alignment, day selection, booking values, field swap and navbar |
| StaffDashboard.test.tsx | Sample counts, real weekdays, live-date filtering, authorization, month boundaries and midnight |
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
the Home components predate this task and still need a separate asset/style
cleanup; Landing has not been changed.

## Role pages and account forms

SessionBootstrap loads the user's profile from `/api/accounts/profile/` after a
reload. The server role determines navigation; changing browser state does not
grant API access. StaffDashboard calls `GET /api/dashboard/` and HeadPage calls
`GET /api/accounts/head/` before displaying protected content. Both handle server
denial without exposing their forms or summaries. Head assignments call
`POST /api/accounts/staff/assign/`; permission is checked again on submission.

The dashboard follows the supplied reference layout while computing its values
from shared typed January 2026 sample dates. Sunday, rather than the reference's
shifted Saturday, has the most High days. Upcoming/next-seven-day panels use the
live local date (including today), refresh each minute, and show no data for
dates outside the sample month. Charts and airport aggregation remain unbuilt.
The Staff top bar contains Dashboard only. The Head top bar contains Head
management and Dashboard; neither adds links to unbuilt pages.

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
