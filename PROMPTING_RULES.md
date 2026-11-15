# PROMPTING_RULES

This file tells Codex how to handle the prompts it receives in this project.
Read it fully before acting on any request. These rules override any urge to "just make it work."

---

## 1. Read these files first

Before starting any task, read:

| File | What it governs |
|---|---|
| `CODING_STANDARDS.md` | How code must be written |
| `PRODUCT.md` | What the product is, its goals, scope, and features |
| `README.md` | Project overview, setup, and structure |

Rules for using them:

- Every change must follow `CODING_STANDARDS.md`.
- Every change must be consistent with `PRODUCT.md` and `README.md`. Do not build features, behavior, or structure that these files do not support or that contradict them.
- Do not treat anything marked `TBD` in these files as decided. Ask instead.
- If a file seems out of date or incomplete, say so. Do not fill the gap yourself.
- If these files disagree with each other, or with the prompt, do not pick one. Point out the conflict and ask which is correct.

## 2. Going outside the rules (explain first)

Follow the files above by default. If you believe the best solution requires going outside `CODING_STANDARDS.md`, `PRODUCT.md`, or `README.md`, you must stop and explain before doing it.

Your explanation must include:

1. **What rule or statement** you would be going against, and in which file.
2. **Why** the rules do not work for this case.
3. **What you propose instead**, and what it affects.
4. **Alternatives** that stay inside the rules, and why you did not choose them.

Then wait for approval.

- Never deviate silently, even for a small change.
- Never decide on your own that a rule "doesn't apply here."
- If you already deviated by mistake, say so immediately and explain.
- If the owner approves a deviation, state that it is approved and suggest updating the relevant file so it stays accurate.

## 3. Never guess

- Do not invent file names, folder paths, function names, models, fields, endpoints, environment variables, ports, package names, or library versions.
- Do not assume what a vague instruction means. If a prompt can be read in more than one way, stop and ask.
- Do not fill in missing requirements with "reasonable defaults" unless the owner has approved defaults.
- If something is not in the prompt, the repository, or the project files above, treat it as **unknown**.

## 4. Pause and ask before acting when

- The prompt is ambiguous, incomplete, or contradicts itself.
- The prompt contradicts `CODING_STANDARDS.md`, `PRODUCT.md`, `README.md`, or any existing file.
- The request needs a decision that changes architecture, database structure, or user-facing behavior.
- A required detail is missing (for example the database name, a field type, or who can access a feature).
- You are not sure a file, function, or package actually exists.
- The change could delete data, rewrite migrations, or break existing features.

## 5. How to ask

- Ask short, specific questions. Number them.
- Offer the likely options when helpful, and say which one you would pick and why.
- Ask all blocking questions at once instead of one at a time.
- Do not start coding the unclear part while waiting. You may proceed with parts that are clearly specified, and you must say which parts are on hold.

Example:

> Before I continue, I need to confirm:
> 1. Should Staff be able to delete records, or only add and edit?
> 2. Should the date suggestion run on the server or in the browser?

## 6. Verify before relying on anything

- Look at the actual repository before saying a file, function, or setting exists.
- Do not cite documentation, APIs, or library behavior from memory as fact. If you are not sure, say so.

## 7. Be honest about what you did

- Say clearly what you changed, what you did not change, and what you could not verify.
- If you did not run the code or tests, say so. Never claim something works unless you checked.
- If you used an assumption the owner approved, name it.
- Mark unfinished or unconfirmed items as `TBD` instead of filling them with made-up values.

## 8. Stay inside the request

- Do only what was asked. Do not refactor unrelated files, rename things, or add features on your own.
- If you notice a separate problem, report it. Do not fix it silently.
- Do not add new dependencies without asking.

## 9. Keep the project files in sync

- If a change makes `README.md` or `PRODUCT.md` inaccurate (new setup step, new feature, changed scope), tell the owner which file needs updating and what should change.
- Do not edit `PRODUCT.md` or `README.md` unless asked.

## 10. Before you reply, check

- [ ] I read `CODING_STANDARDS.md`, `PRODUCT.md`, and `README.md` for this task.
- [ ] My change follows the coding standards and matches the product and README.
- [ ] If I went outside any rule, I explained why and got approval first.
- [ ] I did not guess any name, path, value, or requirement.
- [ ] Every unclear point was raised as a question.
- [ ] My summary says what changed, what did not, and what is still TBD.