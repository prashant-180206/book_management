# Shelfwise client

Expo (React Native + Web) frontend for Shelfwise, using Expo Router for
navigation and TanStack React Query for server state. All API access
goes through the Orval-generated hooks in `src/api/generated` — do not
edit that directory by hand or add parallel fetch wrappers.

## Setup

```powershell
npm install
# create .env with:
# EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
npx expo start
```

Press `w` for desktop web, or scan the QR code with Expo Go.

## Scripts

- `npx expo start` — dev server (append `--web` for web-only)
- `npx tsc --noEmit` — typecheck
- `npx expo lint` — lint
- `npm run api:generate` — regenerate the Orval client from the
  running API's `/openapi.json` (start the backend first)

## Screens (`src/app`)

Library (`/`), Discover (`/explore`), genre deep-links (`/shelf/[genre]`
redirect to the matching Explore shelf), My Shelf (`/my-shelf`),
admin analytics (`/analytics`), book detail (`/book/[id]`), sign-in and
sign-up.

Shared pieces live in `src/components` (cards, modals, nav, page shell,
reading-status control) and `src/utils/genres.ts`, which holds the one
genre-matching rule used by shelf counts, shelf listings, analytics,
and the library filter.
