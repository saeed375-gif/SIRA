-- Run after migrations/seed against a disposable/local Supabase database.
-- These checks fail fast if key integrity/security assumptions are not present.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','user_roles','places','categories','place_categories','content_blocks','sources',
    'content_block_sources','place_sources','timeline_events','life_stories','jerusalem_moments',
    'people_stories','related_places','media','routes','route_stops','challenges','challenge_options',
    'favorites','user_place_progress','user_route_progress','challenge_attempts'
  ] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=table_name and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_proc where proname='get_nearby_places') then raise exception 'get_nearby_places missing'; end if;
  if not exists (select 1 from pg_proc where proname='search_sira') then raise exception 'search_sira missing'; end if;
  if not exists (select 1 from pg_proc where proname='submit_challenge_answer') then raise exception 'submit_challenge_answer missing'; end if;
  if not exists (select 1 from pg_proc where proname='get_public_challenge') then raise exception 'get_public_challenge missing'; end if;
end $$;

-- Coordinates must be protected at database level.
do $$
begin
  begin
    insert into public.places(slug,name_ar,latitude,longitude,status)
    values('invalid-coordinate-check','اختبار',100,35,'draft');
    raise exception 'latitude constraint did not reject invalid value';
  exception when check_violation then
    null;
  end;
end $$;

-- No public/anon SELECT policy may expose challenge_options (especially is_correct).
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='challenge_options' and cmd='SELECT'
      and ('public'=any(roles) or 'anon'=any(roles))
  ) then
    raise exception 'challenge_options has a public/anon SELECT policy';
  end if;
end $$;
