# UI_STYLE_GUIDE

This file defines the look and feel of the interface: colors, buttons, bars, clickable elements, and readability.
It covers **UI/UX only**. For code rules, see `CODING_STANDARDS.md`. For how to handle requests, see `PROMPTING_RULES.md`.

**Theme:** Blue as the main color. Clean, high contrast, easy to read.

## How Codex must use this file

- Follow this guide for every screen, page, component, and style you create or change.
- Define the colors, spacing, and sizes below once as shared variables in the project's global stylesheet, and reuse them everywhere. Do not hardcode colors or sizes inside individual components.
- Do not invent new colors, spacing, shadows, or component looks. If a design need is not covered here, stop and ask the owner.
- If you believe a different style would be better, explain why and wait for approval before using it (see `PROMPTING_RULES.md`).
- Match the same look for the same kind of element across the whole project. Consistency matters more than variety.

---

## 1. Colors

### Brand blues

| Name | Value | Used for |
|---|---|---|
| Blue 50 | `#eff6ff` | Light hover backgrounds, info message background |
| Blue 100 | `#dbeafe` | Pressed backgrounds, badges, light text on dark bars |
| Blue 500 | `#3b82f6` | Hover borders on inputs and cards |
| Blue 600 | `#2563eb` | **Main brand color**: primary buttons, active navigation |
| Blue 700 | `#1d4ed8` | Hover state, links |
| Blue 800 | `#1e40af` | Pressed state, table headers |
| Blue 900 | `#1e3a8a` | Top bar and sidebar background |

### Neutrals

| Name | Value | Used for |
|---|---|---|
| White | `#ffffff` | Cards, panels, inputs, text on blue |
| Gray 50 | `#f8fafc` | Page background |
| Gray 100 | `#f1f5f9` | Disabled input background |
| Gray 200 | `#e2e8f0` | Disabled buttons, row dividers |
| Gray 300 | `#cbd5e1` | Borders |
| Gray 500 | `#64748b` | Disabled text |
| Gray 600 | `#475569` | Secondary text, hints |
| Gray 900 | `#0f172a` | Body text |

### Status colors

| Meaning | Text color | Background |
|---|---|---|
| Success | `#15803d` | `#dcfce7` |
| Warning | `#b45309` | `#fef3c7` |
| Error / danger | `#b91c1c` | `#fee2e2` |

### Color rules

- Blue is for **actions and navigation** only. Do not use blue for plain text or decoration.
- Red is for **errors and destructive actions** only. Green is for **success** only. The one exception is the traffic calendar, which uses green, amber, and red for Low, Medium, and High crowd levels (see section 8).
- Text must have strong contrast against its background (at least WCAG AA, 4.5:1).
- Never show meaning by color alone. Pair color with a text label or icon.

---

## 2. Typography and spacing

- **Font:** the system font stack (system-ui, Segoe UI, Roboto, Arial). Do not add custom fonts without asking.
- **Body text:** 16px minimum, line height about 1.6. Small labels can go down to 14px, never lower.
- **Headings:** clearly larger than body text, tighter line height, with space below.
- **Paragraphs:** keep lines to about 60 to 80 characters.
- **Spacing scale:** 4, 8, 12, 16, 24, 32px. Use only these values for gaps and padding.
- **Corners:** 8px rounding for cards, buttons, and panels. 6px for inputs and small items.
- **Transitions:** 150ms for hover and press changes. Turn animations off for users who prefer reduced motion.

---

## 3. Buttons

Every button must have these looks: **default, hover, pressed (click), focus, and disabled**.

| Button | Default | Hover | Pressed (click) |
|---|---|---|---|
| **Primary** (main action) | Blue 600 fill, white bold text | Blue 700 fill with a soft blue shadow | Blue 800 fill, no shadow, moves down 1px |
| **Secondary** (supporting action) | White fill, Blue 600 border, Blue 700 text | Blue 50 fill, Blue 700 border | Blue 100 fill, Blue 800 border, moves down 1px |
| **Ghost** (low emphasis, like Cancel) | No fill, Blue 700 text | Blue 50 fill | Blue 100 fill, moves down 1px |
| **Danger** (delete, remove) | Red fill (`#b91c1c`), white text | Darker red (`#991b1b`) | Darkest red (`#7f1d1d`), moves down 1px |

**Focus (all buttons):** a visible 3px blue ring with a 2px gap, shown for keyboard users.
**Disabled (all buttons):** Gray 200 fill, Gray 500 text, no shadow, "not allowed" cursor. It must look clearly different from an active button.

Button rules:

- Only **one primary button** per section or form.
- Minimum height is **44px** so it is easy to tap or click.
- Bold text, 8px corners, comfortable side padding (24px).
- Button text states the action ("Save record", not "OK").
- Use a real button for actions and a link for navigation. Never make a plain box act like a button.

---

## 4. Links and clickable elements

Anything clickable must **look** clickable and must show a visible change on hover, press, and focus.

| Element | Default | Hover | Pressed | Focus |
|---|---|---|---|---|
| **Text link** | Blue 700, underlined | Blue 800 with Blue 50 background | Blue 900 with Blue 100 background | 3px blue ring |
| **Clickable card or row** | White, gray border, pointer cursor | Blue 50 background, Blue 500 border, light blue shadow | Blue 100 background, Blue 700 border | 3px blue ring |

Rules:

- Links inside text always keep their underline.
- Clickable items always show a pointer cursor.
- Items that are **not** clickable must **not** use hover highlights, so users are not misled.

---

## 5. Bars and navigation

### PredictBook page navigation

- The Homepage and Traffic Calendar use the existing Blue 900 (`#1e3a8a`) top navigation bar.
- The My Account page uses the same Blue 900 color for its sidebar.
- The signed-in Homepage provides flight search and an interactive traffic calendar preview.
- Selecting Traffic Calendar opens the full Traffic Calendar page.
- Smart date suggestions appear within Traffic Calendar, not as a separate navigation tab.
- My Account contains Profile Information, Password & Security, and Sign Out.
- Heads have access to a management interface for assigning Staff by email, promoting Staff to Head, and removing access according to their permissions.
- Navigation and management actions must follow the existing buttons, links, forms, icons, and accessibility rules in this guide.

### Top bar

- Background Blue 900, white text, at least 60px tall, soft shadow underneath.
- Logo or title on the left, actions or user menu on the right.

### Sidebar

- Background Blue 900, 240px wide on desktop, full width on small screens.

### Navigation items (top bar and sidebar)

| State | Look |
|---|---|
| Default | Light blue text (Blue 100), no background, at least 44px tall |
| Hover | White text, Blue 800 background |
| Pressed | Blue 700 background |
| **Current page** | Blue 600 background, white bold text, and a white bar on the left edge |
| Focus | 3px white ring |

### Tabs

| State | Look |
|---|---|
| Default | Gray 600 bold text, no background, transparent bottom line |
| Hover | Blue 700 text, Blue 50 background |
| Pressed | Blue 100 background |
| **Selected** | Blue 700 text with a 3px Blue 600 line underneath |
| Focus | 3px blue ring |

Bar rules:

- The current page or selected item must **always** be visibly highlighted.
- Text on dark blue is white or very light blue, never mid-blue.
- Keep navigation labels short and clear.

---

## 6. Forms

| State | Input look |
|---|---|
| Default | White background, 2px Gray 300 border, 44px minimum height, 16px text |
| Hover | Border turns Blue 500 |
| Focus | Border turns Blue 600 with a soft blue glow around it |
| Disabled | Gray 100 background, Gray 500 text, "not allowed" cursor |
| Error | Red border, red bold message below the field |

Rules:

- Every input has a **visible label** above it. Do not use placeholder text as the label.
- Hints appear below the field in small Gray 600 text.
- Error messages say what is wrong and how to fix it, right next to the field.

---

## 7. Cards, tables, badges, and alerts

**Cards:** white background, 1px Gray 300 border, 8px corners, 24px padding, very light shadow.

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
- Calendar and prediction information must come from the available data; sample values must be clearly identified.

Each date on the calendar changes color based on the crowd level stored for that airport and date. The database stores only the level. The frontend picks the color.

| Crowd level | Date cell text | Date cell background | Text label shown |
|---|---|---|---|
| Low | `#15803d` | `#dcfce7` | Low |
| Medium | `#b45309` | `#fef3c7` | Medium |
| High | `#b91c1c` | `#fee2e2` | High |
| No data | Gray 500 | Gray 100 | No data |

Rules:

- Every date shows its level as text as well as color. Never rely on color alone.
- Show a legend with all three levels near the calendar.
- Today is marked with a bold date number.
- The selected date gets a 3px Blue 600 outline in addition to its level color.
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
- Black icons on white or light surfaces are fine. Icons on dark Blue 900 bars need a white version. The owner supplies white versions or SVGs (TBD). Until then, ask before placing an icon on a dark bar.
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
- [ ] The calendar colors follow the crowd level and always show a text label.
- [ ] The current page or selected item is clearly highlighted.
- [ ] Text is readable with strong contrast.
- [ ] Meaning is never shown by color alone.
- [ ] It works on small screens and with the keyboard.
- [ ] If I needed a style not listed here, I asked the owner first.