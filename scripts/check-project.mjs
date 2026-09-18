import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (message) => { console.error(`✗ ${message}`); process.exitCode = 1; };
const ok = (message) => console.log(`✓ ${message}`);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const map = read('src/components/JerusalemMap.tsx');
const src = read('src/App.tsx') + '\n' + read('src/services/siraData.ts') + '\n' + map;
if (src.includes('SUPABASE_SERVICE_ROLE_KEY')) fail('service-role key name leaked into frontend source'); else ok('no service-role key in frontend source');
if (/AIza[0-9A-Za-z_-]{20,}/.test(src)) fail('hard-coded Google API key detected in frontend source'); else ok('no hard-coded Google API key in frontend source');
if (!src.includes('loadSiraDatabaseData')) fail('Supabase/API data overlay is not wired into App'); else ok('Supabase/API data overlay wired into App');

if (!map.includes("from 'leaflet'") || !map.includes('L.map(') || !map.includes('tile.openstreetmap.org')) fail('Leaflet/OpenStreetMap implementation missing'); else ok('Leaflet/OpenStreetMap implementation configured');

const migrationsDir = path.join(root, 'supabase', 'migrations');
const migrations = fs.readdirSync(migrationsDir).filter((n) => n.endsWith('.sql')).sort();
if (migrations.length < 10) fail('expected full migration set'); else ok(`${migrations.length} ordered migrations found`);
const sql = migrations.map((n) => fs.readFileSync(path.join(migrationsDir, n), 'utf8')).join('\n');
for (const table of ['places','content_blocks','sources','timeline_events','media','life_stories','jerusalem_moments','people_stories','routes','route_stops','challenges','favorites']) {
  if (!new RegExp(`create table if not exists public\\.${table}\\b`, 'i').test(sql)) fail(`missing table migration: ${table}`);
}
if (!/postgis/i.test(sql) || !/pg_trgm/i.test(sql)) fail('PostGIS/pg_trgm extensions missing'); else ok('PostGIS and pg_trgm configured');
if (!/get_nearby_places/i.test(sql) || !/search_sira/i.test(sql)) fail('search/nearby database functions missing'); else ok('search and nearby database functions configured');
if (!/source-documents.*false/is.test(sql)) fail('private source-documents bucket missing'); else ok('storage buckets include private source-documents');

if (process.exitCode) process.exit(process.exitCode);
console.log('Sira project static checks passed.');
