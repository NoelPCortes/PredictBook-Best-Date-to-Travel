# Sign-in page

[Documentation index](../README.md) · [Accounts feature](../features/accounts.md)

| Item | Location |
|---|---|
| Route | /signin |
| Source | [SignInPage.tsx](../../frontend/src/pages/SignInPage.tsx) |
| Shared UI | [AuthLayout](../../frontend/src/components/AuthLayout.tsx), [AuthField](../../frontend/src/components/AuthField.tsx), [Brand](../../frontend/src/components/Brand.tsx) |
| Styling | [AuthLayout.css](../../frontend/src/components/AuthLayout.css) and global index.css |
| Tests | [SignInPage.test.tsx](../../frontend/tests/SignInPage.test.tsx) |

## Purpose and layout

Collect credentials for an existing account. Travelers and Staff are directed to the same form. The page does not identify a real user yet.

The left half contains the brand, “Welcome back” heading, introduction, credential form and account-creation link. The right navy panel contains explanatory copy and a static two-row crowd preview for days 5–18. On narrow screens the form appears above the panel.

## Fields and validation

| Field | Input | Autocomplete | Empty-field error |
|---|---|---|---|
| Email or username | Text | username | Enter your email or username. |
| Password | Password | current-password | Enter your password. |

Submitting prevents a reload, checks both fields and focuses the first invalid input. Whitespace-only usernames count as empty; passwords are checked for an empty value without trimming. No email-format check is applied because the first field also accepts usernames.

AuthField displays text alerts, sets aria-invalid and connects the message through aria-describedby. Sign-in errors are recalculated on submission; unlike sign-up, editing a field does not immediately clear its error.

## Navigation and current limits

- Brand -> /.
- Create an account -> /signup.
- When both fields are filled, the handler reaches a TODO and stops.
- No API call, token/session creation, application storage or redirect occurs. To inspect Home, visit /home directly.

The right-hand sample calendar is informational. It does not select travel dates.

Tests cover the heading, fields, link targets, both empty-field errors, focus order and removal of errors after a valid resubmission.
