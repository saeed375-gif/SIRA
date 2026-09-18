-- Query, filtering and search indexes
create index if not exists idx_places_status on public.places(status);
create index if not exists idx_places_featured on public.places(featured) where featured = true;
create index if not exists idx_places_location on public.places using gist(location);
create index if not exists idx_places_name_ar_trgm on public.places using gin (name_ar extensions.gin_trgm_ops);
create index if not exists idx_places_name_en_trgm on public.places using gin (name_en extensions.gin_trgm_ops);
create index if not exists idx_places_search_tsv on public.places using gin (
  to_tsvector('simple', coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' || coalesce(short_description_ar,'') || ' ' || coalesce(short_description_en,''))
);
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_content_blocks_place on public.content_blocks(place_id, sort_order);
create index if not exists idx_content_blocks_status on public.content_blocks(status);
create index if not exists idx_content_blocks_search_tsv on public.content_blocks using gin (
  to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' || coalesce(content_ar,'') || ' ' || coalesce(content_en,''))
);
create index if not exists idx_sources_title_trgm on public.sources using gin (title extensions.gin_trgm_ops);
create index if not exists idx_timeline_place on public.timeline_events(place_id, sort_order);
create index if not exists idx_life_place on public.life_stories(place_id, sort_order);
create index if not exists idx_life_status on public.life_stories(status);
create index if not exists idx_life_search_tsv on public.life_stories using gin (
  to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' || coalesce(short_description_ar,'') || ' ' || coalesce(story_ar,''))
);
create index if not exists idx_moments_place on public.jerusalem_moments(place_id, sort_order);
create index if not exists idx_moments_status on public.jerusalem_moments(status);
create index if not exists idx_moments_search_tsv on public.jerusalem_moments using gin (
  to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' || coalesce(description_ar,''))
);
create index if not exists idx_related_places_place on public.related_places(place_id, sort_order);
create index if not exists idx_routes_status on public.routes(status);
create index if not exists idx_routes_featured on public.routes(featured) where featured = true;
create index if not exists idx_routes_search_tsv on public.routes using gin (
  to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' || coalesce(description_ar,''))
);
create index if not exists idx_route_stops_route on public.route_stops(route_id, sort_order, stop_number);
create index if not exists idx_challenges_place on public.challenges(place_id, sort_order);
create index if not exists idx_challenges_route on public.challenges(route_id, sort_order);
create index if not exists idx_challenge_options_challenge on public.challenge_options(challenge_id, sort_order);
create index if not exists idx_media_place on public.media(place_id, sort_order);
create index if not exists idx_media_content_block on public.media(content_block_id, sort_order);
create index if not exists idx_media_life_story on public.media(life_story_id, sort_order);
create index if not exists idx_media_moment on public.media(moment_id, sort_order);
create index if not exists idx_media_route on public.media(route_id, sort_order);
create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_user_place_progress_user on public.user_place_progress(user_id);
create index if not exists idx_user_route_progress_user on public.user_route_progress(user_id);
create index if not exists idx_challenge_attempts_user on public.challenge_attempts(user_id, created_at desc);
