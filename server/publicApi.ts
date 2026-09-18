import { Router } from 'express';
import { restPath, rpc, supabaseFetch } from './supabaseRest';
import { rateLimit } from './rateLimit';

const router = Router();
const page = (value: unknown, fallback: number, max: number) => Math.max(0, Math.min(Number(value) || fallback, max));
const cache = (seconds: number) => (_req: unknown, res: any, next: any) => { res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 4}`); next(); };

router.get('/places', cache(60), async (req, res, next) => {
  try {
    const limit = page(req.query.limit, 24, 100);
    const offset = page(req.query.offset, 0, 100000);
    const params: Record<string, string | number> = {
      select: 'id,slug,name_ar,name_en,short_description_ar,short_description_en,district_ar,district_en,address_ar,address_en,latitude,longitude,main_image_url,featured,published_at,place_categories(category:categories(id,slug,name_ar,name_en,icon_key,sort_order))',
      status: 'eq.published',
      order: 'featured.desc,name_ar.asc',
      limit,
      offset,
    };
    if (req.query.featured === 'true') params.featured = 'eq.true';
    if (req.query.ids) {
      const ids = String(req.query.ids).split(',').map((id) => id.trim()).filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100);
      if (ids.length) params.id = `in.(${ids.join(',')})`;
    }
    const data = await supabaseFetch(restPath('places', params));
    res.json({ data, pagination: { limit, offset } });
  } catch (e) { next(e); }
});

router.get('/places/:slug', cache(60), async (req, res, next) => {
  try {
    const places = await supabaseFetch<any[]>(restPath('places', {
      select: 'id,slug,name_ar,name_en,short_description_ar,short_description_en,district_ar,district_en,address_ar,address_en,latitude,longitude,main_image_url,featured,published_at,place_categories(category:categories(id,slug,name_ar,name_en,icon_key,sort_order))',
      slug: `eq.${req.params.slug}`,
      status: 'eq.published',
      limit: 1,
    }));
    const place = places[0];
    if (!place) return res.status(404).json({ error: 'Place not found' });

    const [contentBlocks, timeline, lifeStories, peopleStories, media, placeSources, relatedRows, challengeRows] = await Promise.all([
      supabaseFetch<any[]>(restPath('content_blocks', { select: 'id,type,title_ar,title_en,content_ar,content_en,excerpt_ar,excerpt_en,sort_order,content_block_sources(note_ar,note_en,page_reference,source:sources(id,title,author,organization,source_type,publication_year,publisher,url,reference_text,description_ar,description_en))', place_id: `eq.${place.id}`, status: 'eq.published', order: 'sort_order.asc,created_at.asc' })),
      supabaseFetch<any[]>(restPath('timeline_events', { select: '*', place_id: `eq.${place.id}`, status: 'eq.published', order: 'sort_order.asc,year_start.asc.nullslast' })),
      supabaseFetch<any[]>(restPath('life_stories', { select: '*,life_story_sources(note_ar,note_en,source:sources(id,title,author,organization,source_type,publication_year,publisher,url,reference_text,description_ar,description_en))', place_id: `eq.${place.id}`, status: 'eq.published', order: 'sort_order.asc,created_at.asc' })),
      supabaseFetch<any[]>(restPath('people_stories', { select: '*,source:sources(*)', place_id: `eq.${place.id}`, status: 'eq.published', order: 'sort_order.asc,created_at.asc' })),
      supabaseFetch<any[]>(restPath('media', { select: '*', place_id: `eq.${place.id}`, status: 'eq.published', order: 'sort_order.asc,created_at.asc' })),
      supabaseFetch<any[]>(restPath('place_sources', { select: 'note_ar,note_en,source:sources(id,title,author,organization,source_type,publication_year,publisher,url,reference_text,description_ar,description_en)', place_id: `eq.${place.id}` })),
      supabaseFetch<any[]>(restPath('related_places', { select: '*', place_id: `eq.${place.id}`, order: 'sort_order.asc,created_at.asc' })),
      supabaseFetch<any[]>(restPath('challenges', { select: 'id,place_id,route_id,type,question_ar,question_en,points,difficulty,sort_order', place_id: `eq.${place.id}`, status: 'eq.published', order: 'sort_order.asc,created_at.asc' })),
    ]);

    const relatedIds = relatedRows.map((r) => r.related_place_id).filter(Boolean);
    const relatedPlaces = relatedIds.length
      ? await supabaseFetch<any[]>(restPath('places', { select: 'id,slug,name_ar,name_en,short_description_ar,latitude,longitude,main_image_url', id: `in.(${relatedIds.join(',')})`, status: 'eq.published' }))
      : [];

    const challenges = await Promise.all(challengeRows.map((c) => rpc<any>('get_public_challenge', { challenge_uuid: c.id })));
    const categories = (place.place_categories || []).map((x: any) => x.category).filter(Boolean);
    const sources = placeSources.map((x: any) => x.source).filter(Boolean);

    res.json({
      place: { ...place, place_categories: undefined },
      categories,
      contentBlocks,
      timeline,
      lifeStories,
      peopleStories,
      media,
      sources,
      relatedPlaces: relatedRows.map((row) => ({ ...row, place: relatedPlaces.find((p) => p.id === row.related_place_id) || null })),
      challenges: challenges.filter(Boolean),
    });
  } catch (e) { next(e); }
});

router.get('/places/:slug/nearby', cache(45), async (req, res, next) => {
  try {
    const places = await supabaseFetch<any[]>(restPath('places', { select: 'id,latitude,longitude', slug: `eq.${req.params.slug}`, status: 'eq.published', limit: 1 }));
    if (!places[0] || places[0].latitude == null || places[0].longitude == null) return res.status(404).json({ error: 'Place or coordinates not found' });
    const data = await rpc<any[]>('get_nearby_places', {
      latitude: places[0].latitude,
      longitude: places[0].longitude,
      radius_meters: page(req.query.radius, 1500, 10000),
      limit_count: page(req.query.limit, 12, 50),
    });
    res.json({ data: data.filter((p) => p.id !== places[0].id) });
  } catch (e) { next(e); }
});

router.get('/life', cache(60), async (req, res, next) => {
  try {
    const limit = page(req.query.limit, 50, 100);
    const data = await supabaseFetch(restPath('life_stories', { select: '*,life_story_sources(note_ar,note_en,source:sources(*))', status: 'eq.published', order: 'featured.desc,sort_order.asc,created_at.asc', limit }));
    res.json({ data });
  } catch (e) { next(e); }
});

router.get('/moments', cache(60), async (req, res, next) => {
  try {
    const limit = page(req.query.limit, 30, 100);
    const data = await supabaseFetch(restPath('jerusalem_moments', { select: '*,moment_sources(note_ar,note_en,source:sources(*)),place:places(id,slug,name_ar,name_en)', status: 'eq.published', order: 'featured.desc,sort_order.asc,created_at.asc', limit }));
    res.json({ data });
  } catch (e) { next(e); }
});

router.get('/routes', cache(60), async (_req, res, next) => {
  try {
    const data = await supabaseFetch(restPath('routes', {
      select: 'id,slug,title_ar,title_en,description_ar,description_en,subtitle_ar,subtitle_en,cover_image_url,route_type,theme,estimated_minutes,distance_km,difficulty,featured,is_demo,route_stops(id,place_id,stop_number,title_ar,title_en,description_ar,description_en,highlight_ar,highlight_en,sort_order,estimated_minutes,walk_from_prev_minutes,story_id,place:places(id,slug,name_ar,name_en,latitude,longitude,main_image_url))',
      status: 'eq.published', order: 'featured.desc,created_at.asc',
    }));
    res.json({ data });
  } catch (e) { next(e); }
});

router.get('/routes/:slug', cache(60), async (req, res, next) => {
  try {
    const rows = await supabaseFetch<any[]>(restPath('routes', {
      select: '*,route_stops(id,place_id,stop_number,title_ar,title_en,description_ar,description_en,highlight_ar,highlight_en,sort_order,estimated_minutes,walk_from_prev_minutes,story_id,place:places(id,slug,name_ar,name_en,latitude,longitude,main_image_url),story:life_stories(*))',
      slug: `eq.${req.params.slug}`, status: 'eq.published', limit: 1,
    }));
    if (!rows[0]) return res.status(404).json({ error: 'Route not found' });
    const route = rows[0];
    const challengeRows = await supabaseFetch<any[]>(restPath('challenges', { select: 'id', route_id: `eq.${route.id}`, status: 'eq.published', order: 'sort_order.asc,created_at.asc' }));
    const challenges = await Promise.all(challengeRows.map((c) => rpc<any>('get_public_challenge', { challenge_uuid: c.id })));
    res.json({ route, stops: route.route_stops || [], challenges: challenges.filter(Boolean) });
  } catch (e) { next(e); }
});

router.get('/search', rateLimit(40, 60_000), async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ data: [] });
    const data = await rpc<any[]>('search_sira', { search_query: q, limit_count: page(req.query.limit, 30, 100), offset_count: page(req.query.offset, 0, 100000) });
    res.json({ data });
  } catch (e) { next(e); }
});

router.post('/challenges/:id/answer', rateLimit(30, 60_000), async (req, res, next) => {
  try {
    const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '').trim() || undefined;
    const data = await rpc<any>('submit_challenge_answer', {
      challenge_uuid: req.params.id,
      selected_option_uuid: req.body?.selectedOptionId || null,
      answer_data: req.body?.answerPayload || null,
    }, token);
    res.json(data);
  } catch (e) { next(e); }
});

export default router;
