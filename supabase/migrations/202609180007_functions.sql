-- Roles, nearby, database-side search, and safe challenge checking
create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any(required_roles)
  );
$$;

create or replace function public.get_nearby_places(
  latitude double precision,
  longitude double precision,
  radius_meters integer default 1500,
  limit_count integer default 12
)
returns table (
  id uuid,
  slug text,
  name_ar text,
  name_en text,
  short_description_ar text,
  latitude double precision,
  longitude double precision,
  main_image_url text,
  distance_meters double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(longitude, latitude), 4326)::geography as geog
  )
  select
    p.id, p.slug, p.name_ar, p.name_en, p.short_description_ar,
    p.latitude, p.longitude, p.main_image_url,
    st_distance(p.location, origin.geog) as distance_meters
  from public.places p
  cross join origin
  where p.status = 'published'
    and p.location is not null
    and st_dwithin(p.location, origin.geog, greatest(radius_meters, 0))
  order by distance_meters asc
  limit greatest(least(limit_count, 50), 1);
$$;

grant execute on function public.get_nearby_places(double precision,double precision,integer,integer) to anon, authenticated;

create or replace function public.search_sira(
  search_query text,
  limit_count integer default 30,
  offset_count integer default 0
)
returns table (
  result_type text,
  id uuid,
  slug text,
  title_ar text,
  title_en text,
  description_ar text,
  image_url text,
  place_id uuid,
  rank real
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with q as (
    select trim(search_query) as term
  ), results as (
    select 'place'::text as result_type, p.id, p.slug, p.name_ar as title_ar, p.name_en as title_en,
      p.short_description_ar as description_ar, p.main_image_url as image_url, p.id as place_id,
      (greatest(similarity(p.name_ar, q.term), similarity(coalesce(p.name_en,''), q.term)) +
       case when to_tsvector('simple', coalesce(p.name_ar,'') || ' ' || coalesce(p.short_description_ar,'')) @@ plainto_tsquery('simple', q.term) then 1 else 0 end)::real as rank
    from public.places p cross join q
    where p.status = 'published' and q.term <> '' and (
      p.name_ar ilike '%' || q.term || '%' or coalesce(p.name_en,'') ilike '%' || q.term || '%' or
      coalesce(p.short_description_ar,'') ilike '%' || q.term || '%' or
      to_tsvector('simple', coalesce(p.name_ar,'') || ' ' || coalesce(p.short_description_ar,'')) @@ plainto_tsquery('simple', q.term)
    )
    union all
    select 'content'::text, cb.id, p.slug, coalesce(cb.title_ar, p.name_ar), cb.title_en,
      coalesce(cb.excerpt_ar, left(cb.content_ar, 240)), p.main_image_url, cb.place_id,
      (case when coalesce(cb.title_ar,'') ilike '%' || q.term || '%' then 1.2 else 0.6 end)::real
    from public.content_blocks cb join public.places p on p.id = cb.place_id cross join q
    where cb.status='published' and p.status='published' and q.term <> '' and (
      coalesce(cb.title_ar,'') ilike '%' || q.term || '%' or cb.content_ar ilike '%' || q.term || '%' or
      to_tsvector('simple', coalesce(cb.title_ar,'') || ' ' || cb.content_ar) @@ plainto_tsquery('simple', q.term)
    )
    union all
    select 'life_story'::text, ls.id, p.slug, ls.title_ar, ls.title_en,
      coalesce(ls.short_description_ar, left(ls.story_ar,240)), ls.image_url, ls.place_id,
      (case when ls.title_ar ilike '%' || q.term || '%' then 1.2 else 0.6 end)::real
    from public.life_stories ls join public.places p on p.id=ls.place_id cross join q
    where ls.status='published' and p.status='published' and q.term <> '' and (
      ls.title_ar ilike '%' || q.term || '%' or coalesce(ls.short_description_ar,'') ilike '%' || q.term || '%' or ls.story_ar ilike '%' || q.term || '%'
    )
    union all
    select 'moment'::text, m.id, m.slug, m.title_ar, m.title_en, m.description_ar, m.image_url, m.place_id,
      (case when m.title_ar ilike '%' || q.term || '%' then 1.2 else 0.6 end)::real
    from public.jerusalem_moments m cross join q
    where m.status='published' and q.term <> '' and (m.title_ar ilike '%' || q.term || '%' or m.description_ar ilike '%' || q.term || '%')
    union all
    select 'route'::text, r.id, r.slug, r.title_ar, r.title_en, r.description_ar, r.cover_image_url, null::uuid,
      (case when r.title_ar ilike '%' || q.term || '%' then 1.2 else 0.6 end)::real
    from public.routes r cross join q
    where r.status='published' and q.term <> '' and (r.title_ar ilike '%' || q.term || '%' or coalesce(r.description_ar,'') ilike '%' || q.term || '%')
  )
  select * from results
  order by rank desc, title_ar
  limit greatest(least(limit_count, 100), 1)
  offset greatest(offset_count, 0);
$$;

grant execute on function public.search_sira(text,integer,integer) to anon, authenticated;

create or replace function public.submit_challenge_answer(
  challenge_uuid uuid,
  selected_option_uuid uuid default null,
  answer_data jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.challenges%rowtype;
  correct boolean := false;
  earned integer := 0;
begin
  select * into c from public.challenges where id = challenge_uuid and status = 'published';
  if not found then
    raise exception 'Challenge not found';
  end if;

  if c.type in ('multiple_choice','image_choice') then
    select coalesce(is_correct,false) into correct
    from public.challenge_options
    where id = selected_option_uuid and challenge_id = c.id;
    correct := coalesce(correct,false);
  else
    -- Non-choice validation can be extended per challenge type. Do not trust client correctness.
    correct := false;
  end if;

  if correct then earned := c.points; end if;

  if auth.uid() is not null then
    insert into public.challenge_attempts(user_id, challenge_id, selected_option_id, answer_payload, is_correct, points_earned)
    values(auth.uid(), c.id, selected_option_uuid, answer_data, correct, earned);
  end if;

  return jsonb_build_object(
    'isCorrect', correct,
    'pointsEarned', earned,
    'explanationAr', c.explanation_ar,
    'explanationEn', c.explanation_en
  );
end;
$$;

grant execute on function public.submit_challenge_answer(uuid,uuid,jsonb) to anon, authenticated;

create or replace function public.get_public_challenge(challenge_uuid uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', c.id,
    'place_id', c.place_id,
    'route_id', c.route_id,
    'type', c.type,
    'question_ar', c.question_ar,
    'question_en', c.question_en,
    'points', c.points,
    'difficulty', c.difficulty,
    'sort_order', c.sort_order,
    'options', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id,
        'text_ar', o.text_ar,
        'text_en', o.text_en,
        'image_url', o.image_url,
        'value', o.value,
        'sort_order', o.sort_order
      ) order by o.sort_order, o.created_at)
      from public.challenge_options o
      where o.challenge_id = c.id
    ), '[]'::jsonb)
  )
  from public.challenges c
  where c.id = challenge_uuid and c.status='published';
$$;

grant execute on function public.get_public_challenge(uuid) to anon, authenticated;
