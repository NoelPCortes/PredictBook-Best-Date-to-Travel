# Accounts and access

[Documentation index](../README.md) · [Sign-in page](../pages/sign-in.md) · [Sign-up page](../pages/sign-up.md)

## Implementation status

The `accounts` backend implements the owner-approved account API, custom User,
pending Staff assignments, JWT authentication, and role permissions. Initial
migrations also create the flights and traffic models from [database.md](../database.md).
Only User is registered in the Django admin, including role and promoted_by on
creation and editing, so Django administrators can create initial Heads.

The frontend `/signin` and `/signup` forms still validate locally and stop at
their existing TODO handlers. Home still uses a fixture user. Frontend API wiring,
route guards, profile/password/logout screens, and Head management UI are pending.

## Endpoint contract

All paths below start with `/api/accounts/`. Requests and responses use JSON.
`profile` has exactly `id`, `username`, `email`, `first_name`, `last_name`, and
`role`. A profile response is that object directly; sign-in nests it as `profile`.
Passwords and password hashes are never returned. Protected endpoints require
`Authorization: Bearer <access>`.

| Path | Method | Request fields | Response fields | Access |
|---|---|---|---|---|
| `signup/` | POST | username, email, password; optional first_name, last_name | profile (201) | Public |
| `signin/` | POST | identifier (username or email), password | access, refresh, profile | Public |
| `token/refresh/` | POST | refresh | access, refresh | Valid refresh token |
| `logout/` | POST | refresh | detail | Authenticated token owner |
| `profile/` | GET | none | profile | Signed-in user |
| `profile/` | PATCH | Any of first_name, last_name, username, email | profile | Signed-in user |
| `password/change/` | POST | current_password, new_password | detail | Signed-in user |
| `staff/assign/` | POST | email | detail | Head |
| `heads/promote/` | POST | email | detail | Head; target must be Staff |
| `heads/remove/` | POST | email, role (`staff` or `traveler`) | detail | Head; self or Head they promoted |
| `staff/revoke/` | POST | email | detail | Head; existing Staff or pending assignment |

Success responses use 200 except sign-up (201). Invalid fields and invalid role
transitions return 400. Missing/invalid authentication returns 401. Authenticated
callers without required permissions return 403. Revoking an unknown pending
email returns 404. Management responses include only `detail`, without profile
fields. Requests containing unsupported or read-only account fields return 400.

## Authentication and passwords

Access tokens last **15 minutes**, refresh tokens **7 days**. Refresh rotates the
refresh token, blacklists the replaced token, and returns both new tokens. Store
the new refresh token after each refresh. Logout verifies refresh-token ownership
before blacklisting. Existing access tokens continue until their expiration.
Password change does not blacklist existing tokens.

Sign-in accepts either the unique username or email in `identifier`; wrong
username, email, password, and inactive accounts receive the same 401 message:
`Invalid username/email or password.` No inactive account can authenticate.
Successful sign-in updates `last_login`. Identity matching uses stored values;
an identifier matching two different accounts fails with the generic error.

Django's default password validators run on sign-up and password change, using
the user's profile for similarity checks. Validation messages are returned under
`password` or `new_password`. Password change also requires the correct current
password. Password fields are write-only and hashed using Django's password API.

## Roles and privacy

- Public sign-up rejects `role` and `promoted_by` with 400, even if null. It creates
  a Traveler unless the email has a pending Staff assignment. Applying that
  assignment, creating the Staff account, and deleting the pending row occur in
  one transaction.
- A Head assigns Staff by email. An existing Traveler becomes Staff immediately,
  with no pending row. Existing Staff/Heads remain unchanged with a clear result
  message. Otherwise a unique pending assignment is created; repeating it is a
  no-op. Revocation deletes a pending row or returns existing Staff to Traveler.
- Only Staff can be promoted to Head. `promoted_by` records the acting Head.
  Initial Heads are created by Django administrators with an empty promoter.
- A Head can remove themselves or a Head they promoted, choosing Staff or
  Traveler. The promoter link is cleared. A Head cannot remove their own promoter,
  another Head's promoted Head, or another administrator-created Head.
- Django administrators handle administrator-only removals through Django admin.
  Management API access always requires the Head application role; `is_staff`
  and `is_superuser` alone do not grant it.
- Role removal never deletes accounts or changes Heads the removed Head promoted.
  Role updates are transactional, lock affected users, and recheck the acting
  Head's current role. JWT authentication reads the current user from the database.
- `IsStaffOrHead` admits both Staff and Heads for future protected Staff endpoints;
  Travelers are denied. Only authenticated Heads can use management endpoints.
- Profile endpoints always operate on the signed-in user. Role, promoter, password,
  and another user's ID cannot be set through profile updates. Management accepts
  the target email and returns only a result message.

## Verification

Run `python -m pytest` from `backend/`. Tests use PostgreSQL's separate test
database and cover sign-up/password validation, assignment consumption and
rollback, sign-in, token lifetimes/rotation/logout ownership, profile privacy,
password changes, authorization, Head removal chains, Staff access, admin
registration, protected deletion, and database constraints.

Frontend behavior remains covered separately by the existing frontend tests;
backend tests do not establish frontend authentication integration.
