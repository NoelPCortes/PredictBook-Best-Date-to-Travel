# UI_STYLE_GUIDE

This file defines the look and feel of the interface: colors, buttons, bars, clickable elements, and readability.
It covers **UI/UX only**. For code rules, see `CODING_STANDARDS.md`. For how to handle requests, see `PROMPTING_RULES.md`.

**Theme:** Blue as the main color on a light page, with dark navy bars and cards. Clean, high contrast, easy to read.

## How Codex must use this file

- Follow this guide for every screen, page, component, and style you create or change.
- Define the colors, spacing, and sizes below once as shared variables in the project's global stylesheet, and reuse them everywhere. Do not hardcode colors or sizes inside individual components.
- Do not invent new colors, spacing, shadows, or component looks. If a design need is not covered here, stop and ask the owner.
- If you believe a different style would be better, explain why and wait for approval before using it (see `PROMPTING_RULES.md`).
- Match the same look for the same kind of element across the whole project. Consistency matters more than variety.
- The design reference images in `frontend/src/references/` show the intended layouts. Colors, fonts, and sizes come from this file.

---

## 1. Colors

### Brand blues

| Name | Value | Used for |
|---|---|---|
| Blue 50 | `#eff6ff` | Light hover backgrounds, info message background |
| Blue 100 | `#dbeafe` | Pressed backgrounds, badges, light text on dark bars |
| Blue 500 | `#3b82f6` | Hover borders on inputs and cards |
| Blue 600 | `#1d4ed8` | **Main brand color**: primary buttons, links, active navigation |
| Blue 800 | `#1e40af` | Hover state for Blue 600 elements, table headers |
| Blue 900 | `#1e3a8a` | Pressed state for Blue 600 elements, hover on dark bars |

### Navy and neutrals

| Name | Value | Used for |
|---|---|---|
| Navy | `#0f1b2d` | Top bar, sidebar, and dark cards. Same value as Gray 900 |
| White | `#ffffff` | Cards, panels, inputs, text on blue and navy |
| Gray 50 | `#f6f8fb` | Page background |
| Gray 100 | `#f1f5f9` | Disabled input background |
| Gray 200 | `#e2e8f0` | Disabled buttons, row dividers |
| Gray 300 | `#d5dce6` | Borders |
| Gray 500 | `#64748b` | Disabled text |
| Gray 600 | `#4a5668` | Secondary text, hints |
| Gray 900 | `#0f1b2d` | Body text |

### Status colors

| Meaning | Text color | Background |
|---|---|---|
| Success | `#15803d` | `#dcfce7` |
| Warning | `#b45309` | `#fef3c7` |
| Error / danger | `#b91c1c` | `#fee2e2` |

### Color rules

- Blue is for **actions and navigation**, plus small accent text such as eyebrow labels and card numbers. Do not use blue for body text or decoration.
- Red is for **errors and destructive actions** only. Green is for **success** only. The one exception is the traffic calendar, which uses its own crowd-level colors for Low, Medium, and High (see section 8).
- Text must have strong contrast against its background (at least WCAG AA, 4.5:1).
- Never show meaning by color alone. Pair color with a text label or icon.

---

## 2. Typography and spacing

- **Fonts:** Space Grotesk for headings (weights 500 and 700) and Inter for body text (weights 400, 500, and 600). Load them from Google Fonts with the system font stack (system-ui, Segoe UI, Roboto, Arial) as the fallback. Do not add other fonts without asking.
- **Body text:** 16px minimum, line height about 1.6. Small labels can go down to 14px, never lower.
- **Headings:** clearly larger than body text, tighter line height, with space below.
- **Eyebrow labels:** small, bold, uppercase, letter-spaced, in Blue 600 on light backgrounds (yellow `#f4c65a` on Navy).
- **Paragraphs:** keep lines to about 60 to 80 characters.
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px. Use only these values for gaps and padding.
- **Corners:** 20px for large cards and panels, 14px for buttons and inputs, 10px for calendar cells and small items.
- **Transitions:** 150ms for hover and press changes. Turn animations off for users who prefer reduced motion.

---

## 3. Buttons

Every button must have these looks: **default, hover, pressed (click), focus, and disabled**.

| Button | Default | Hover | Pressed (click) |
|---|---|---|---|
| **Primary** (main action) | Blue 600 fill, white bold text | Blue 800 fill with a soft blue shadow | Blue 900 fill, no shadow, moves down 1px |
| **Secondary** (supporting action) | White fill, Gray 300 border, Navy text | Blue 50 fill, Blue 600 border, Blue 800 text | Blue 100 fill, Blue 800 border, moves down 1px |
| **Ghost** (low emphasis, like Cancel) | No fill, Blue 600 text | Blue 50 fill | Blue 100 fill, moves down 1px |
| **Danger** (delete, remove) | Red fill (`#b91c1c`), white text | Darker red (`#991b1b`) | Darkest red (`#7f1d1d`), moves down 1px |

**Focus (all buttons):** a visible 3px blue ring with a 2px gap, shown for keyboard users.
**Disabled (all buttons):** Gray 200 fill, Gray 500 text, no shadow, "not allowed" cursor. It must look clearly different from an active button.

Button rules:

- Only **one primary button** per section or form.
- Minimum height is **44px** so it is easy to tap or click. Full-width buttons on the sign-in and sign-up forms are 56px.
- Bold text, 14px corners, comfortable side padding (24px).
- Button text states the action ("Save record", not "OK").
- Use a real button for actions and a link for navigation. Never make a plain box act like a button.

---

## 4. Links and clickable elements

Anything clickable must **look** clickable and must show a visible change on hover, press, and focus.

| Element | Default | Hover | Pressed | Focus |
|---|---|---|---|---|
| **Text link** | Blue 600, underlined | Blue 800 with Blue 50 background | Blue 900 with Blue 100 background | 3px blue ring |
| **Clickable card or row** | White, gray border, pointer cursor | Blue 50 background, Blue 500 border, light blue shadow | Blue 100 background, Blue 600 border | 3px blue ring |

Rules:

- Links inside text always keep their underline.
- Clickable items always show a pointer cursor.
- Items that are **not** clickable must **not** use hover highlights, so users are not misled.

---

## 5. Bars and navigation

### PredictBook page navigation

- The signed-in Homepage and Traffic Calendar use the Navy top navigation bar with Home and Traffic Calendar links.
- Staff pages use the same top bar with Dashboard and Charts links. The Dashboard and Charts are separate pages.
- The My Account page uses a Navy sidebar.
- The signed-in Homepage provides flight search and an interactive traffic calendar preview.
- Selecting Traffic Calendar opens the full Traffic Calendar page.
- Smart date suggestions appear within Traffic Calendar, not as a separate navigation tab. (The My Account reference image still shows a Suggestions link. TBD: confirm with the owner.)
- My Account contains Profile Information, Password & Security, and Sign Out.
- Heads have access to a management interface for assigning Staff by email, promoting Staff to Head, and removing access according to their permissions. Its design: TBD.
- Navigation and management actions must follow the existing buttons, links, forms, icons, and accessibility rules in this guide.

### Top bar

- Background Navy, white text, at least 60px tall, soft shadow underneath.
- Logo on the left, navigation links next to it, and one profile button on the right linking to `/profile` (My account). It contains UserCircleIcon in a White or Blue 100 circular badge and the signed-in username, with accessible name `My account, {username}`, at least 44px height, the current-page highlight and visible white focus ring. Do not recolor the icon or add a new icon. There is no top-bar Sign out button; Sign Out remains on My account.

### Sidebar

- Background Navy, 240px wide on desktop, full width on small screens.

### Navigation items

| State | Top bar look | Sidebar look |
|---|---|---|
| Default | Light blue text (Blue 100), no background, at least 44px tall | Same |
| Hover | White text, Blue 900 background | Same |
| Pressed | Blue 800 background | Same |
| **Current page** | White bold text with a 3px Blue 600 line underneath, and `aria-current="page"` | Blue 600 background, white bold text, rounded corners, and `aria-current="page"` |
| Focus | 3px white ring | 3px white ring |

### Tabs

| State | Look |
|---|---|
| Default | Gray 600 bold text, no background, transparent bottom line |
| Hover | Blue 800 text, Blue 50 background |
| Pressed | Blue 100 background |
| **Selected** | Blue 600 text with a 3px Blue 600 line underneath |
| Focus | 3px blue ring |

Bar rules:

- The current page or selected item must **always** be visibly highlighted.
- Text on Navy is white or very light blue, never mid-blue.
- Keep navigation labels short and clear.

---

## 6. Forms

| State | Input look |
|---|---|
| Default | White background, 1px Gray 300 border, 14px corners, 44px minimum height, 16px text |
| Hover | Border turns Blue 500 |
| Focus | Border turns Blue 600 with a soft blue glow around it |
| Disabled | Gray 100 background, Gray 500 text, "not allowed" cursor |
| Error | Red border, red bold message below the field |

Rules:

- A bordered field container owns the field background. Its inner text, date, select, or searchable-dropdown control has a transparent background so it uses the container background. Keep the border, label, focus ring, error, and disabled states above; disabled containers use Gray 100.
- Every input has a **visible label**. The label sits at the top of the input box in small, bold, Gray 600 text. Do not use placeholder text as the label.
- Hints appear below the field in small Gray 600 text.
- Error messages say what is wrong and how to fix it, right next to the field.

---

## 7. Cards, tables, badges, and alerts

**Cards:** white background, 20px corners, 24px padding, very light shadow. A 1px Gray 300 border is optional. Dark cards use Navy with white text.

**Tables:**
- Header row: Blue 800 background with white text.
- Rows: white and Gray 50 alternating, with a Gray 200 line between rows.
- Row hover: Blue 50 background, only for tables where rows are clickable or help scanning.
- Wide tables scroll inside their own container, not the whole page.

**Badges** (small rounded status labels, always with a text label):

| Type | Text | Background |
|---|---|---|
| Info | Blue 800 | Blue 100 |
| Success | Green | Light green |
| Warning | Amber | Light amber |
| Danger | Red | Light red |

**Alerts:** a message box with a 5px colored left edge, matching text color, and a light background in the same color family (info uses blue, others use status colors). Always include a clear text message.

---

## 8. Traffic calendar

- The Homepage calendar preview allows users to select dates and view available crowd-level and flight information.
- Selecting Traffic Calendar in navigation opens the full interactive calendar.
- The full Traffic Calendar includes smart date suggestions based on crowd levels and available seats.
- Selecting a calendar date updates the corresponding date information.
- Calendar and prediction information must come from the available data. Sample values must be clearly identified, for example with a "Sample data" label.

Each date on the calendar changes color based on the crowd level stored for that airport and date. The database stores only the level. The frontend picks the color.

| Crowd level | Date cell text | Date cell background | Text label shown |
|---|---|---|---|
| Low | `#0f1b2d` | `#bfe9dc` | Low |
| Medium | `#0f1b2d` | `#f4c65a` | Medium |
| High | `#ffffff` | `#c2410c` | High |
| No data | Gray 500 | Gray 100 | No data |

Rules:

- Never rely on color alone. The three levels differ in lightness (Low is light, Medium is mid, High is dark). A level is also shown as text in the legend, in the selected date's details (for example a "Low crowd" chip), and in each date's accessible name (for example "January 14, 2026, Low crowd").
- A crowd level chip shows a dot and the text "Low crowd", "Medium crowd", or "High crowd".
- Show a legend with all three levels near the calendar.
- Today is marked with a bold date number.
- The selected date gets a solid Blue 600 fill, white bold text, and a white ring. Its level stays available as text in the details panel and the accessible name.
- Suggested dates get a dark Navy outline (a ring with a white gap) and the accessible name "Suggested date".
- Clickable date cells follow the clickable rules in section 4 (hover, pressed, focus), without hiding their level color.
- Month navigation uses `chevron-leftIcon` and `chevron-rightIcon` in buttons at least 44px wide and tall.
- If the colors or levels change, ask the owner first.

---

## 9. Icons

All icons live in `frontend/src/assets/icons/`. Use each icon only for the label or purpose listed here. Do not add an icon library, new icon files, or a different icon for the same purpose without asking. Names are the current file names (PNG).

### Brand and flight

| Icon | Use it for |
|---|---|
| `CalendarLogo` | The site logo: top bar, sign-in, and sign-up pages |
| `CalendarIcon` | Calendars and date fields inside the site |
| `AirplaneIconColored` | Tickets: flight cards and flight details |
| `AirplaneIcon` | General flight uses, such as the Flights navigation item |
| `MapPinIcon` | Airport, origin, and destination fields and labels |
| `arrow-narrow-rightIcon` | The route from origin to destination on flight cards |
| `arrows-right-leftIcon` | The swap origin and destination button |
| `ClockIcon` | Departure and arrival times |
| `SeatIcon` | Open seats |
| `PassengersIcon` | TBD. Not in `PRODUCT.md` yet, so ask before using it |

### Account

| Icon | Use it for |
|---|---|
| `UserCircleIcon` | Profile, user menu, and the username field |
| `LogoutIcon` | The logout button |
| `EyeOpenIcon` | The button that shows a hidden password |
| `EyeClosedIcon` | The button that hides a visible password |
| `editIcon` | Edit profile and other edit buttons |

### Navigation and controls

| Icon | Use it for |
|---|---|
| `SearchIcon` | Search flights button and search fields |
| `MenuIcon` | Opens the menu on small screens |
| `CloseIcon` | Closes menus and dialogs, and dismisses messages |
| `chevron-leftIcon`, `chevron-rightIcon` | Calendar month navigation and paging |
| `chevron-upIcon`, `chevron-downIcon` | Dropdowns and expandable sections |

### Suggestions and Staff

| Icon | Use it for |
|---|---|
| `bulbIcon` | Smart date suggestions |
| `dashboardIcon` | The Staff dashboard navigation item |
| `chart-lineIcon` | Staff summary charts and crowd trends |

### Messages

| Icon | Use it for |
|---|---|
| `successIcon` | Success alerts and badges |
| `alert-triangleIcon` | Warning alerts and badges |
| `alert-circleIcon` | Error alerts and badges |
| `info-circleIcon` | Info alerts and badges |

### Not downloaded yet

Home (homepage navigation), Email (email field), and Lock (password field). Ask the owner before using a substitute.

### Icon rules

- Sizes: 16px inline with small text, 20px by default, 24px in bars. Keep an icon the same size across the same kind of element.
- An icon sits beside a text label whenever there is room. An icon-only button needs an accessible name and a 44px tap target.
- Icons that only decorate a label are hidden from screen readers.
- Black icons on white or light surfaces are fine. Icons on dark Navy bars need a white version. The owner supplies white versions or SVGs (TBD). Until then, ask before placing an icon on a dark bar.
- `CalendarLogo` and `AirplaneIconColored` keep their own colors. Never recolor them.
- Show images at the size they are needed. Do not load a large image to display a small one.

---

## 10. Responsive and accessibility

- Layouts must work on phone, tablet, and desktop.
- Everything clickable must work with the keyboard and show a visible focus ring.
- Use proper HTML elements (navigation, main, button, label) before adding extra accessibility attributes.
- Tap targets are at least 44px.
- Respect the user's reduced-motion setting.

---

## 11. Before you finish any UI change

- [ ] I followed this guide and used only its colors, spacing, and component looks.
- [ ] Every clickable element has default, hover, pressed, and focus looks.
- [ ] Icons come from `src/assets/icons` and match the labels in section 9.
- [ ] The calendar colors follow the crowd level and the level is always available as text.
- [ ] The current page or selected item is clearly highlighted.
- [ ] Text is readable with strong contrast.
- [ ] Meaning is never shown by color alone.
- [ ] It works on small screens and with the keyboard.
- [ ] If I needed a style not listed here, I asked the owner first.