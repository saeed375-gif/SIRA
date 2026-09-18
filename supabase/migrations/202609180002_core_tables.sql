-- Core identity, places and taxonomy
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_language text not null default 'ar' check (preferred_language in ('ar','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor','reviewer','user')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.slug_is_valid(slug)),
  name_ar text not null,
  name_en text,
  short_description_ar text,
  short_description_en text,
  district_ar text,
  district_en text,
  address_ar text,
  address_en text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  location extensions.geography(point, 4326),
  main_image_url text,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (public.slug_is_valid(slug)),
  name_ar text not null,
  name_en text,
  icon_key text,
  description_ar text,
  description_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.place_categories (
  place_id uuid not null references public.places(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, category_id)
);

create or replace function public.sync_place_location()
returns trigger
language plpgsql
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

drop trigger if exists trg_places_sync_location on public.places;
create trigger trg_places_sync_location
before insert or update of latitude, longitude on public.places
for each row execute function public.sync_place_location();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_places_updated_at on public.places;
create trigger trg_places_updated_at before update on public.places
for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
