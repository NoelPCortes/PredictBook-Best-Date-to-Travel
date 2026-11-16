# Architecture

## What runs today

PredictBook currently has a React/TypeScript frontend and a scaffolded Django backend configured for PostgreSQL. The frontend pages are not connected to Django.

~~~text
index.html
  -> src/main.tsx (global styles and React root)
  -> src/App.tsx (BrowserRouter)
  -> page in src/pages/
  -> shared components + local state/sample constants
~~~

Typing, validation, date selection and route swapping happen in the browser. No implemented page calls an API or writes application data to storage. Reloading/remounting resets local state, including the Home selection to January 14.

Sign-in and sign-up forms stop after client validation. Home is accessible directly without a session. Its user, crowd levels, searches and booking information are fixtures.

## Intended integration

The planned flow is React -> Django REST Framework -> PostgreSQL. Django will validate requests and permissions, query models, calculate crowd forecasts from historical data, and return responses to the frontend. The prediction feature is backend logic, not an AI model.

Business endpoints, token handling, model implementation, prediction thresholds and dataset selection remain unfinished. API paths and response formats are TBD; these docs do not define them.

See [backend status](backend.md), [database specification](database.md), and [known specification gaps](README.md#known-documentation-gaps).

## How the screens connect

- Landing links to sign-in.
- Sign-in links to sign-up and back to Landing through the brand.
- Sign-up links to sign-in and back to Landing through the brand.
- Home has its own navbar: the brand/Home links target /home and Traffic Calendar targets the unimplemented /calendar route.
- Valid credential forms currently have no redirect to Home.

There is no account menu, real search history, booking-details navigation, or Staff/Head management interface.
