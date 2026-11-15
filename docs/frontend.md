# Frontend

## Entry point and routing

[main.tsx](../frontend/src/main.tsx) imports the global stylesheet and mounts App inside React StrictMode. [App.tsx](../frontend/src/App.tsx) uses BrowserRouter and declares /, /signin, /signup and /home.

There is no authentication guard, fallback route, or /calendar route. Valid form submissions do not navigate to Home. During development, visit /home directly to inspect that screen. Production hosting must serve the frontend entry HTML for client routes such as /home.

See the [page index](README.md#pages-at-a-glance) for behavior and status.

## Source map

Paths below are relative to frontend/.

| Location | Responsibility |
|---|---|
| src/pages/ | LandingPage, SignInPage, SignUpPage and HomePage |
| src/components/ | Shared layouts, fields, navigation, calendars and icons |
| src/data/homeSample.ts | Typed Home fixtures and date formatter |
| src/index.css | Global fonts, CSS variables, shared buttons, search fields and calendar styles |
| src/components/AuthLayout.css | Styles shared by sign-in and sign-up; class names still use the signin- prefix |
| src/components/AppNavbar.css | Signed-in navbar and SVG icon sizing |
| src/pages/HomePage.css | Home layout, interactive calendar, chips and summary rows |
| src/api/ and src/types/ | Reserved shared folders; no API client or shared type modules yet |
| src/references/ | Design references; these screenshots are not rendered as pages |
| tests/ | Vitest page tests |
| index.html | Title, root element and Google Fonts links |

The implemented pages use src/pages as requested in the page tasks and README. CODING_STANDARDS also describes a future feature-folder convention; no migration to that layout has been implemented.

## Reuse before adding a component

| Component | Used by | Contract and behavior |
|---|---|---|
| Brand | AuthLayout, AppNavbar | CSS calendar mark and PredictBook link; optional to prop defaults to /; navbar passes /home |
| AuthLayout | SignInPage, SignUpPage | Accepts pageId, title, intro, panelTitle, panelIntro, typed sample days and children; owns the split layout and static calendar |
| AuthField | SignInPage, SignUpPage | Label, input and optional error; accepts input attributes/ref; links errors with aria-describedby and sets aria-invalid |
| AppNavbar | HomePage | Accepts userName; Home and Traffic Calendar NavLinks, plus an inactive account button |
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

The actual scripts run Vite, Oxlint, Vitest, and TypeScript followed by Vite respectively. Build enables strict TypeScript checking. Tests cover frontend behavior, not backend authentication or live data.

| Test file | Main coverage |
|---|---|
| LandingPage.test.tsx | Heading, four feature cards, 30-day preview, sign-in link |
| SignInPage.test.tsx | Fields, links, required errors, first-invalid focus and valid resubmission |
| SignUpPage.test.tsx | Fields, links, required/email/matching errors, error clearing and no extra password rule |
| HomePage.test.tsx | Greeting, 31 days, real weekday alignment, day selection, booking values, field swap and navbar |

Landing tests render static HTML. The other suites use jsdom with React act and createRoot to exercise DOM events. None of these tests proves a pixel-perfect match to the reference screenshots.
