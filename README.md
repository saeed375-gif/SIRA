<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cbe00d19-4132-4170-9603-1dd1b1b170a2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and configure Supabase. To enable the Sira guide, add the server-only `GEMINI_API_KEY` (never expose it as a `VITE_*` variable).
3. Run the app:
   `npm run dev`

## Android

The repository includes a Capacitor Android app (`com.sira.jerusalem`) that bundles the same Arabic-first interface, including its mobile navigation and safe-area treatment.

1. `VITE_API_BASE_URL` is set in `.env.android` to the production API origin (this is required because a native WebView does not share the website origin).
2. Run `npm run build:android` to build the web bundle and synchronize it into `android/`.
3. Open `android/` with Android Studio, then create a signed release APK or AAB from the standard **Generate Signed Bundle / APK** flow.

The API explicitly permits only Capacitor's native localhost origins, so Android authentication, progress sync, content loading, and the Sira companion continue to use the deployed API without opening it to arbitrary browser origins.

## محور الحياة في القدس

- يعتمد المشروع React/Vite وبيانات محلية؛ لا يتطلب قاعدة بيانات جديدة.
- المحتوى في `src/data/lifeData.ts`، ويرتبط بمعرّفات الأماكن الحالية عبر `placeId` و`relatedPlaces`.
- فلتر الحياة: `/explore?category=life`، والتركيز على مكان: `/explore?category=life&place=khan-al-zait`.
- اللحظات: `/moment/morning-bread`، والمسارات الجديدة ضمن `/routes`.
- جميع قصص الحياة الحالية مشاهد تجريبية وليست حقائق موثقة. تستخدم `SourceCitation` الموجود، مع علامة `isDemo`، دون إنشاء نظام مصادر منفصل.
- `public/audio/life-demo.wav` عيّنة إيقاعية مصنوعة رقميًا مدتها 12 ثانية؛ ليست تسجيلًا ميدانيًا. استبدل `audioUrl` ومدة الصوت والوصف والمصدر عند توفر تسجيل موثّق.
- الصور المصغرة WebP مشتقة من صور المشروع الحالية؛ تنطبق عليها التراخيص والمصادر في `public/image-credits.html`.
- مشغّل الصوت يستخدم أحداث الملف الفعلية، ولا يحمل الصوت مقدمًا. القراءة الآلية للنصوص القديمة تتطلب صوتًا عربيًا في المتصفح وتُظهر رسالة واضحة عند عدم توفره.
- التحقق: `npm run lint` ثم `npm run build`.

## Supabase integration (this package)

The Sira frontend uses a key-free Leaflet/OpenStreetMap map with interactive markers and routes. The runtime architecture is:

`Existing React/Vite UI -> Express API (/api) -> Supabase/PostgreSQL`

The Supabase project currently connected in `.env` is the `Sira` project created for this application. Public reads use the publishable key and remain protected by RLS. `SUPABASE_SERVICE_ROLE_KEY` is intentionally empty and must never be exposed to the browser.

### Run both frontend and API

```bash
npm ci
npm run dev
```

- Vite frontend: `http://localhost:3000` (or the next free port)
- API health: `http://localhost:8787/api/health`

### Sira intelligent guide

The floating **"اسأل سِيرة"** guide calls `POST /api/assistant/chat`. Its Gemini key stays on the Express/Vercel server, requests are rate-limited and protected by Gemini safety settings, and the model is grounded in the currently published places, routes, and life stories from Supabase. It does not save conversations to a user account. Set these server environment variables locally and in Vercel:

```bash
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.8-flash
```

The Vite dev server proxies `/api` to port `8787`, so the frontend does not need a separate API URL locally.

### Database

The reproducible schema is under `supabase/migrations/` and includes PostgreSQL/PostGIS, RLS, search, storage metadata, places, content, sources, timeline, life stories, routes, challenges, favorites and progress.

The exact current frontend still uses stable UI IDs (`p-1` ... `p-6`) in several route/challenge/map relationships. `src/services/siraData.ts` is therefore a compatibility mapper: it overlays Supabase-managed place fields by `slug` while preserving those UI IDs and the existing map/route structures. This is intentional to avoid breaking the frontend while database migration continues.
