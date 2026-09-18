-- Sira | core extensions and reusable helpers
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slug_is_valid(value text)
returns boolean
language sql
immutable
as $$
  select value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';
$$;
