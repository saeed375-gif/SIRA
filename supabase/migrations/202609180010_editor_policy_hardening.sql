-- Harden editorial policies so an editor cannot bypass the Draft -> Review -> Admin publish workflow.

drop policy if exists "editor manage sources" on public.sources;
create policy "editor create sources" on public.sources for insert to authenticated
  with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update sources" on public.sources for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));

drop policy if exists "editor manage media" on public.media;
create policy "editor create media" on public.media for insert to authenticated
  with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update media" on public.media for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));

create policy "editor create people stories" on public.people_stories for insert to authenticated
  with check (public.has_role('editor') and status in ('draft','review'));
create policy "editor update people stories" on public.people_stories for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));
create policy "admin manage people stories" on public.people_stories for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- Editors can maintain relationships only while the parent content is not published.
create policy "editor manage place categories" on public.place_categories for all to authenticated
  using (public.has_role('editor') and exists(select 1 from public.places p where p.id=place_id and p.status <> 'published'))
  with check (public.has_role('editor') and exists(select 1 from public.places p where p.id=place_id and p.status <> 'published'));
create policy "editor manage block sources" on public.content_block_sources for all to authenticated
  using (public.has_role('editor') and exists(select 1 from public.content_blocks cb where cb.id=content_block_id and cb.status <> 'published'))
  with check (public.has_role('editor') and exists(select 1 from public.content_blocks cb where cb.id=content_block_id and cb.status <> 'published'));
create policy "editor manage place sources" on public.place_sources for all to authenticated
  using (public.has_role('editor') and exists(select 1 from public.places p where p.id=place_id and p.status <> 'published'))
  with check (public.has_role('editor') and exists(select 1 from public.places p where p.id=place_id and p.status <> 'published'));
create policy "editor manage relations" on public.related_places for all to authenticated
  using (public.has_role('editor') and exists(select 1 from public.places p where p.id=place_id and p.status <> 'published'))
  with check (public.has_role('editor') and exists(select 1 from public.places p where p.id=place_id and p.status <> 'published'));
create policy "editor manage route stops" on public.route_stops for all to authenticated
  using (public.has_role('editor') and exists(select 1 from public.routes r where r.id=route_id and r.status <> 'published'))
  with check (public.has_role('editor') and exists(select 1 from public.routes r where r.id=route_id and r.status <> 'published'));
create policy "editor manage life source links" on public.life_story_sources for all to authenticated
  using (public.has_role('editor') and exists(select 1 from public.life_stories s where s.id=life_story_id and s.status <> 'published'))
  with check (public.has_role('editor') and exists(select 1 from public.life_stories s where s.id=life_story_id and s.status <> 'published'));
create policy "editor manage moment source links" on public.moment_sources for all to authenticated
  using (public.has_role('editor') and exists(select 1 from public.jerusalem_moments m where m.id=moment_id and m.status <> 'published'))
  with check (public.has_role('editor') and exists(select 1 from public.jerusalem_moments m where m.id=moment_id and m.status <> 'published'));

create policy "admin manage life source links" on public.life_story_sources for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admin manage moment source links" on public.moment_sources for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- Uploaded objects are immutable for editors after creation; replacing/deleting a published asset is admin-only.
drop policy if exists "staff update sira storage" on storage.objects;
create policy "admin update sira storage" on storage.objects for update to authenticated using (
  bucket_id in ('place-media','audio-stories','route-media','moment-media','source-documents') and public.has_role('admin')
) with check (
  bucket_id in ('place-media','audio-stories','route-media','moment-media','source-documents') and public.has_role('admin')
);

-- Existing publishable tables: an editor cannot modify or archive a record once it is published.
drop policy if exists "editor update places" on public.places;
create policy "editor update places" on public.places for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));
drop policy if exists "editor update blocks" on public.content_blocks;
create policy "editor update blocks" on public.content_blocks for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));
drop policy if exists "editor update timeline" on public.timeline_events;
create policy "editor update timeline" on public.timeline_events for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));
drop policy if exists "editor update life" on public.life_stories;
create policy "editor update life" on public.life_stories for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));
drop policy if exists "editor update moments" on public.jerusalem_moments;
create policy "editor update moments" on public.jerusalem_moments for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));
drop policy if exists "editor update routes" on public.routes;
create policy "editor update routes" on public.routes for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));
drop policy if exists "editor update challenges" on public.challenges;
create policy "editor update challenges" on public.challenges for update to authenticated
  using (public.has_role('editor') and status <> 'published')
  with check (public.has_role('editor') and status in ('draft','review','archived'));

drop policy if exists "editor manage challenge options" on public.challenge_options;
create policy "editor manage challenge options" on public.challenge_options for all to authenticated
  using (public.has_role('editor') and exists(select 1 from public.challenges c where c.id=challenge_id and c.status <> 'published'))
  with check (public.has_role('editor') and exists(select 1 from public.challenges c where c.id=challenge_id and c.status <> 'published'));

-- Staff can inspect supporting links while reviewing draft content.
create policy "staff read all place categories" on public.place_categories for select to authenticated
  using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all block source links" on public.content_block_sources for select to authenticated
  using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all place source links" on public.place_sources for select to authenticated
  using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all relations" on public.related_places for select to authenticated
  using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all route stops" on public.route_stops for select to authenticated
  using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all life source links" on public.life_story_sources for select to authenticated
  using (public.has_any_role(array['admin','editor','reviewer']));
create policy "staff read all moment source links" on public.moment_sources for select to authenticated
  using (public.has_any_role(array['admin','editor','reviewer']));
