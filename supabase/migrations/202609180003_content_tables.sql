-- Content blocks, sources, timeline and media
create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  type text not null check (type in ('story','history','geography','religion','identity','memory','daily_life','culture','intro','custom')),
  title_ar text,
  title_en text,
  content_ar text not null,
  content_en text,
  excerpt_ar text,
  excerpt_en text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  organization text,
  source_type text not null default 'other' check (source_type in ('book','archive','website','research','article','institution','interview','oral_history','photo_archive','audio','video','other')),
  publication_year text,
  publisher text,
  url text,
  reference_text text,
  description_ar text,
  description_en text,
  accessed_at timestamptz,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_block_sources (
  id uuid primary key default gen_random_uuid(),
  content_block_id uuid not null references public.content_blocks(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  note_ar text,
  note_en text,
  page_reference text,
  created_at timestamptz not null default now(),
  unique(content_block_id, source_id, page_reference)
);

create table if not exists public.place_sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  note_ar text,
  note_en text,
  created_at timestamptz not null default now(),
  unique(place_id, source_id)
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  year_start integer,
  year_end integer,
  date_label_ar text,
  date_label_en text,
  title_ar text not null,
  title_en text,
  description_ar text not null,
  description_en text,
  image_url text,
  highlight_ar text,
  highlight_en text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.life_stories (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  slug text not null unique check (public.slug_is_valid(slug)),
  type text not null check (type in ('food','craft','market','culture','tradition','people','sound','daily_life','clothing','occasion','social_life','other')),
  content_type text not null default 'story' check (content_type in ('story','moment','food','craft','person','audio')),
  title_ar text not null,
  title_en text,
  short_description_ar text,
  short_description_en text,
  story_ar text not null,
  story_en text,
  image_url text,
  image_alt_ar text,
  image_alt_en text,
  audio_url text,
  audio_duration_seconds integer check (audio_duration_seconds is null or audio_duration_seconds >= 0),
  audio_transcript_ar text,
  audio_transcript_en text,
  video_url text,
  context_ar text,
  context_en text,
  featured boolean not null default false,
  is_demo boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.jerusalem_moments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.slug_is_valid(slug)),
  place_id uuid not null references public.places(id) on delete cascade,
  title_ar text not null,
  title_en text,
  description_ar text not null,
  description_en text,
  image_url text,
  image_alt_ar text,
  image_alt_en text,
  audio_url text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  featured boolean not null default false,
  is_demo boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.people_stories (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  display_name text not null,
  role_ar text,
  role_en text,
  title_ar text not null,
  title_en text,
  story_ar text not null,
  story_en text,
  image_url text,
  audio_url text,
  source_id uuid references public.sources(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.related_places (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  related_place_id uuid not null references public.places(id) on delete cascade,
  relation_type text not null default 'nearby' check (relation_type in ('nearby','historical','cultural','religious','story','route','daily_life','other')),
  label_ar text,
  label_en text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (place_id <> related_place_id),
  unique(place_id, related_place_id, relation_type)
);

-- Media is intentionally generic; files live in Supabase Storage, not PostgreSQL.
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places(id) on delete cascade,
  content_block_id uuid references public.content_blocks(id) on delete cascade,
  life_story_id uuid references public.life_stories(id) on delete cascade,
  moment_id uuid references public.jerusalem_moments(id) on delete cascade,
  type text not null check (type in ('image','audio','video','document')),
  storage_bucket text,
  storage_path text,
  public_url text,
  thumbnail_url text,
  title_ar text,
  title_en text,
  caption_ar text,
  caption_en text,
  alt_text_ar text,
  alt_text_en text,
  credit text,
  taken_at timestamptz,
  historical_date text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  check (storage_path is not null or public_url is not null)
);

create table if not exists public.life_story_sources (
  life_story_id uuid not null references public.life_stories(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  note_ar text,
  note_en text,
  primary key (life_story_id, source_id)
);

create table if not exists public.moment_sources (
  moment_id uuid not null references public.jerusalem_moments(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  note_ar text,
  note_en text,
  primary key (moment_id, source_id)
);

create trigger trg_content_blocks_updated_at before update on public.content_blocks for each row execute function public.set_updated_at();
create trigger trg_sources_updated_at before update on public.sources for each row execute function public.set_updated_at();
create trigger trg_timeline_updated_at before update on public.timeline_events for each row execute function public.set_updated_at();
create trigger trg_life_stories_updated_at before update on public.life_stories for each row execute function public.set_updated_at();
create trigger trg_moments_updated_at before update on public.jerusalem_moments for each row execute function public.set_updated_at();
create trigger trg_people_stories_updated_at before update on public.people_stories for each row execute function public.set_updated_at();
create trigger trg_media_updated_at before update on public.media for each row execute function public.set_updated_at();
