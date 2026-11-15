# Accounts and access

[Documentation index](../README.md) · [Sign-in page](../pages/sign-in.md) · [Sign-up page](../pages/sign-up.md)

## Purpose and implementation status

The planned accounts feature covers registration, sign-in, profiles, logout and Traveler/Staff/Head access. The intended backend owner is accounts.

Today only /signin and /signup forms are implemented. They validate client input, display linked errors and focus the first invalid field. AuthLayout, AuthField and Brand provide shared UI. There are no account endpoints, custom user model, tokens, sessions, route guards, profile page or logout action.

Valid form submissions stop at TODO comments. Sign-in does not redirect to /home; Home uses a fixture user and can be opened directly. See the page guides for exact validation messages and the difference in error clearing between the forms.

## Planned role rules

The following requirements come from the current [PRODUCT](../../PRODUCT.md) and [CODING_STANDARDS](../../CODING_STANDARDS.md); they are not implemented:

- Public sign-up offers no Staff/Head selector. Users without a prior Staff assignment register as Travelers; a previously assigned email receives Staff access.
- Django administrators create initial Heads. Heads retain Staff access and can assign Staff access by email before or after an account exists.
- Heads can promote Staff to Head and revoke Staff access back to Traveler.
- Heads can remove Head access from themselves or Heads they promoted, but cannot remove the Head who promoted them.
- Administrator-created Heads can have Head access removed only by the administrator or themselves.
- Removing Head access returns the user to Staff. Fully revoking Staff access returns the user to Traveler.
- Removing a Head does not affect Heads they promoted. Role changes do not delete accounts.

The Head management interface is planned; no route is registered.

## Backend integration work

Authentication is planned to use tokens, with Django password hashing and permission checks on protected backend endpoints as well as frontend pages. The JWT library and API contracts remain TBD.

The [database specification](../database.md) still describes the older Head/HR position rules and administrator-created Staff. It must be reconciled with the requirements above before account model/permission implementation. This guide does not prescribe replacement schema fields.

Frontend form checks are not server validation or authorization. Tests exercise only local form behavior; see [frontend test coverage](../frontend.md#commands-and-tests).
