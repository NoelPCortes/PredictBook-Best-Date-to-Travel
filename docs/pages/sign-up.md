# Sign-up page

[Documentation index](../README.md) · [Accounts feature](../features/accounts.md)

| Item | Location |
|---|---|
| Route | /signup |
| Source | [SignUpPage.tsx](../../frontend/src/pages/SignUpPage.tsx) |
| Shared UI | [AuthLayout](../../frontend/src/components/AuthLayout.tsx), [AuthField](../../frontend/src/components/AuthField.tsx), [Brand](../../frontend/src/components/Brand.tsx) |
| Styling | [AuthLayout.css](../../frontend/src/components/AuthLayout.css) and global index.css |
| Tests | [SignUpPage.test.tsx](../../frontend/tests/SignUpPage.test.tsx) |

## Purpose and layout

Collect new account details through the “Create your account” form. Public users cannot choose a role. Actual registration and role assignment are not connected.

The split layout is shared with sign-in. The navy panel reads “Plan around the crowds.” and shows two static calendar rows: days 19–30 followed by 1–2. These are sample cells, not an interactive month. On narrow screens the form comes first.

## Fields and validation

Fields appear in this order:

| Field | Type / autocomplete | Error conditions and messages |
|---|---|---|
| Username | text / username | Empty: “Choose a username.” |
| Email | email / email | Empty: “Enter your email.” Invalid basic format: “Enter a valid email address.” |
| Password | password / new-password | Empty: “Create a password.” |
| Confirm password | password / new-password | Empty: “Confirm your password.” Different from Password: “Passwords do not match.” |

The submit handler prevents reload and reads the current form with FormData. Username and email are trimmed. Email must have non-whitespace content around an @ and a dot in the domain. This is only a basic format check; it does not verify that an address exists.

Passwords are compared as entered. There is no minimum length or complexity rule in this frontend. Confirmation checks for an empty value before checking for a mismatch.

All errors are collected together, shown below their fields and linked with aria-describedby; invalid inputs expose aria-invalid. Focus moves to the first invalid input in form order.

Editing a field clears only that field's error. Changing Password does not automatically clear or revalidate Confirm password; the next submission checks the whole form again.

## Navigation and current limits

- Brand -> /.
- Sign in -> /signin.
- Valid values reach a Django-integration TODO and stop: no account is created, no email is sent, nothing is stored, and no redirect occurs.

Tests cover the heading, all fields/button, links, required messages, invalid email, password mismatch, focus, clearing an edited field's error and acceptance of matching single-character passwords.
