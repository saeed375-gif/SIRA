# Sira — Correct Frontend + Supabase Integration

> Post-deployment reliability update: the invalid Google Maps key implementation was replaced with a key-free Leaflet/OpenStreetMap map while preserving the Sira markers, routes and interactions.

This integration was performed on the exact archive uploaded in the latest turn: `سيرة-_-sira (1).zip`.

## Frontend preservation

The following files were not modified during the database integration:

- `src/components/JerusalemMap.tsx`
- `src/index.css`
- `src/views/HomeView.tsx`
- `src/views/ExploreView.tsx`
- `src/views/PlaceDetailView.tsx`
- `src/views/RouteDetailView.tsx`

`JerusalemMap.tsx` SHA-256 before and after integration:

`6f61a3be51cf6836ec8104aa3b0948d6c8c7b4318010d34d5ede634dcfa552de`

The Google Maps implementation, styling, markers and interaction logic are therefore the original uploaded implementation.

## Added architecture

- Existing React/Vite frontend
- Express API under `server/`
- Supabase/PostgreSQL backend
- PostGIS and pg_trgm
- Row Level Security
- Storage bucket migrations
- Search and nearby-place database functions
- Places/categories/content/timeline/media/life/routes/challenges/favorites/progress schema
- 13 reproducible migrations under `supabase/migrations/`

## Supabase project

- Project name: Sira
- Project ref: `xgzjopqfucdcmktlufpt`
- Region: `eu-central-1`
- Status at integration time: ACTIVE_HEALTHY

The project `.env` contains only the browser-safe Google Maps key already present in the uploaded project and the Supabase publishable key. The Supabase service-role secret is intentionally not included.

## Compatibility layer

The current frontend uses stable internal IDs like `p-1` through `p-6` across map markers, daily-life content, route stops and challenge choices. Supabase uses UUID primary keys.

To avoid breaking the frontend, `src/services/siraData.ts` maps database places by `slug`, lets Supabase control which places are published and their geographic coordinates, but preserves the existing frontend IDs and presentation objects.

This allows database migration to proceed safely without redesigning or replacing the frontend.

## Verification completed

- TypeScript: passed
- Production Vite build: passed
- Static integration checks: passed
- Express `/api/health`: passed
- Vite frontend HTTP: 200
- Vite `/api` proxy to Express: passed
- Map source hash: unchanged

## Run

```bash
npm ci
npm run dev
```

Then open the Vite URL shown in the terminal, normally `http://localhost:3000`.

API health is available at:

`http://localhost:8787/api/health`
