import { HomeLifeSection, HomeMoments, HomeLifeRoutes, HomeSounds } from '../components/LifeExperience';
import { SIRA_CATEGORIES } from '../data/jerusalemData';
import React, { useState } from 'react';
import { Place, Route, UserDiscoveryProgress } from '../types';
import { JerusalemMap } from '../components/JerusalemMap';
import { JerusalemBackdrop } from '../components/JerusalemBackdrop';
import { 
  Navigation, 
  Map, 
  Volume2, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  ChevronLeft, 
  ArrowLeft,
  Compass,
  Footprints,
  Calendar,
  Layers,
  CheckCircle2,
  Play
} from 'lucide-react';

interface HomeViewProps {
  places: Place[];
  routes: Route[];
  progress: UserDiscoveryProgress;
  onNavigate: (path: string) => void;
  onSelectPlace: (place: Place) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  places,
  routes,
  progress,
  onNavigate,
  onSelectPlace,
}) => {
  const featuredRoute = routes[0]; // «رحلة في قلب القدس»
  const [heroActivePlace, setHeroActivePlace] = useState<Place>(places[0]); // باب العمود
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredPlaces = selectedCategory === 'all'
    ? places
    : places.filter((p) => p.category === selectedCategory || p.layers?.includes(selectedCategory as any));

  return (
    <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] pb-24 md:pb-16 overflow-hidden">
      {/* HERO SECTION (Split: Story & Live Interactive Mini Map) */}
      <section className="sira-home-hero relative pt-8 md:pt-16 pb-24 md:pb-28 border-b border-[#24174B] overflow-hidden">
        <JerusalemBackdrop />

        <div className="relative z-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column (Content & Storytelling) */}
            <div className="lg:col-span-6 text-right space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18103A] border border-[#D4AF37]/40 text-xs font-bold text-[#E5C158] shadow-md shadow-[#D4AF37]/10">
                <span className="w-2 h-2 rounded-full bg-[#E5C158] animate-ping" />
                <span>تجربة رقمية حية لاكتشاف القدس</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#FAF8F5] leading-tight tracking-tight font-serif-ar">
                  لا تكتفِ برؤية القدس...
                  <br />
                  <span className="sira-hero-title-highlight text-transparent bg-clip-text bg-gradient-to-l from-[#E5C158] via-[#F3D77A] to-[#FAF8F5]">
                    عِش حكايتها
                  </span>
                </h1>
                <p className="text-sm font-semibold text-[#D4AF37] tracking-wider">
                  كل مكان يحمل حكاية • وكل حجر يشهد على تاريخ
                </p>
              </div>

              {/* Subtitle description */}
              <p className="text-sm sm:text-base text-[#D8CDE8] leading-relaxed max-w-xl">
                «سيرة» ليست مجرد منصة معلومات، بل رحلة تفاعلية حية تربط أزقة القدس العتيقة بحكاياتها، وتاريخها، ودينها، وجغرافيتها، وذاكرتها وحياتها اليومية عبر خريطة تفاعلية وحكايات مرتبطة بالمكان.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="hero-start-journey-btn"
                  onClick={() => onNavigate(`/routes/${featuredRoute.slug}`)}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] font-bold text-sm shadow-xl shadow-[#D4AF37]/25 transition-all active:scale-95"
                >
                  <Footprints className="w-4 h-4" />
                  <span>ابدأ رحلتك</span>
                </button>

                <button
                  id="hero-explore-map-btn"
                  onClick={() => onNavigate('/explore')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#18103A] hover:bg-[#251854] text-[#FAF8F5] font-bold text-sm border border-[#3C2975] hover:border-[#D4AF37]/60 shadow-xl transition-all active:scale-95"
                >
                  <Map className="w-4 h-4 text-[#E5C158]" />
                  <span>استكشف الخريطة</span>
                </button>
              </div>

              {/* Quick stats / Features tick */}
              <div className="pt-4 border-t border-[#24174B] grid grid-cols-3 gap-4 text-xs text-[#A89CB9]">
                <div>
                  <span className="block text-lg font-bold text-[#E5C158] font-num">144</span>
                  <span>دونماً من القداسة</span>
                </div>
                <div>
                  <span className="block text-lg font-bold text-[#FAF8F5] font-num">04</span>
                  <span>محطات في المسار</span>
                </div>
                <div>
                  <span className="block text-lg font-bold text-[#E5C158] font-num">الحياة</span>
                  <span>طبقة جديدة للاكتشاف</span>
                </div>
              </div>
            </div>

            {/* Right Column (Hero Mini Interactive Live Map & Quick Card) */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl p-2.5 bg-gradient-to-b from-[#2D1F5B] to-[#160E36] border border-[#D4AF37]/35 shadow-2xl overflow-hidden">
                
                {/* Mini Top Banner */}
                <div className="px-4 py-2.5 flex items-center justify-between text-xs border-b border-[#2A1D54] bg-[#110B29]/70 backdrop-blur-md rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
                    <span className="font-bold text-[#FAF8F5]">خريطة القدس الحية التفاعلية</span>
                  </div>
                  <button
                    onClick={() => onNavigate('/explore')}
                    className="min-h-10 -my-2 text-[11px] font-bold text-[#E5C158] hover:underline flex items-center gap-1"
                  >
                    <span>تكبير الشاشة</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>

                {/* Live Real Google Map Component */}
                <div className="h-[360px] sm:h-[420px] rounded-2xl overflow-hidden relative">
                  <JerusalemMap
                    places={places}
                    selectedPlace={heroActivePlace}
                    onSelectPlace={(place) => setHeroActivePlace(place)}
                    activeRoute={featuredRoute}
                    className="w-full h-full"
                    zoomLevel={16}
                    centerCoords={heroActivePlace.location}
                    showControls={true}
                    onExplorePlace={(slug) => onNavigate(`/place/${slug}`)}
                  />
                </div>

                {/* Floating Quick Route Stepper inside Hero */}
                <div className="sira-map-stepper p-3 bg-[#110B29]/90 border-t border-[#24174B] rounded-b-2xl flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#A89CB9] font-medium hidden sm:inline">
                    محطات المسار المفتوح:
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-around sm:justify-start">
                    {featuredRoute.stops.map((stop, idx) => {
                      const isCurrent = heroActivePlace.slug === stop.placeSlug;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            const found = places.find((p) => p.slug === stop.placeSlug);
                            if (found) setHeroActivePlace(found);
                          }}
                          className={`min-w-10 min-h-10 px-2.5 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                            isCurrent
                              ? 'bg-[#E5C158] text-[#110B29] shadow-md shadow-[#D4AF37]/30 scale-105'
                              : 'bg-[#1D143D] text-[#C4B7D8] hover:text-[#FAF8F5]'
                          }`}
                        >
                          <span className="font-num">{String(stop.stepNumber).padStart(2, '0')}</span>
                          <span className="hidden md:inline">{stop.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PLACES DISCOVERY GRID WITH FILTER */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="text-right">
            <span className="text-xs font-bold text-[#D4AF37] tracking-wider uppercase block mb-1">
              معالم القدس الأصيلة
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#FAF8F5] font-serif-ar">
              اختر مكاناً واكتشف حكايته
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {SIRA_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#E5C158] text-[#110B29] shadow-md shadow-[#D4AF37]/20'
                    : 'bg-[#18103A] text-[#C4B7D8] hover:text-[#FAF8F5] border border-[#2B1E55]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Places Grid (Inspired by the Al-Aqsa Poster Card) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => {
            const isDiscovered = progress.discoveredPlaceIds.includes(place.id);
            return (
              <div
                key={place.id}
                className="group rounded-2xl bg-[#160E36] border border-[#2B1E55] hover:border-[#D4AF37]/60 shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 relative"
              >
                {/* Place Cover Image */}
                <div className="sira-image-overlay relative h-52 overflow-hidden">
                  <img
                    src={place.coverImage}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#160E36] via-[#160E36]/20 to-transparent" />

                  {/* Top tags */}
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold bg-[#110B29]/80 text-[#E5C158] px-2.5 py-1 rounded-lg backdrop-blur-md border border-[#D4AF37]/30">
                      {place.categoryLabel}
                    </span>
                    {isDiscovered && (
                      <span className="text-[10px] font-bold bg-[#0E3A24] text-[#86EFAC] px-2 py-0.5 rounded-md flex items-center gap-1 border border-[#22C55E]/40">
                        <CheckCircle2 className="w-3 h-3" />
                        تم الاكتشاف
                      </span>
                    )}
                  </div>

                  {/* Quarter location */}
                  <span className="absolute bottom-2 right-3 text-xs font-semibold text-[#D4AF37] drop-shadow-md">
                    {place.quarter}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between text-right space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#FAF8F5] group-hover:text-[#E5C158] transition-colors">
                      {place.name}
                    </h3>
                    <span className="text-xs font-num text-[#8E80A4] block">
                      {place.englishName}
                    </span>
                    <p className="text-xs text-[#C4B7D8] line-clamp-2 mt-2 leading-relaxed">
                      {place.shortDescription}
                    </p>
                  </div>

                  {/* Card Footer with Audio pill and CTA */}
                  <div className="pt-3 border-t border-[#271A4E] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-[#A89CB9]">
                      <Volume2 className="w-3.5 h-3.5 text-[#E5C158]" />
                      <span className="font-num">
                        {Math.floor(place.audioStory.durationSeconds / 60)}:
                        {(place.audioStory.durationSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <button
                      id={`card-discover-btn-${place.slug}`}
                      onClick={() => onNavigate(`/place/${place.slug}`)}
                      className="inline-flex min-h-10 items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#23164F] hover:bg-[#D4AF37] text-[#FAF8F5] hover:text-[#110B29] text-xs font-bold transition-all border border-[#3C2975] hover:border-[#D4AF37]"
                    >
                      <span>اكتشف الحكاية</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <HomeLifeSection onNavigate={onNavigate} />
      <HomeMoments onNavigate={onNavigate} />
      <HomeLifeRoutes onNavigate={onNavigate} />
      {/* FEATURED ROUTE SHOWCASE («رحلة في قلب القدس») */}
      <section className="sira-inverted-panel py-12 md:py-16 bg-gradient-to-b from-[#110B29] to-[#150D33] border-b border-[#24174B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#1A103D] via-[#201446] to-[#160E36] border border-[#D4AF37]/40 p-6 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4 text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#E5C158]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>المسار التجريبي الذهبي</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#FAF8F5] font-serif-ar">
                  {featuredRoute.title}
                </h2>
                <p className="text-sm font-semibold text-[#D4AF37] font-num">
                  {featuredRoute.englishTitle}
                </p>

                <p className="text-sm text-[#D8CDE8] leading-relaxed">
                  {featuredRoute.description}
                </p>

                {/* Stops Stepper (01 -> 02 -> 03 -> 04) */}
                <div className="py-4 space-y-3">
                  <span className="text-xs font-bold text-[#FAF8F5] block">
                    محطات المسار الميدانية:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {featuredRoute.stops.map((stop) => (
                      <div
                        key={stop.stepNumber}
                        onClick={() => onNavigate(`/place/${stop.placeSlug}`)}
                        className="cursor-pointer p-3 rounded-xl bg-[#110B29]/70 border border-[#2F2160] hover:border-[#D4AF37] transition-all flex items-center gap-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#2B1D56] group-hover:bg-[#D4AF37] text-[#E5C158] group-hover:text-[#110B29] font-bold font-num flex items-center justify-center transition-colors">
                          {String(stop.stepNumber).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#FAF8F5] group-hover:text-[#E5C158] truncate">
                            {stop.title}
                          </h4>
                          <span className="text-[10px] text-[#A89CB9] block font-num">
                            {stop.audioDuration} صوتي
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => onNavigate(`/routes/${featuredRoute.slug}`)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] font-bold text-xs sm:text-sm shadow-xl shadow-[#D4AF37]/25 transition-all active:scale-95"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>تتبع المسار خطوة بخطوة على الخريطة</span>
                  </button>

                  <span className="text-xs text-[#C4B7D8] font-num">
                    {featuredRoute.distanceKm} كم • حوالي {featuredRoute.durationMinutes} دقيقة مشياً
                  </span>
                </div>
              </div>

              {/* Visual Cover */}
              <div className="lg:col-span-5">
                <div className="sira-image-overlay relative rounded-2xl overflow-hidden border border-[#483387] shadow-2xl group">
                  <img
                    src={featuredRoute.coverImage}
                    alt={featuredRoute.title}
                    className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#110B29] via-[#110B29]/30 to-transparent" />
                  
                  <div className="absolute bottom-4 right-4 left-4 text-right">
                    <span className="text-[11px] font-bold text-[#E5C158] bg-[#110B29]/80 px-2.5 py-1 rounded-lg backdrop-blur-md">
                      من باب العمود إلى الحرم الشريف
                    </span>
                    <h3 className="text-lg font-bold text-[#FAF8F5] mt-1.5">
                      مسار الحكاية والهوية المقدسية
                    </h3>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <HomeSounds onNavigate={onNavigate} />
      <section className="life-paper py-16 px-6 text-center"><span className="text-xs">رسالة سيرة</span><h2 className="font-serif-ar text-3xl sm:text-4xl leading-relaxed mt-4">لا نريك القدس فقط…<br />نعرّفك كيف عاشت، وكيف تعيش.</h2><button className="life-button mt-6" onClick={() => onNavigate('/about')}>تعرّف إلى سيرة</button></section>

    </div>
  );
};
