# Build Your Own FPV — Premium Foundation v2

This package is the first production-oriented rebuild of the original FPV Drone Builder.

## What changed

- One shared catalog of **131 components** for frontend and backend.
- Motor price, weight and thrust are calculated for four motors.
- New compatibility engine with structured PASS / WARNING / FAIL findings.
- Smart auto-build endpoint that scores the complete configuration instead of choosing the cheapest item in every category.
- Premium responsive interface for desktop and mobile.
- Live 3D model that adapts to frame size, battery, video system, ducts and payload.
- Persistent build storage in `data/builds.json`.
- Request validation, API rate limiting, restricted CORS and Content Security Policy.
- Installable PWA foundation.
- Automated compatibility tests.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
npm run check
```

## Environment

Copy `.env.example` values into your hosting environment. On Render, update:

- `SITE_URL`
- `ALLOWED_ORIGINS`
- Create or replace `support@buildyourownfpv.com` before public launch.

## Important production limitation

`data/builds.json` is intentionally a transitional storage layer. Render's ephemeral filesystem can be reset. Before public accounts and mobile apps, replace this store with PostgreSQL/Supabase and add user authentication.

## Recommended next phase

1. PostgreSQL schema and authentication.
2. Admin catalog panel with verified specifications and local licensed product images.
3. Real GLB models for popular frames and components.
4. User profiles, public builds and comments.
5. React Native / Expo mobile app using the same API and compatibility engine.
