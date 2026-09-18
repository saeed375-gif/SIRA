-- Security hardening after Supabase advisor review.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
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
set search_path = public
as $$
  select value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';
$$;

create or replace function public.sync_place_location()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if new.latitude is null or new.longitude is null then
    new.location = null;
  else
    new.location = extensions.st_setsrid(extensions.st_makepoint(new.longitude, new.latitude), 4326)::extensions.geography;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(text) from public, anon, authenticated;
revoke execute on function public.has_any_role(text[]) from public, anon, authenticated;
