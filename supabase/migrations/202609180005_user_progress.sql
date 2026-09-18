-- User-owned state
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, place_id)
);

create table if not exists public.user_place_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  discovered_at timestamptz,
  completed_at timestamptz,
  last_visited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, place_id)
);

create table if not exists public.user_route_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  current_stop_id uuid references public.route_stops(id) on delete set null,
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, route_id)
);

create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  selected_option_id uuid references public.challenge_options(id) on delete set null,
  answer_payload jsonb,
  is_correct boolean not null,
  points_earned integer not null default 0 check (points_earned >= 0),
  created_at timestamptz not null default now()
);

create trigger trg_user_place_progress_updated_at before update on public.user_place_progress for each row execute function public.set_updated_at();
create trigger trg_user_route_progress_updated_at before update on public.user_route_progress for each row execute function public.set_updated_at();
