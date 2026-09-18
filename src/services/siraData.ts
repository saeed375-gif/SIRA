import type { Place, Route } from '../types';
import { JERUSALEM_PLACES, JERUSALEM_ROUTES } from '../data/jerusalemData';
import { LIFE_ROUTES } from '../data/lifeData';

const API_BASE = String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
const STATIC_ROUTES: Route[] = [...JERUSALEM_ROUTES, ...LIFE_ROUTES];

type Envelope<T> = { data: T };

type RemotePlace = {
  id: string;
  slug: string;
  name_ar?: string | null;
  name_en?: string | null;
  short_description_ar?: string | null;
  district_ar?: string | null;
  address_ar?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  main_image_url?: string | null;
  place_categories?: Array<{ category?: { slug?: string; name_ar?: string } }>;
};

type RemoteRoute = {
  slug: string;
  title_ar?: string | null;
  title_en?: string | null;
  description_ar?: string | null;
  subtitle_ar?: string | null;
  cover_image_url?: string | null;
  estimated_minutes?: number | null;
  distance_km?: number | string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || `Sira API ${response.status}`);
  return body as T;
}

function mergePlace(base: Place, remote?: RemotePlace): Place {
  if (!remote) return base;
  const latitude = Number(remote.latitude);
  const longitude = Number(remote.longitude);
  return {
    ...base,
    // Keep the exact visual/content model from the uploaded frontend. Supabase is already
    // authoritative for publication and geographic coordinates; richer content can move
    // table-by-table without changing the interface.
    location: {
      lat: Number.isFinite(latitude) && latitude !== 0 ? latitude : base.location.lat,
      lng: Number.isFinite(longitude) && longitude !== 0 ? longitude : base.location.lng,
    },
  };
}

function mergeRoute(base: Route, remote?: RemoteRoute): Route {
  if (!remote) return base;
  const distance = Number(remote.distance_km);
  return {
    ...base,
    // Preserve stops/polyline/challenges from the exact frontend until they are fully migrated.
    title: remote.title_ar || base.title,
    englishTitle: remote.title_en || base.englishTitle,
    subtitle: remote.subtitle_ar || base.subtitle,
    description: remote.description_ar || base.description,
    coverImage: remote.cover_image_url || base.coverImage,
    durationMinutes: Number(remote.estimated_minutes) || base.durationMinutes,
    distanceKm: Number.isFinite(distance) && distance > 0 ? distance : base.distanceKm,
    difficulty: remote.difficulty === 'hard' ? 'جبلي' : remote.difficulty === 'medium' ? 'متوسط' : remote.difficulty === 'easy' ? 'سهل' : base.difficulty,
  };
}

export async function loadSiraDatabaseData(): Promise<{ places: Place[]; routes: Route[] }> {
  const [placesResult, routesResult] = await Promise.all([
    request<Envelope<RemotePlace[]>>('/api/places?limit=100'),
    request<Envelope<RemoteRoute[]>>('/api/routes'),
  ]);

  const placesBySlug = new Map(placesResult.data.map((place) => [place.slug, place]));
  const routesBySlug = new Map(routesResult.data.map((route) => [route.slug, route]));

  // Deliberately keep the exact frontend collection/order. Supabase overlays the content fields.
  return {
    // A place is shown only when Supabase returns it as published. The IDs and the entire
    // presentation object remain the original frontend's, protecting the map and links.
    places: JERUSALEM_PLACES
      .filter((place) => placesBySlug.has(place.slug))
      .map((place) => mergePlace(place, placesBySlug.get(place.slug))),
    // The current database has only the initial demo route; keep the exact uploaded route
    // definitions until route content is migrated one-for-one, overlaying matching slugs only.
    routes: STATIC_ROUTES.map((route) => mergeRoute(route, routesBySlug.get(route.slug))),
  };
}
