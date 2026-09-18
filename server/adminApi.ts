import express, { Router } from 'express';
import crypto from 'node:crypto';
import { requireAuth, requireRole, type AuthenticatedRequest } from './auth';
import { config } from './config';
import { restPath, supabaseFetch } from './supabaseRest';
import { rateLimit } from './rateLimit';

const router = Router();
router.use(requireAuth);
router.use(requireRole('admin', 'editor', 'reviewer'));

type ResourceSpec = { table: string; writable: boolean; publishable?: boolean; publishedAudit?: boolean };
const resources: Record<string, ResourceSpec> = {
  places: { table: 'places', writable: true, publishable: true, publishedAudit: true },
  categories: { table: 'categories', writable: true },
  'place-categories': { table: 'place_categories', writable: true },
  content: { table: 'content_blocks', writable: true, publishable: true, publishedAudit: true },
  timeline: { table: 'timeline_events', writable: true, publishable: true },
  life: { table: 'life_stories', writable: true, publishable: true },
  moments: { table: 'jerusalem_moments', writable: true, publishable: true },
  people: { table: 'people_stories', writable: true, publishable: true },
  sources: { table: 'sources', writable: true, publishable: true },
  'place-sources': { table: 'place_sources', writable: true },
  'block-sources': { table: 'content_block_sources', writable: true },
  relations: { table: 'related_places', writable: true },
  media: { table: 'media', writable: true, publishable: true },
  routes: { table: 'routes', writable: true, publishable: true, publishedAudit: true },
  'route-stops': { table: 'route_stops', writable: true },
  challenges: { table: 'challenges', writable: true, publishable: true },
  'challenge-options': { table: 'challenge_options', writable: true },
  roles: { table: 'user_roles', writable: true },
};

function getSpec(name: string) {
  const spec = resources[name];
  if (!spec) {
    const e = new Error('Unknown admin resource') as Error & { status?: number };
    e.status = 404;
    throw e;
  }
  return spec;
}

function ensureCanWrite(req: AuthenticatedRequest, spec: ResourceSpec, payload?: Record<string, unknown>) {
  if (!spec.writable) throw Object.assign(new Error('Resource is read-only'), { status: 405 });
  const roles = req.auth?.roles || [];
  if (roles.includes('reviewer') && !roles.includes('admin')) throw Object.assign(new Error('Reviewer access is read-only in this MVP'), { status: 403 });
  if (payload?.status === 'published' && !roles.includes('admin')) throw Object.assign(new Error('Only an admin can publish content'), { status: 403 });
  if (spec.table === 'user_roles' && !roles.includes('admin')) throw Object.assign(new Error('Only an admin can manage roles'), { status: 403 });
}

function cleanPayload(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('JSON object body is required'), { status: 400 });
  const copy = { ...(value as Record<string, unknown>) };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  delete copy.published_by;
  delete copy.created_by;
  return copy;
}

router.get('/:resource', async (req: AuthenticatedRequest, res, next) => {
  try {
    const spec = getSpec(req.params.resource);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const params: Record<string, string | number> = { select: '*', limit, offset };
    if (req.query.status) params.status = `eq.${String(req.query.status)}`;
    if (req.query.place_id) params.place_id = `eq.${String(req.query.place_id)}`;
    if (req.query.route_id) params.route_id = `eq.${String(req.query.route_id)}`;
    if (req.query.q && ['places','sources','content_blocks','life_stories','routes'].includes(spec.table)) {
      const column = spec.table === 'sources' ? 'title' : spec.table === 'places' ? 'name_ar' : spec.table === 'routes' ? 'title_ar' : 'title_ar';
      params[column] = `ilike.*${String(req.query.q).replace(/[,*()]/g, '')}*`;
    }
    const data = await supabaseFetch(restPath(spec.table, params), { accessToken: req.auth!.accessToken });
    res.json({ data, pagination: { limit, offset } });
  } catch (e) { next(e); }
});

router.post('/:resource', async (req: AuthenticatedRequest, res, next) => {
  try {
    const spec = getSpec(req.params.resource);
    const payload = cleanPayload(req.body);
    ensureCanWrite(req, spec, payload);
    if ('created_by' !== spec.table && ['places','content_blocks','timeline_events','life_stories','jerusalem_moments','people_stories','media','routes','challenges'].includes(spec.table)) {
      payload.created_by = req.auth!.id;
    }
    const data = await supabaseFetch(restPath(spec.table, { select: '*' }), {
      method: 'POST', accessToken: req.auth!.accessToken,
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });
    res.status(201).json({ data });
  } catch (e) { next(e); }
});

router.patch('/:resource/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const spec = getSpec(req.params.resource);
    const payload = cleanPayload(req.body);
    ensureCanWrite(req, spec, payload);
    const data = await supabaseFetch(restPath(spec.table, { id: `eq.${req.params.id}`, select: '*' }), {
      method: 'PATCH', accessToken: req.auth!.accessToken,
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });
    res.json({ data });
  } catch (e) { next(e); }
});

router.post('/:resource/:id/publish', requireRole('admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const spec = getSpec(req.params.resource);
    if (!spec.publishable) return res.status(400).json({ error: 'This resource does not use publish workflow' });
    const payload: Record<string, unknown> = { status: 'published' };
    if (spec.publishedAudit) {
      payload.published_at = new Date().toISOString();
      payload.published_by = req.auth!.id;
    }
    const data = await supabaseFetch(restPath(spec.table, { id: `eq.${req.params.id}`, select: '*' }), {
      method: 'PATCH', accessToken: req.auth!.accessToken,
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });
    res.json({ data });
  } catch (e) { next(e); }
});

router.post('/:resource/:id/archive', async (req: AuthenticatedRequest, res, next) => {
  try {
    const spec = getSpec(req.params.resource);
    if (!spec.publishable) return res.status(400).json({ error: 'This resource does not use status workflow' });
    ensureCanWrite(req, spec, { status: 'archived' });
    const data = await supabaseFetch(restPath(spec.table, { id: `eq.${req.params.id}`, select: '*' }), {
      method: 'PATCH', accessToken: req.auth!.accessToken,
      headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: 'archived' }),
    });
    res.json({ data });
  } catch (e) { next(e); }
});


router.put('/places/:id/categories', async (req: AuthenticatedRequest, res, next) => {
  try {
    const categoryIds = Array.isArray(req.body?.categoryIds)
      ? Array.from(new Set(req.body.categoryIds.map(String).filter((id: string) => /^[0-9a-f-]{36}$/i.test(id))))
      : [];
    const placeId = req.params.id;
    const existing = await supabaseFetch<any[]>(restPath('place_categories', { select: 'place_id,category_id', place_id: `eq.${placeId}` }), { accessToken: req.auth!.accessToken });
    const current = new Set(existing.map((row) => row.category_id));
    const wanted = new Set(categoryIds);
    const removed = [...current].filter((id) => !wanted.has(id));
    const added = [...wanted].filter((id) => !current.has(id));
    if (removed.length) {
      await supabaseFetch(restPath('place_categories', { place_id: `eq.${placeId}`, category_id: `in.(${removed.join(',')})` }), {
        method: 'DELETE', accessToken: req.auth!.accessToken, headers: { Prefer: 'return=minimal' },
      });
    }
    if (added.length) {
      await supabaseFetch(restPath('place_categories', {}), {
        method: 'POST', accessToken: req.auth!.accessToken, headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(added.map((category_id) => ({ place_id: placeId, category_id }))),
      });
    }
    res.json({ categoryIds });
  } catch (e) { next(e); }
});

const uploadRaw = express.raw({ type: '*/*', limit: '15mb' });
router.post('/upload/media', rateLimit(20, 60_000), uploadRaw, async (req: AuthenticatedRequest, res, next) => {
  try {
    const allowedBuckets = new Set(['place-media','audio-stories','route-media','moment-media','source-documents']);
    const bucket = String(req.query.bucket || 'place-media');
    if (!allowedBuckets.has(bucket)) return res.status(400).json({ error: 'Invalid storage bucket' });
    const contentType = String(req.get('x-sira-content-type') || req.get('content-type') || 'application/octet-stream').split(';')[0];
    const allowedMime = /^(image\/(jpeg|png|webp)|audio\/(mpeg|wav|ogg|mp4)|video\/mp4|application\/pdf)$/;
    if (!allowedMime.test(contentType)) return res.status(415).json({ error: 'Unsupported file type' });
    const rawName = String(req.get('x-sira-file-name') || 'upload.bin');
    const ext = (rawName.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1] || 'bin').toLowerCase();
    const storagePath = `${req.auth!.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
    await supabaseFetch(`/storage/v1/object/${bucket}/${encodedPath}`, {
      method: 'POST', accessToken: req.auth!.accessToken,
      headers: { 'Content-Type': contentType, 'x-upsert': 'false' },
      body: req.body,
    });

    const publicUrl = bucket === 'source-documents' ? null : `${config.supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
    const mediaPayload: Record<string, unknown> = {
      type: contentType.startsWith('image/') ? 'image' : contentType.startsWith('audio/') ? 'audio' : contentType.startsWith('video/') ? 'video' : 'document',
      storage_bucket: bucket,
      storage_path: storagePath,
      public_url: publicUrl,
      title_ar: String(req.get('x-sira-title-ar') || rawName),
      place_id: req.get('x-sira-place-id') || null,
      content_block_id: req.get('x-sira-content-block-id') || null,
      life_story_id: req.get('x-sira-life-story-id') || null,
      moment_id: req.get('x-sira-moment-id') || null,
      route_id: req.get('x-sira-route-id') || null,
      status: 'draft',
      created_by: req.auth!.id,
    };
    const data = await supabaseFetch(restPath('media', { select: '*' }), {
      method: 'POST', accessToken: req.auth!.accessToken,
      headers: { Prefer: 'return=representation' }, body: JSON.stringify(mediaPayload),
    });
    res.status(201).json({ data });
  } catch (e) { next(e); }
});

router.post('/media/signed-url', rateLimit(30, 60_000), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!config.supabaseServiceRoleKey) return res.status(503).json({ error: 'Service role key is required for signed private URLs' });
    const bucket = String(req.body?.bucket || 'source-documents');
    const path = String(req.body?.path || '');
    if (bucket !== 'source-documents' || !path) return res.status(400).json({ error: 'Invalid private file' });
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const data = await supabaseFetch(`/storage/v1/object/sign/${bucket}/${encodedPath}`, {
      method: 'POST', serviceRole: true, body: JSON.stringify({ expiresIn: 600 }),
    });
    res.json(data);
  } catch (e) { next(e); }
});

export default router;
