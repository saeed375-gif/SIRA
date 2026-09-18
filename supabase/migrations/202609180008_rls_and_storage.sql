-- RLS: public published reads, user-owned state, editor drafts, admin full control
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.places enable row level security;
alter table public.categories enable row level security;
alter table public.place_categories enable row level security;
alter table public.content_blocks enable row level security;
alter table public.sources enable row level security;
alter table public.content_block_sources enable row level security;
alter table public.place_sources enable row level security;
alter table public.timeline_events enable row level security;
alter table public.life_stories enable row level security;
alter table public.jerusalem_moments enable row level security;
alter table public.people_stories enable row level security;
alter table public.related_places enable row level security;
alter table public.media enable row level security;
alter table public.life_story_sources enable row level security;
alter table public.moment_sources enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_options enable row level security;
alter table public.favorites enable row level security;
alter table public.user_place_progress enable row level security;
alter table public.user_route_progress enable row level security;
alter table public.challenge_attempts enable row level security;

-- Published public content
create policy "public read published places" on public.places for select using (status='published');
create policy "public read active categories" on public.categories for select using (is_active);
create policy "public read published place categories" on public.place_categories for select using (
  exists(select 1 from public.places p where p.id=place_id and p.status='published')
);
create policy "public read published content blocks" on public.content_blocks for select using (status='published');
create policy "public read published sources" on public.sources for select using (status='published');
create policy "public read published block sources" on public.content_block_sources for select using (
  exists(select 1 from public.content_blocks cb where cb.id=content_block_id and cb.status='published')
);
create policy "public read published place sources" on public.place_sources for select using (
  exists(select 1 from public.places p where p.id=place_id and p.status='published')
);
create policy "public read published timeline" on public.timeline_events for select using (status='published');
create policy "public read published life stories" on public.life_stories for select using (status='published');
create policy "public read published moments" on public.jerusalem_moments for select using (status='published');
create policy "public read published people stories" on public.people_stories for select using (status='published');
create policy "public read related places" on public.related_places for select using (
  exists(select 1 from public.places p where p.id=place_id and p.status='published') and
  exists(select 1 from public.places p where p.id=related_place_id and p.status='published')
);
create policy "public read published media" on public.media for select using (status='published');
create policy "public read life story sources" on public.life_story_sources for select using (
  exists(select 1 from public.life_stories ls where ls.id=life_story_id and ls.status='published')
);
create policy "public read moment sources" on public.moment_sources for select using (
  exists(select 1 from public.jerusalem_moments m where m.id=moment_id and m.status='published')
);
create policy "public read published routes" on public.routes for select using (status='published');
create policy "public read published route stops" on public.route_stops for select using (
  exists(select 1 from public.routes r where r.id=route_id and r.status='published')
);
create policy "public read published challenges" on public.challenges for select using (status='published');
-- Deliberately no anonymous/authenticated SELECT policy on challenge_options: is_correct must never leak.

-- User-owned state
create policy "users read own profile" on public.profiles for select to authenticated using (id=auth.uid() or public.has_role('admin'));
create policy "users update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "users read own roles" on public.user_roles for select to authenticated using (user_id=auth.uid() or public.has_role('admin'));
create policy "users manage own favorites" on public.favorites for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "users manage own place progress" on public.user_place_progress for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "users manage own route progress" on public.user_route_progress for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "users read own attempts" on public.challenge_attempts for select to authenticated using (user_id=auth.uid());

-- Editorial read access to drafts/review content
create policy "staff read all places" on public.places for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all content blocks" on public.content_blocks for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all sources" on public.sources for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all timeline" on public.timeline_events for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all life" on public.life_stories for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all moments" on public.jerusalem_moments for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all people stories" on public.people_stories for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all media" on public.media for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all routes" on public.routes for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all challenges" on public.challenges for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read challenge options" on public.challenge_options for select to authenticated using (public.has_any_role(array['admin','editor','reviewer']));

-- Editor can create/update non-published content. Admin write access is unrestricted.
create policy "editor create places" on public.places for insert to authenticated with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update places" on public.places for update to authenticated using (public.has_role('editor')) with check (status in ('draft','review','archived'));
create policy "admin manage places" on public.places for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "editor create blocks" on public.content_blocks for insert to authenticated with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update blocks" on public.content_blocks for update to authenticated using (public.has_role('editor')) with check (status in ('draft','review','archived'));
create policy "admin manage blocks" on public.content_blocks for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "editor create timeline" on public.timeline_events for insert to authenticated with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update timeline" on public.timeline_events for update to authenticated using (public.has_role('editor')) with check (status in ('draft','review','archived'));
create policy "admin manage timeline" on public.timeline_events for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "editor create life" on public.life_stories for insert to authenticated with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update life" on public.life_stories for update to authenticated using (public.has_role('editor')) with check (status in ('draft','review','archived'));
create policy "admin manage life" on public.life_stories for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "editor create moments" on public.jerusalem_moments for insert to authenticated with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update moments" on public.jerusalem_moments for update to authenticated using (public.has_role('editor')) with check (status in ('draft','review','archived'));
create policy "admin manage moments" on public.jerusalem_moments for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "editor create routes" on public.routes for insert to authenticated with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update routes" on public.routes for update to authenticated using (public.has_role('editor')) with check (status in ('draft','review','archived'));
create policy "admin manage routes" on public.routes for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "editor create challenges" on public.challenges for insert to authenticated with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update challenges" on public.challenges for update to authenticated using (public.has_role('editor')) with check (status in ('draft','review','archived'));
create policy "admin manage challenges" on public.challenges for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admin manage challenge options" on public.challenge_options for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "editor manage challenge options" on public.challenge_options for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));

-- Generic admin control for supporting relational tables.
create policy "admin manage categories" on public.categories for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admin manage place categories" on public.place_categories for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admin manage sources" on public.sources for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "editor manage sources" on public.sources for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "admin manage source links" on public.content_block_sources for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admin manage place sources" on public.place_sources for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admin manage relations" on public.related_places for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admin manage route stops" on public.route_stops for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admin manage media" on public.media for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "editor manage media" on public.media for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Storage buckets. Public visual/audio buckets are readable; source documents stay private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('place-media','place-media',true,15728640,array['image/jpeg','image/png','image/webp','video/mp4']),
  ('audio-stories','audio-stories',true,52428800,array['audio/mpeg','audio/wav','audio/ogg','audio/mp4']),
  ('route-media','route-media',true,15728640,array['image/jpeg','image/png','image/webp','video/mp4']),
  ('moment-media','moment-media',true,15728640,array['image/jpeg','image/png','image/webp','audio/mpeg','audio/wav']),
  ('source-documents','source-documents',false,52428800,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public read public sira storage" on storage.objects for select using (bucket_id in ('place-media','audio-stories','route-media','moment-media'));
create policy "staff upload sira storage" on storage.objects for insert to authenticated with check (
  bucket_id in ('place-media','audio-stories','route-media','moment-media','source-documents') and public.has_any_role(array['admin','editor'])
);
create policy "staff update sira storage" on storage.objects for update to authenticated using (
  bucket_id in ('place-media','audio-stories','route-media','moment-media','source-documents') and public.has_any_role(array['admin','editor'])
);
create policy "admin delete sira storage" on storage.objects for delete to authenticated using (
  bucket_id in ('place-media','audio-stories','route-media','moment-media','source-documents') and public.has_role('admin')
);
create policy "staff read private sources" on storage.objects for select to authenticated using (
  bucket_id='source-documents' and public.has_any_role(array['admin','editor','reviewer'])
);
