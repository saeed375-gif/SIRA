-- Routes and interactive challenges
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.slug_is_valid(slug)),
  title_ar text not null,
  title_en text,
  description_ar text,
  description_en text,
  subtitle_ar text,
  subtitle_en text,
  cover_image_url text,
  route_type text,
  theme text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  distance_km numeric(8,2) check (distance_km is null or distance_km >= 0),
  difficulty text check (difficulty is null or difficulty in ('easy','medium','hard')),
  featured boolean not null default false,
  is_demo boolean not null default false,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete restrict,
  stop_number integer not null check (stop_number > 0),
  title_ar text,
  title_en text,
  description_ar text,
  description_en text,
  highlight_ar text,
  highlight_en text,
  sort_order integer not null default 0,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  walk_from_prev_minutes integer check (walk_from_prev_minutes is null or walk_from_prev_minutes >= 0),
  story_id uuid references public.life_stories(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(route_id, place_id),
  unique(route_id, stop_number)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places(id) on delete cascade,
  route_id uuid references public.routes(id) on delete cascade,
  type text not null check (type in ('multiple_choice','map_location','image_choice','ordering','matching','audio')),
  question_ar text not null,
  question_en text,
  explanation_ar text,
  explanation_en text,
  points integer not null default 0 check (points >= 0),
  difficulty text check (difficulty is null or difficulty in ('easy','medium','hard')),
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  check (place_id is not null or route_id is not null)
);

create table if not exists public.challenge_options (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  text_ar text,
  text_en text,
  image_url text,
  value jsonb,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.media add column if not exists route_id uuid references public.routes(id) on delete cascade;

create trigger trg_routes_updated_at before update on public.routes for each row execute function public.set_updated_at();
create trigger trg_challenges_updated_at before update on public.challenges for each row execute function public.set_updated_at();
