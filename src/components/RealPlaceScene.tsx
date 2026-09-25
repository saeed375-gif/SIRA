import { useState } from 'react';
import { ExternalLink, Eye, Play, Rotate3D, ShieldCheck } from 'lucide-react';
import type { Place } from '../types';

type ExternalTour = {
  kind: 'tour';
  title: string;
  summary: string;
  embedUrl: string;
  sourceUrl: string;
  sourceLabel: string;
  credit: string;
};

const REAL_TOURS: Record<string, ExternalTour> = {
  'bab-al-amoud': {
    kind: 'tour',
    title: 'باب العمود بزاوية 360°',
    summary: 'جولة حقيقية تدخل عبر باب العمود إلى البلدة القديمة. اسحب داخل المشهد للنظر في جميع الاتجاهات.',
    embedUrl: 'https://www.youtube-nocookie.com/embed/FwMFew_Nrn0?rel=0&modestbranding=1',
    sourceUrl: 'https://www.youtube.com/watch?v=FwMFew_Nrn0',
    sourceLabel: 'Jerusalem 360° tour — YouTube',
    credit: 'تصوير 360° منشور من المصدر الأصلي',
  },
  'holy-sepulchre': {
    kind: 'tour',
    title: 'كنيسة القيامة — جولة VR حقيقية',
    summary: 'تجربة تجوال أصلية داخل الكنيسة، مع محطات تفاعلية للمَعالم الداخلية.',
    embedUrl: 'https://intertech.ps/qiyama/',
    sourceUrl: 'https://www.intertech.ps/en/Article/96/Church-of-the-Holy-Sepulchre-VR-360',
    sourceLabel: 'InterTech Palestine — Church VR-360',
    credit: 'جولة واقع افتراضي من InterTech فلسطين',
  },
  'al-aqsa-mosque': {
    kind: 'tour',
    title: 'المسجد الأقصى — جولة حقيقية 360°',
    summary: 'جولة 4K حقيقية في ساحات الأقصى وقبة الصخرة والمصلى القبلي. حرّك المشهد بلمسك أو بالفأرة.',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Ol2LGO7Nl6c?rel=0&modestbranding=1',
    sourceUrl: 'https://interactive.aljazeera.com/aje/2016/al-aqsa-mosque-jerusalem-360-degrees-tour-4k-video/index.html',
    sourceLabel: 'Al Jazeera — Al Aqsa 360°',
    credit: 'إنتاج الجزيرة — جولة 4K بزاوية 360°',
  },
};

export function RealPlaceScene({ place }: { place: Place }) {
  const [isOpen, setIsOpen] = useState(false);
  const tour = REAL_TOURS[place.slug];
  const video = place.videoStory;
  const title = tour?.title || `مشهد حقيقي من ${place.name}`;
  const summary = tour?.summary || 'لقطة حقيقية مرخّصة من المكان. لا تتوفر جولة 360° موثقة لهذا الموقع حتى الآن.';
  const poster = video?.posterUrl || place.coverImage;

  return (
    <section id="real-scene-section" className="sira-real-scene" aria-labelledby="real-scene-title">
      <div className="sira-real-scene-header">
        <div>
          <span><Eye size={15} /> تجربة موثقة من المكان</span>
          <h2 id="real-scene-title">{title}</h2>
          <p>{summary}</p>
        </div>
        <span className={`sira-real-scene-badge ${tour ? 'is-360' : ''}`}>{tour ? <Rotate3D size={15} /> : <Play size={15} fill="currentColor" />}{tour ? '360° حقيقي' : 'مشهد حي مرخّص'}</span>
      </div>

      {!isOpen ? (
        <div className="sira-real-scene-launch">
          <img src={poster} alt="" aria-hidden="true" loading="lazy" />
          <div />
          <button type="button" onClick={() => setIsOpen(true)}>
            {tour ? <Rotate3D size={18} /> : <Play size={18} fill="currentColor" />}
            {tour ? 'ابدأ الجولة الواقعية' : 'شاهد المشهد الحقيقي'}
          </button>
          <span>{tour ? 'يُحمّل عند الطلب فقط' : 'لقطة مرخّصة من صفحة المكان'}</span>
        </div>
      ) : tour ? (
        <div className="sira-real-scene-frame">
          <iframe
            src={tour.embedUrl}
            title={tour.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : video ? (
        <div className="sira-real-scene-frame">
          <video controls playsInline preload="metadata" poster={video.posterUrl} aria-label={video.title}>
            <source src={video.videoUrl} type="video/mp4" />
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        </div>
      ) : null}

      <footer>
        <span><ShieldCheck size={14} /> {tour?.credit || `لقطة حقيقية مرخّصة · ${video?.license || 'من المصدر المذكور'}`}</span>
        {(tour || video) && <a href={tour?.sourceUrl || video?.sourceUrl} target="_blank" rel="noreferrer"><span>{tour?.sourceLabel || video?.sourceLabel}</span><ExternalLink size={14} /></a>}
      </footer>
      {!tour && <p className="sira-real-scene-note">نبحث عن جولة 360° أصلية لهذا الموقع. لن نستبدل المشهد الحقيقي بمحاكاة أو صورة مولّدة.</p>}
    </section>
  );
}
