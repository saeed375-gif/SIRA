# Sira Supabase integration

- Project: `Sira`
- Region: `eu-central-1`
- Public runtime reads: Supabase RLS-protected API through the local Express server.
- Frontend design: preserved.
- `src/components/JerusalemMap.tsx`: not modified by this integration.
- Google Maps key/implementation: preserved from the uploaded project.
- Core places are stored in Supabase and are overlaid onto the exact frontend models by slug.
- Existing frontend IDs are intentionally preserved to avoid breaking routes, daily-life stories, challenge choices and map interactions.
- Full normalized schema and migrations live in `supabase/migrations/`.

## Important

The service-role secret is not included. Public browsing does not need it. Privileged admin/storage operations require adding `SUPABASE_SERVICE_ROLE_KEY` server-side only.
