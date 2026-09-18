import React, { useState } from 'react';
import { ArrowLeft, MapPin, Coffee, Wheat, Scissors, ShoppingBag, Users, Music, Volume2, Camera, BookOpen } from 'lucide-react';
import { LifeStory, Place, DailyLifeCategory } from '../types';
import { LIFE_STORIES, LIFE_LABELS, LIFE_ROUTES, LIFE_CHALLENGE, storiesForPlace, lifeMapLink } from '../data/lifeData';
import { JERUSALEM_PLACES } from '../data/jerusalemData';
import { AudioStoryPlayer } from './AudioStoryPlayer';
import { PlaceChallenge } from './PlaceChallenge';
import { SourcesModal } from './SourcesModal';
const icons = { food: Wheat, craft: Scissors, market: ShoppingBag, culture: Music, tradition: Coffee, people: Users, sound: Volume2, 'daily-life': Camera };
type Navigate = { onNavigate: (path: string) => void };
const location = (s: LifeStory) => JERUSALEM_PLACES.find(p => p.id === s.placeId)!;
export const StoryAudio = ({ story }: { story: LifeStory }) => <AudioStoryPlayer key={story.id} title={story.title} durationSeconds={story.audioDurationSeconds || 12} narrator="نموذج سيرة" script={story.audioTranscript || story.body} highlights={[{ time: 0, text: story.summary }]} placeName={location(story).name} audioUrl={story.audioUrl} isDemo={story.isDemo} />;
export const DailyLifeStory: React.FC<{ story: LifeStory } & Navigate> = ({ story, onNavigate }) => {
  const Icon = icons[story.category];
  const [expanded, setExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  return <article className="life-story group rounded-2xl overflow-hidden border border-[#D4AF37]/20 bg-[#160E36]">
    <div className="h-48 overflow-hidden"><img loading="lazy" decoding="async" src={story.image} srcSet={`${story.image.replace("-960.webp", "-480.webp")} 480w, ${story.image} 960w`} sizes="(max-width: 640px) 92vw, 600px" alt={story.imageAlt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
    <div className="p-5 space-y-3"><div className="flex items-center justify-between gap-2 text-xs"><span className="inline-flex items-center gap-2 text-[#E5C158]"><Icon size={15} />{LIFE_LABELS[story.category]}</span>{story.isDemo && <span className="text-[#BFB2CF]">مشهد تجريبي</span>}</div>
      <h3 className="text-xl font-serif-ar font-bold text-[#FAF8F5]">{story.title}</h3><p className="text-sm text-[#D8CDE8] leading-relaxed">{story.summary}</p>
      <button className="life-location" onClick={() => onNavigate(lifeMapLink(story.placeId))}><MapPin size={14} />{location(story).name} · اعرض على الخريطة</button>
      {expanded && <div className="space-y-3 text-sm text-[#D8CDE8] leading-loose">
        {story.person && <p className="text-[#E5C158]">{story.person.name} · {story.person.relationship}</p>}
        {story.context && <p className="text-[#E5C158]">{story.context}</p>}<p>{story.body}</p>
        {story.audioUrl && <StoryAudio story={story} />}
        {story.videoUrl && <video controls preload="none" poster={story.image} aria-label={story.title}><source src={story.videoUrl} /><track kind="captions" /></video>}
        <button className="life-location" onClick={() => setSourcesOpen(true)}><BookOpen size={14} />المصدر والسياق</button>
        <button className="life-location" onClick={() => onNavigate(`/place/${location(story).slug}#life-section`)}>اكتشف المكان <ArrowLeft size={14} /></button>
      </div>}
      <button className="life-location py-2" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'طيّ الحكاية' : story.category === 'craft' ? 'تعرّف إلى الحكاية' : 'اكتشف المزيد'}<ArrowLeft size={15} /></button>
    </div>
    <SourcesModal sources={story.sources} placeName={story.title} isOpen={sourcesOpen} onClose={() => setSourcesOpen(false)} />
  </article>;
}
export const CraftStory = DailyLifeStory;
export const PersonStory = DailyLifeStory;
export const JerusalemMoment: React.FC<{ story: LifeStory; full?: boolean } & Navigate> = ({ story, onNavigate, full = false }) => {
  return <article className={`jerusalem-moment group ${full ? 'moment-full' : ''}`}>
    <img src={story.image} srcSet={`${story.image.replace("-960.webp", "-480.webp")} 480w, ${story.image} 960w`} sizes="(max-width: 640px) 92vw, 600px" alt={story.imageAlt} loading="lazy" decoding="async" />
    <div className="moment-shade" /><div className="moment-copy">
      <span className="text-xs tracking-wide text-[#FFE79A]">لحظة مقدسية <span className="text-[#E8E0D8]">/ مشهد تجريبي</span></span>
      <h3 className="font-serif-ar text-3xl sm:text-4xl font-bold my-3">{story.title}</h3>
      <p className="text-sm leading-loose max-w-lg text-[#F2EBE2]">{full ? story.body : story.summary}</p>
      <p className="flex items-center gap-2 text-xs my-4"><MapPin size={14} />{location(story).name}</p>
      <div className="flex flex-wrap gap-3">{!full && <button className="life-button" onClick={() => onNavigate(`/moment/${story.id}`)}>عِش اللحظة <ArrowLeft size={15} /></button>}
      <button className="life-button life-button-outline" onClick={() => onNavigate(lifeMapLink(story.placeId))}>اعرض على الخريطة</button>
      {full && <button className="life-button" onClick={() => onNavigate(`/place/${location(story).slug}#life-section`)}>اكتشف المكان</button>}</div>
    </div>
  </article>;
}
export function MomentView({ id, onNavigate }: { id: string } & Navigate) {
  const moments = LIFE_STORIES.filter(s => s.contentType === 'moment');
  const story = moments.find(s => s.id === id);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  if (!story) return <div className="life-shell py-24"><h1>اللحظة غير موجودة</h1><button className="life-button mt-5" onClick={() => onNavigate('/')}>عد إلى سيرة</button></div>;
  const next = moments[(moments.indexOf(story) + 1) % moments.length];
  return <div className="life-shell py-8 pb-24"><button className="life-location mb-5" onClick={() => onNavigate('/')}>سيرة / لحظات مقدسية</button><h1 className="sr-only">{story.title}</h1><JerusalemMoment story={story} full onNavigate={onNavigate} />
    {story.audioUrl && <div className="mt-6"><StoryAudio story={story} /></div>}
    <div className="flex justify-between flex-wrap gap-4 mt-6"><button className="life-location" onClick={() => setSourcesOpen(true)}><BookOpen size={16} />مصدر اللحظة وسياق الصورة</button><button className="life-button" onClick={() => onNavigate(`/moment/${next.id}`)}>اللحظة التالية <ArrowLeft size={16} /></button></div>
    <SourcesModal sources={story.sources} placeName={story.title} isOpen={sourcesOpen} onClose={() => setSourcesOpen(false)} />
  </div>;
}
export function PlaceLifeSection({ place, onNavigate, onSuccess }: { place: Place; onSuccess: (points: number) => void } & Navigate) {
  const stories = storiesForPlace(place.id);
  const [category, setCategory] = useState<DailyLifeCategory | 'all'>('all');
  const [showAll, setShowAll] = useState(false);
  if (!stories.length) return null;
  const categories = [...new Set(stories.map(s => s.category))];
  return <section id="life-section" className="scroll-mt-36 space-y-6">
    <div className="border-r-2 border-[#E5C158] pr-5"><span className="life-eyebrow">المكان، ثم الناس، ثم الحكاية</span><h2 className="text-3xl font-serif-ar font-bold mt-2">الحياة في المكان</h2><p className="text-sm text-[#C4B7D8] mt-3">اقترب من تفاصيل {place.name}. مشاهد قصيرة متخيّلة لتجربة الاكتشاف، بانتظار التوثيق.</p></div>
    <div className="flex gap-2 overflow-x-auto pb-2" aria-label="أنواع حكايات الحياة">{(['all', ...categories] as const).map(c => { const Icon = c === 'all' ? Coffee : icons[c]; return <button key={c} aria-pressed={category === c} className={`life-chip ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setShowAll(false); }}><Icon size={14} />{c === 'all' ? 'كل الحكايات' : LIFE_LABELS[c]}</button>; })}</div>
    <div className="grid sm:grid-cols-2 gap-5">{stories.filter(s => category === 'all' || s.category === category).slice(0, category === 'all' && !showAll ? 3 : undefined).map(story => story.contentType === 'moment' ? <JerusalemMoment key={story.id} story={story} onNavigate={onNavigate} /> : story.contentType === 'audio' ? <div key={story.id} className="self-center"><StoryAudio story={story} /><button className="life-location mt-3" onClick={() => onNavigate(lifeMapLink(story.placeId))}>اعرض على الخريطة <MapPin size={14} /></button></div> : <DailyLifeStory key={story.id} story={story} onNavigate={onNavigate} />)}</div>
    {category === 'all' && stories.length > 3 && <button className="life-chip" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? 'اعرض حكايات أقل' : `اكتشف بقية الحكايات (${stories.length - 3})`}</button>}
    {place.id === 'p-2' && <details className="life-disclosure"><summary>تحدّ نفسك: اربط الحكاية بالمكان</summary><div className="mt-4"><PlaceChallenge challenge={LIFE_CHALLENGE} placeName={place.name} onSuccess={onSuccess} nextPlaceSlug="bab-al-sahira" onNavigateToNext={slug => onNavigate(`/place/${slug}#life-section`)} /></div></details>}
    <button className="life-location" onClick={() => onNavigate('/routes/morning-in-jerusalem')}>خذ الحكاية إلى مسار «صباح في القدس» <ArrowLeft size={16} /></button>
  </section>;
}
export function HomeLifeSection({ onNavigate }: Navigate) {
  return <section className="life-home py-14 sm:py-20"><div className="life-shell">
    <div className="flex flex-wrap items-end justify-between gap-6 mb-9"><div><span className="life-eyebrow">تفاصيل صغيرة. مدينة كاملة.</span><h2 className="font-serif-ar text-4xl sm:text-5xl font-bold mt-3">القدس كما تُعاش</h2><p className="mt-4 text-sm max-w-lg leading-loose text-[#C4B7D8]">وراء كل باب لقاء، وفي كل طريق حكاية يومية. اقترب من الطعام والحرف والناس، عبر الأماكن التي تجمعهم.</p></div><button className="life-button" onClick={() => onNavigate('/explore?category=life')}>اكتشف حياة القدس <ArrowLeft size={17} /></button></div>
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6"><JerusalemMoment story={LIFE_STORIES[0]} onNavigate={onNavigate} /><div className="space-y-5"><div className="life-paper p-6 rounded-2xl"><span className="text-xs flex items-center gap-2"><Wheat size={16} />الطعام / سوق خان الزيت</span><h3 className="font-serif-ar text-3xl my-3">من السوق إلى المائدة</h3><p className="text-sm leading-loose">لا تبدأ الحكاية بقائمة أطباق؛ تبدأ بمن نلتقي، وما نحمله معنا إلى البيت.</p><button className="mt-5 inline-flex items-center gap-2 text-sm font-bold" onClick={() => onNavigate('/place/khan-al-zait#life-section')}>اكتشف حكاية الطعام <ArrowLeft size={15} /></button><span className="block text-xs mt-3 opacity-75">مشهد تحريري تجريبي</span></div><div className="flex gap-4 items-center border-b border-[#D4AF37]/25 pb-5"><img className="w-28 h-28 object-cover rounded-xl" src={LIFE_STORIES[4].image} alt={LIFE_STORIES[4].imageAlt} loading="lazy" /><div><span className="life-eyebrow">الحرف / مشهد تجريبي</span><h3 className="text-xl font-serif-ar font-bold my-2">المهارة التي تعبر الأجيال</h3><button className="life-location" onClick={() => onNavigate('/place/bab-al-sahira#life-section')}>تعرّف إلى الحكاية <ArrowLeft size={14} /></button></div></div></div></div>
  </div></section>;
}
export function HomeMoments({ onNavigate }: Navigate) {
  return <section className="life-shell py-14"><span className="life-eyebrow">توقّف قليلًا</span><h2 className="font-serif-ar text-3xl sm:text-4xl font-bold mt-2 mb-7">لحظات مقدسية</h2><div className="life-moments-strip">{LIFE_STORIES.filter(s => s.contentType === 'moment').slice(1).map(s => <JerusalemMoment key={s.id} story={s} onNavigate={onNavigate} />)}</div></section>;
}
export function HomeLifeRoutes({ onNavigate }: Navigate) {
  return <section className="life-shell py-12"><span className="life-eyebrow">كل محطة تفتح حكاية</span><h2 className="font-serif-ar text-3xl font-bold mt-2 mb-7">مسارات من الحياة</h2><div className="space-y-3">{LIFE_ROUTES.map((r, i) => <button key={r.id} onClick={() => onNavigate(`/routes/${r.slug}`)} className="life-route-row"><span className="font-num text-[#E5C158]">0{i + 1}</span><img src={r.coverImage} alt={r.title} loading="lazy" /><span className="flex-1 text-right"><strong className="block text-xl font-serif-ar">{r.title}</strong><span className="text-xs text-[#C4B7D8]">{r.stops.length} محطات · تجربة ثقافية · محتوى تجريبي</span></span><ArrowLeft size={19} className="text-[#E5C158]" /></button>)}</div></section>;
}
export function HomeSounds({ onNavigate }: Navigate) {
  const sound = LIFE_STORIES.find(s => s.contentType === 'audio')!;
  return <section className="life-shell py-14"><div className="grid md:grid-cols-2 gap-8 items-center"><div><span className="life-eyebrow">أصوات القدس</span><h2 className="font-serif-ar text-4xl font-bold my-4">أصغِ إلى ما بين الحكايات</h2><p className="text-sm text-[#C4B7D8] leading-loose mb-5">للأماكن إيقاعها أيضًا. جرّب الإنصات، ثم عُد إلى الخريطة. العيّنة الحالية مصنوعة للتجربة وليست تسجيلًا من المدينة.</p><button className="life-location" onClick={() => onNavigate(lifeMapLink(sound.placeId))}><MapPin size={16} />اعرض المكان على الخريطة</button></div><StoryAudio story={sound} /></div></section>;
}
