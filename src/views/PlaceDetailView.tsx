import { PlaceLifeSection } from '../components/LifeExperience';
import { storiesForPlace } from '../data/lifeData';
import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { AudioStoryPlayer } from '../components/AudioStoryPlayer';
import { OldTodaySlider } from '../components/OldTodaySlider';
import { InteractiveTimeline } from '../components/InteractiveTimeline';
import { PlaceChallenge } from '../components/PlaceChallenge';
import { SourcesModal } from '../components/SourcesModal';
import { JerusalemMap } from '../components/JerusalemMap';
import { RealPlaceScene } from '../components/RealPlaceScene';
import { 
  MapPin, 
  Map, 
  Volume2, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Compass, 
  ArrowLeft, 
  ChevronLeft, 
  Share2, 
  Bookmark, 
  Heart,
  Navigation,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
  Play
} from 'lucide-react';

interface PlaceDetailViewProps {
  place: Place;
  allPlaces: Place[];
  onNavigate: (path: string) => void;
  onPlaceChallengeSuccess: (placeId: string, points: number) => boolean;
  isFavorite: boolean;
  onToggleFavorite: (placeId: string) => void;
}

export const PlaceDetailView: React.FC<PlaceDetailViewProps> = ({
  place,
  allPlaces,
  onNavigate,
  onPlaceChallengeSuccess,
  isFavorite,
  onToggleFavorite,
}) => {
  const [sourcesModalOpen, setSourcesModalOpen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [focusNearbyPlace, setFocusNearbyPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (window.location.hash) requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' }));
  }, [place.id]);

  // Next place in discovery chain
  const nextPlace = allPlaces.find((p) => p.slug === place.nextPlaceSlug) || allPlaces[0];

  // Scroll to section helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `سيرة | ${place.name}`,
        text: place.shortDescription,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] pb-24 md:pb-16 text-right">
      
      {/* CINEMATIC HERO SECTION */}
      <section className="sira-image-hero relative min-h-[690px] md:min-h-0 md:h-[75vh] w-full overflow-hidden flex items-end">
        {/* Cinematic Backdrop Image */}
        <img
          src={place.coverImage}
          alt={place.name}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
        />

        {/* Deep Atmospheric Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D081F] via-[#0D081F]/40 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#110B29]/60 via-transparent to-[#110B29]/60" />

        {/* Top Floating Actions Bar */}
        <div className="absolute top-6 right-4 left-4 max-w-7xl mx-auto flex items-center justify-between z-20">
          <button
            onClick={() => onNavigate('/explore')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#110B29]/80 hover:bg-[#1C123D] text-[#FAF8F5] border border-[#3C2975] backdrop-blur-md text-xs font-bold transition-all shadow-xl active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة إلى الخريطة</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(place.id)}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-xl active:scale-95 ${
                isFavorite
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-[#110B29]'
                  : 'bg-[#110B29]/80 border-[#3C2975] text-[#FAF8F5] hover:text-[#E5C158]'
              }`}
              title={isFavorite ? 'محفوظ في مفضلتي' : 'إضافة إلى المفضلة'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-[#110B29]/80 hover:bg-[#1C123D] border border-[#3C2975] text-[#FAF8F5] backdrop-blur-md transition-all shadow-xl active:scale-95"
              title="مشاركة الحكاية"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Content Information Box */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-10 pt-28 w-full">
          <div className="space-y-3 max-w-3xl">
            {/* Category and Quarter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold bg-[#E5C158] text-[#110B29] px-3 py-1 rounded-lg font-num shadow-lg">
                {place.categoryLabel}
              </span>
              <span className="text-xs font-semibold text-[#D4AF37] bg-[#110B29]/80 border border-[#D4AF37]/30 px-3 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E5C158]" />
                {place.quarter}
              </span>
              <span className="text-xs text-[#A89CB9] bg-[#110B29]/70 px-2.5 py-1 rounded-lg font-num backdrop-blur-md">
                {place.location.lat.toFixed(4)}°N, {place.location.lng.toFixed(4)}°E
              </span>
            </div>

            {/* Place Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#FAF8F5] tracking-tight font-serif-ar drop-shadow-xl">
              {place.name}
            </h1>
            <span className="text-sm sm:text-base font-semibold text-[#D4AF37] font-num block tracking-wider">
              {place.englishName}
            </span>

            {/* Excerpt */}
            <p className="text-sm sm:text-base text-[#F2EDF8] leading-7 max-w-2xl rounded-xl border border-white/10 bg-[#110B29]/70 px-3 py-2.5 backdrop-blur-sm">
              {place.shortDescription}
            </p>

            {/* Hero Quick Jump CTAs */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-4">
              <button
                id="hero-see-on-map-cta"
                onClick={() => scrollToSection('geography-section')}
                className="min-h-12 flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] font-bold text-xs sm:text-sm shadow-xl shadow-[#D4AF37]/25 transition-all active:scale-95"
              >
                <Map className="w-4 h-4" />
                <span>شاهد الموقع على الخريطة الحية</span>
              </button>

              <button
                onClick={() => scrollToSection('audio-section')}
                className="min-h-12 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#160E36]/90 hover:bg-[#251854] text-[#FAF8F5] font-bold text-xs sm:text-sm border border-[#3C2975] hover:border-[#D4AF37] backdrop-blur-md shadow-xl transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-[#E5C158]" />
                <span>استمع إلى القصة ({Math.floor(place.audioStory.durationSeconds / 60)} د)</span>
              </button>

              {place.videoStory && (
                <button
                  onClick={() => scrollToSection('video-section')}
                  className="min-h-12 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#160E36]/90 hover:bg-[#251854] text-[#FAF8F5] font-bold text-xs sm:text-sm border border-[#3C2975] hover:border-[#D4AF37] backdrop-blur-md shadow-xl transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 text-[#E5C158] fill-current" />
                  <span>شاهد مشهد المكان</span>
                </button>
              )}

              <button
                onClick={() => scrollToSection('real-scene-section')}
                className="min-h-12 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#160E36]/90 hover:bg-[#251854] text-[#FAF8F5] font-bold text-xs sm:text-sm border border-[#3C2975] hover:border-[#D4AF37] backdrop-blur-md shadow-xl transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#E5C158]" />
                <span>شاهد المشهد الواقعي</span>
              </button>

              <button
                onClick={() => scrollToSection('challenge-section')}
                className="min-h-12 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#160E36]/90 hover:bg-[#251854] text-[#E5C158] font-bold text-xs sm:text-sm border border-[#D4AF37]/40 backdrop-blur-md shadow-xl transition-all active:scale-95 min-[420px]:col-span-2 sm:col-span-1"
              >
                <Award className="w-4 h-4" />
                <span>تحدي المكان</span>
              </button>
            </div>
          </div>
        </div>

        {/* Copied alert toast */}
        {copiedToast && (
          <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#160E36] text-[#E5C158] px-4 py-2 rounded-xl border border-[#D4AF37] text-xs font-bold shadow-2xl animate-in fade-in duration-200">
            تم نسخ رابط الحكاية بنجاح!
          </div>
        )}
      </section>

      <nav aria-label="أقسام المكان" className="sticky top-[72px] z-30 bg-[#110B29]/95 backdrop-blur border-y border-[#3C2975] flex gap-5 overflow-x-auto px-5 py-3 text-xs text-[#E5C158]">
        {[['timeline-section', 'التاريخ'], ['real-scene-section', 'مشهد واقعي'], ['geography-section', 'الجغرافيا'], ...(storiesForPlace(place.id).length ? [['life-section', 'الحياة في المكان']] : []), ...(place.videoStory ? [['video-section', 'المشهد الحي']] : []), ['audio-section', 'الصوت'], ['challenge-section', 'التحدي']].map(([id, label]) => <button key={id} className="shrink-0 py-2" onClick={() => scrollToSection(id)}>{label}</button>)}
      </nav>
      {/* MAIN PROGRESSIVE DISCOVERY BODY */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* 1. الحكاية الكاملة (The Full Story) with Verified Seal */}
        <section className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-[#251850] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-[#E5C158]" />
              <h2 className="text-xl md:text-2xl font-bold text-[#FAF8F5] font-serif-ar">
                الحكاية والمكان
              </h2>
            </div>

            <button
              onClick={() => setSourcesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#110B29] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs font-bold text-[#E5C158] transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-[#E5C158]" />
              <span>المصادر والمخطوطات المعتمدة ({place.sources.length})</span>
            </button>
          </div>

          <p className="text-base md:text-lg text-[#E2DCEB] font-serif-ar leading-loose">
            {place.fullStory}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-[#251850]">
            <span className="text-xs text-[#A89CB9] ml-2">الوسوم:</span>
            {place.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-[#110B29] text-[#C4B7D8] px-3 py-1 rounded-lg border border-[#2F2160]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        <PlaceLifeSection place={place} onNavigate={onNavigate} onSuccess={points => onPlaceChallengeSuccess(`life:${place.id}`, points)} />

        <RealPlaceScene place={place} />

        {/* 2. استمع إلى حكاية المكان (Custom Audio Player with Waveform) */}
        <section id="audio-section">
          <AudioStoryPlayer
            title={place.audioStory.title}
            durationSeconds={place.audioStory.durationSeconds}
            narrator={place.audioStory.narrator}
            script={place.audioStory.script}
            highlights={place.audioStory.audioTextHighlights}
            placeName={place.name}
            audioUrl={place.audioStory.audioUrl}
            isAiGenerated={place.audioStory.isAiGenerated}
          />
        </section>

        {place.videoStory && (
          <section id="video-section" className="overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[#160E36] shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2B1E55] px-5 py-4 md:px-6">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#E5C158]"><Play className="h-4 w-4 fill-current" /></span>
                <div>
                  <span className="text-[10px] font-bold tracking-[0.16em] text-[#D4AF37]">مشهد حي من المكان</span>
                  <h2 className="mt-0.5 text-lg font-bold text-[#FAF8F5] font-serif-ar">{place.videoStory.title}</h2>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#C4B7D8]">{place.videoStory.description}</p>
                </div>
              </div>
              <span className="rounded-full border border-[#3C2975] bg-[#110B29] px-3 py-1.5 text-[11px] font-num text-[#E5C158]">{Math.round(place.videoStory.durationSeconds)} ثانية</span>
            </div>
            <div className="relative aspect-video bg-[#090614]">
              <video controls playsInline preload="metadata" poster={place.videoStory.posterUrl} className="h-full w-full object-cover" aria-label={place.videoStory.title}>
                <source src={place.videoStory.videoUrl} type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو.
              </video>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#110B29]/75 px-5 py-3 text-[11px] text-[#A89CB9] md:px-6">
              <span>لقطة حقيقية مرخّصة · {place.videoStory.license}</span>
              <a href={place.videoStory.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#E5C158] hover:underline">{place.videoStory.sourceLabel}<ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
          </section>
        )}

        {/* 3. عبر التاريخ (Interactive Timeline Scrubber) */}
        <section id="timeline-section">
          <InteractiveTimeline
            events={place.timeline}
            placeName={place.name}
          />
        </section>

        {/* 4. بين الأمس واليوم (Old vs Today Interactive Slider) */}
        <section id="comparison-section">
          <OldTodaySlider
            oldImage={place.comparison.oldImage}
            todayImage={place.comparison.todayImage}
            oldYear={place.comparison.oldYear}
            todayYear={place.comparison.todayYear}
            note={place.comparison.note}
            placeName={place.name}
          />
        </section>

        {/* 5. جغرافيا المكان (Live Google Map + "ماذا يوجد حولك؟") */}
        <section id="geography-section" className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#E5C158]">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider block">
                  الجغرافيا الحية
                </span>
                <h3 className="text-xl font-bold text-[#FAF8F5]">
                  موقع {place.name} على الخريطة ومحيطه
                </h3>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/explore')}
              className="text-xs font-bold text-[#E5C158] hover:underline flex items-center gap-1"
            >
              <span>فتح في الخريطة الكاملة</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Mini Interactive Google Map for this Place */}
          <div className="h-72 md:h-96 rounded-2xl overflow-hidden border border-[#3C2975] relative shadow-inner">
            <JerusalemMap
              places={allPlaces}
              selectedPlace={focusNearbyPlace || place}
              onSelectPlace={(p) => setFocusNearbyPlace(p)}
              className="w-full h-full"
              zoomLevel={17}
              centerCoords={(focusNearbyPlace || place).location}
              showControls={true}
              onExplorePlace={(slug) => onNavigate(`/place/${slug}`)}
            />
          </div>

          {/* "ماذا يوجد حولك؟" Nearby Places with Click-to-Pan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#C4B7D8]">
              <span className="font-bold text-[#FAF8F5]">ماذا يوجد حولك في البلدة القديمة؟</span>
              <span>اضغط على أي معلم لتحريك الخريطة إليه مباشرة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {place.nearbyPlaces.map((near, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const target = allPlaces.find((p) => p.id === near.placeId);
                    if (target) {
                      setFocusNearbyPlace(target);
                    }
                  }}
                  className="cursor-pointer p-3.5 rounded-xl bg-[#110B29] border border-[#2F2160] hover:border-[#D4AF37] transition-all flex flex-col justify-between text-right group"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#E5C158] block mb-1">
                      {near.distanceMeters} متراً • {near.walkMinutes} دقائق مشياً
                    </span>
                    <h4 className="text-sm font-bold text-[#FAF8F5] group-hover:text-[#E5C158] transition-colors truncate">
                      {near.name}
                    </h4>
                    <span className="text-[10px] font-num text-[#8E80A4] truncate block">
                      {near.englishName}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#25184B] flex items-center justify-between text-[11px] text-[#A89CB9]">
                    <span className="group-hover:text-[#FAF8F5]">وجّه الخريطة</span>
                    <Navigation className="w-3 h-3 text-[#E5C158] group-hover:translate-x-[-2px] transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. الدلالة الدينية والروحية & الذاكرة الشعبية */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Religious Significance */}
          <div className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-[#E5C158]">
              <Flame className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#FAF8F5]">
                الدلالة الدينية والروحية
              </h3>
            </div>
            <p className="text-sm text-[#DDD5E8] leading-relaxed">
              {place.religiousSignificance}
            </p>
          </div>

          {/* Living Memory */}
          <div className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-[#E5C158]">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#FAF8F5]">
                ذاكرة المكان والإنسان
              </h3>
            </div>
            <p className="text-sm text-[#DDD5E8] leading-relaxed">
              {place.livingMemory}
            </p>
          </div>
        </section>

        {/* 7. معرض الصور الحي */}
        <section className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-[#FAF8F5] font-serif-ar">
            مشاهد من {place.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {place.gallery.map((img, idx) => (
              <div
                key={idx}
                className="sira-image-overlay group relative rounded-xl overflow-hidden border border-[#3C2975] h-52"
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#110B29] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2 right-2 left-2 text-right">
                  <span className="text-[10px] text-[#D4AF37] font-num block">
                    {img.year}
                  </span>
                  <p className="text-xs font-semibold text-[#FAF8F5] line-clamp-1">
                    {img.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <a
          href={`/image-credits.html#${place.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-[#E5C158] underline underline-offset-4 hover:text-white"
        >
          مصادر صور {place.name} وتواريخها وتراخيصها
        </a>

        {/* 8. تحدي المكان (Place Challenge with Instant Score & Confetti) */}
        <section id="challenge-section">
          <PlaceChallenge
            challenge={place.challenge}
            placeName={place.name}
            onSuccess={(pts) => onPlaceChallengeSuccess(place.id, pts)}
            nextPlaceSlug={place.nextPlaceSlug}
            onNavigateToNext={(slug) => onNavigate(`/place/${slug}`)}
          />
        </section>

        {/* 9. المكان يقودك إلى... (Connected Journey Link) */}
        <section className="rounded-2xl bg-gradient-to-br from-[#1E1245] to-[#140E36] border border-[#D4AF37]/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="text-right space-y-1">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
              واصل مسار الحكاية
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-[#FAF8F5] font-serif-ar">
              المكان يقودك إلى: {nextPlace.name}
            </h3>
            <p className="text-xs md:text-sm text-[#C4B7D8] max-w-lg leading-relaxed">
              {nextPlace.shortDescription}
            </p>
          </div>

          <button
            onClick={() => onNavigate(`/place/${nextPlace.slug}`)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] font-bold text-xs md:text-sm shadow-xl shadow-[#D4AF37]/25 transition-all active:scale-95 flex-shrink-0"
          >
            <span>انتقل إلى {nextPlace.name}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </section>

      </main>

      {/* SOURCES AND MANUSCRIPTS MODAL */}
      <SourcesModal
        sources={place.sources}
        placeName={place.name}
        isOpen={sourcesModalOpen}
        onClose={() => setSourcesModalOpen(false)}
      />
    </div>
  );
};
