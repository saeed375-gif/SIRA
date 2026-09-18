-- Limited seed copied from the current Sira frontend. It is intentionally conservative:
-- place metadata/coordinates from the existing project, while deeper claims can be editorially reviewed before publishing.
insert into public.categories(slug,name_ar,name_en,icon_key,sort_order,is_active) values
('history','التاريخ','History','landmark',10,true),
('religion','الدين','Religion','dome',20,true),
('geography','الجغرافيا','Geography','map-pin',30,true),
('identity','الهوية','Identity','users',40,true),
('memory','الذاكرة','Memory','book-heart',50,true),
('life','الحياة اليومية','Daily life','coffee',60,true),
('culture','الثقافة','Culture','music',70,true)
on conflict(slug) do update set name_ar=excluded.name_ar,name_en=excluded.name_en,icon_key=excluded.icon_key,sort_order=excluded.sort_order,is_active=true;

insert into public.places(id,slug,name_ar,name_en,short_description_ar,district_ar,latitude,longitude,main_image_url,status,featured,published_at)
values
('10000000-0000-0000-0000-000000000001','bab-al-amoud','باب العمود','Damascus Gate','أبهى وأفخم بوابات القدس العتيقة، مدرج حجري يعج بالحياة والحكايات ونبض المدينة الأصيل.','البلدة القديمة – المدخل الشمالي',31.7818,35.2307,'/images/jerusalem/damascus-gate.jpg','published',true,now()),
('10000000-0000-0000-0000-000000000002','khan-al-zait','سوق خان الزيت','Khan al-Zait Souk','أطول وأقدم أسواق القدس المسقوفة، تفوح منه رائحة التوابل والحلويات التراثية وأصوات الباعة.','البلدة القديمة – الشريان الأوسط',31.7788,35.2305,'/images/jerusalem/khan-al-zait-passage.jpg','published',true,now()),
('10000000-0000-0000-0000-000000000003','holy-sepulchre','كنيسة القيامة','Church of the Holy Sepulchre','أحد أبرز معالم البلدة القديمة في القدس، ومقصد ديني وتاريخي عالمي.','حارة النصارى – البلدة القديمة',31.7785,35.2298,'/images/jerusalem/holy-sepulchre.jpg','published',true,now()),
('10000000-0000-0000-0000-000000000004','al-aqsa-mosque','المسجد الأقصى','Al-Aqsa Mosque','معلم ديني وتاريخي مركزي في القدس، ضمن الحرم القدسي الشريف.','الحرم القدسي الشريف – البلدة القديمة',31.7780,35.2354,'/images/jerusalem/al-qibli-mosque.jpg','published',true,now()),
('10000000-0000-0000-0000-000000000005','jerusalem-walls','أسوار القدس','Jerusalem Walls','أسوار البلدة القديمة التي ترسم حدود المشهد التاريخي وتربط أبواب القدس ومعالمها.','البلدة القديمة',31.7779,35.2290,'/images/jerusalem/jerusalem-ramparts.jpg','published',false,now()),
('10000000-0000-0000-0000-000000000006','bab-al-sahira','باب الساهرة','Herod''s Gate','إحدى بوابات البلدة القديمة في القدس، مرتبطة بحركة الأحياء المحيطة والحياة اليومية.','البلدة القديمة – الجهة الشمالية الشرقية',31.7831,35.2338,'/images/jerusalem/herods-gate.jpg','published',false,now())
on conflict(slug) do update set
  name_ar=excluded.name_ar,name_en=excluded.name_en,short_description_ar=excluded.short_description_ar,district_ar=excluded.district_ar,
  latitude=excluded.latitude,longitude=excluded.longitude,main_image_url=excluded.main_image_url;

-- Primary taxonomy derived from the current UI model; life is an additional layer where relevant.
insert into public.place_categories(place_id,category_id)
select p.id,c.id from public.places p join public.categories c on
  (p.slug='bab-al-amoud' and c.slug in ('history','life')) or
  (p.slug='khan-al-zait' and c.slug in ('memory','life','culture')) or
  (p.slug='holy-sepulchre' and c.slug in ('religion','history')) or
  (p.slug='al-aqsa-mosque' and c.slug in ('religion','history')) or
  (p.slug='jerusalem-walls' and c.slug in ('history','geography')) or
  (p.slug='bab-al-sahira' and c.slug in ('geography','life'))
on conflict do nothing;

insert into public.routes(id,slug,title_ar,title_en,description_ar,subtitle_ar,cover_image_url,route_type,estimated_minutes,distance_km,difficulty,featured,status,published_at)
values(
  '20000000-0000-0000-0000-000000000001','heart-of-jerusalem','رحلة في قلب القدس','Journey in the Heart of Jerusalem',
  'مسار تجريبي يربط أربع محطات موجودة أصلًا في واجهة سيرة.','أربع محطات لاكتشاف المكان والحكاية',
  '/images/jerusalem/damascus-gate.jpg','walking',60,1.6,'easy',true,'published',now()
)
on conflict(slug) do update set title_ar=excluded.title_ar,title_en=excluded.title_en,description_ar=excluded.description_ar,estimated_minutes=excluded.estimated_minutes,status='published';

insert into public.route_stops(route_id,place_id,stop_number,title_ar,description_ar,sort_order,estimated_minutes)
values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',1,'باب العمود','نقطة البداية',10,10),
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',2,'سوق خان الزيت','السوق والحياة اليومية',20,15),
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003',3,'كنيسة القيامة','محطة دينية وتاريخية',30,15),
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004',4,'المسجد الأقصى','المحطة الأخيرة في المسار التجريبي',40,20)
on conflict(route_id,place_id) do update set stop_number=excluded.stop_number,title_ar=excluded.title_ar,sort_order=excluded.sort_order,estimated_minutes=excluded.estimated_minutes;
