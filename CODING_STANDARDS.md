# CODING_STANDARDS

This file tells Codex how to write code in this project.
Follow `PROMPTING_RULES.md` for how to handle requests, and ask the owner whenever a standard here does not cover the situation.

**Stack:** Django + PostgreSQL. Frontend and API layer (for example React + Django REST Framework): TBD until confirmed by the project owner.

---

## Readability first

- Write code that explains itself through clear names and small functions.
- Prefer simple and obvious over clever and short.
- One function does one job. If a function needs a long explanation, split it.
- Avoid deep nesting. Use early returns to keep the main path flat.
- Remove dead code, unused imports, and leftover debug output (`print`, `console.log`) before finishing.

## Naming

| Item | Style | Example |
|---|---|---|
| Python variables, functions | `snake_case` | `get_pending_requests` |
| Python classes, Django models | `PascalCase` | `ServiceRequest` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE` |
| Files and modules | `snake_case` | `request_views.py` |
| JS/React variables, functions | `camelCase` | `fetchRequests` |
| React components | `PascalCase` | `RequestList` |

- Names must describe purpose. Avoid `data`, `temp`, `x`, `obj`, `stuff`.
- Booleans read like questions: `is_active`, `has_permission`.
- Do not use unclear abbreviations.

## Comments: only where needed

Default is **no comment**. Good names and structure should make code clear.

Add a comment only when:

- The logic is confusing or non-obvious.
- There is a business rule that cannot be seen from the code.
- A workaround exists and the reason would otherwise be lost.
- A decision looks wrong but is intentional.

Comments explain **why**, not **what**.

```python
# Bad: repeats the code
# Loop through users
for user in users:
    ...

# Good: explains a reason
# Staff accounts are excluded because they are managed in a separate report.
active_users = users.filter(is_staff=False)
```

- Do not comment every line, every function, or every import.
- Do not leave commented-out code.
- Keep comments short and up to date. Delete a comment if the code changes and it no longer applies.
- Docstrings are for public functions or classes whose purpose is not obvious from the name.

## Python / Django

- Follow PEP 8. Keep lines at a readable length.
- Keep views thin. Put business logic in services or model methods, not in views or templates.
- Use Django's ORM. Do not write raw SQL unless there is a clear reason, and explain that reason.
- Use `select_related` and `prefetch_related` to avoid repeated queries in loops.
- Validate input in forms or serializers, not scattered across views.
- Always use migrations for schema changes. Never edit the database by hand. Never rewrite or delete an applied migration without asking.
- Use `get_object_or_404` instead of unguarded `.get()` in views.
- Check permissions on every view that touches protected data.
- Handle expected errors with specific exceptions. Never use a bare `except:`.
- Use type hints on new functions when they add clarity.

## Frontend (TBD until the stack is confirmed)

- Use small, reusable components with a single purpose.
- Keep API calls in one dedicated place, not scattered through components.
- Do not hardcode URLs or ports. Read them from configuration.
- Handle loading and error states.

## Configuration and secrets

- Never hardcode secrets, passwords, API keys, or database credentials.
- Read them from environment variables (`.env`), and keep `.env` out of version control.
- When a new variable is needed, add it to `.env.example` with a placeholder value and tell the owner.
- Do not invent values for variables. Use `TBD` or ask.

## Database (PostgreSQL)

- Use clear, singular model names and descriptive field names.
- Set sensible field constraints (`null`, `blank`, `unique`, `max_length`) on purpose, not by default.
- Add indexes only when there is a reason.
- Never run destructive operations (drop, truncate, bulk delete) without explicit approval.

## Security

- Never trust user input. Validate and sanitize it.
- Do not disable CSRF protection or other built-in safeguards to make something work.
- Do not expose stack traces or secrets to users.
- Keep `DEBUG` off outside local development.

## Testing

- Add or update tests for any behavior you change or add.
- Test names describe the behavior: `test_staff_cannot_delete_request`.
- Run the tests before reporting that work is done. If you cannot run them, say so.

## Git and change hygiene

- Keep changes small and focused on one purpose.
- Use clear commit messages in the imperative form: `Add request status filter`.
- Do not commit generated files, virtual environments, or `.env`.

## Before you finish

- [ ] Code is readable, with comments only where the logic is confusing.
- [ ] No secrets or hardcoded config values.
- [ ] No unused code, imports, or debug output.
- [ ] Tests were added or updated, and run (or I said I could not run them).