import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Place, Route, CategoryType } from '../types';
import { JerusalemMap } from '../components/JerusalemMap';
import { SIRA_CATEGORIES } from '../data/jerusalemData';
import { 
  Search, 
  Filter, 
  MapPin, 
  Navigation, 
  Volume2, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft,
  X,
  Layers,
  ArrowLeft,
  Eye
} from 'lucide-react';

interface ExploreViewProps {
  initialCategory?: string;
  places: Place[];
  routes: Route[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onNavigate: (path: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  initialCategory = 'all',
  places,
  routes,
  selectedPlace,
  onSelectPlace,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [showRouteOnMap, setShowRouteOnMap] = useState<boolean>(false);

  const activeChip = useRef<HTMLButtonElement>(null);
  useEffect(() => { activeChip.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [selectedCategory]);

  const activeRoute = showRouteOnMap ? routes[0] : null;

  // Filter places based on search and category
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesCategory =
        selectedCategory === 'all' || place.category === selectedCategory || place.layers?.includes(selectedCategory as CategoryType);

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        place.name.toLowerCase().includes(q) ||
        place.englishName.toLowerCase().includes(q) ||
        place.quarter.toLowerCase().includes(q) ||
        place.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [places, selectedCategory, searchQuery]);

  const visibleSelected = filteredPlaces.find(p => p.id === selectedPlace?.id) || null;

  return (
    <div className="sira-explore-view sira-mobile-map-layout h-[calc(100dvh-136px)] md:h-[calc(100dvh-72px)] flex flex-col md:flex-row bg-[#0D081F] text-[#FAF8F5] overflow-hidden relative">
      {/* MAP AREA (Occupies major screen space, on the left for RTL layout) */}
      <div className="sira-mobile-map-canvas h-[46%] shrink-0 md:flex-1 md:h-full relative order-1 md:order-2">
        <JerusalemMap
          places={filteredPlaces}
          selectedPlace={visibleSelected}
          onSelectPlace={onSelectPlace}
          activeRoute={activeRoute}
          className="w-full h-full"
          zoomLevel={visibleSelected ? 17 : 16}
          centerCoords={visibleSelected ? visibleSelected.location : { lat: 31.7788, lng: 35.2315 }}
          showControls={true}
          gestureHandling="greedy"
          onExplorePlace={(slug) => onNavigate(`/place/${slug}`)}
        />

        {/* Floating Route Toggle on Map */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setShowRouteOnMap(!showRouteOnMap)}
            aria-pressed={showRouteOnMap}
            aria-label={showRouteOnMap ? 'إخفاء مسار قلب القدس' : 'عرض مسار قلب القدس'}
            className={`min-w-10 min-h-10 flex items-center justify-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md border transition-all ${
              showRouteOnMap
                ? 'bg-[#E5C158] text-[#110B29] border-[#E5C158] shadow-[#D4AF37]/30'
                : 'bg-[#160E36]/90 text-[#C4B7D8] border-[#3C2975] hover:text-[#FAF8F5]'
            }`}
            title="إظهار أو إخفاء مسار رحلة في قلب القدس على الخريطة"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showRouteOnMap ? 'المسار معروض على الخريطة' : 'عرض مسار قلب القدس'}</span>
          </button>
        </div>
      </div>

      {/* DISCOVERY PANEL (On the right in RTL, styled as a discovery guide, not a generic dashboard) */}
      <aside className="sira-explore-panel sira-mobile-map-panel w-full md:w-[420px] lg:w-[460px] h-[54%] md:h-full min-h-0 bg-[#110B29] border-t md:border-t-0 md:border-l border-[#24174B] flex flex-col z-30 shadow-2xl order-2 md:order-1">
        
        {/* Panel Header */}
        <div className="sira-explore-panel-header shrink-0 p-3 md:p-5 border-b border-[#24174B] bg-[#140E2E]/90 space-y-2.5 md:space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                دليل استكشاف القدس
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[#FAF8F5] font-serif-ar">
                ماذا تريد أن تكتشف اليوم؟
              </h2>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C158]">
              <Compass className="w-4 h-4" />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مكان، باب، زقاق، أو معلم..."
              className="w-full bg-[#18103A] border border-[#3C2975] focus:border-[#E5C158] rounded-xl py-2.5 pr-10 pl-9 text-xs text-[#FAF8F5] placeholder-[#7F7296] focus:outline-none transition-all shadow-inner"
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-[#A89CB9]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 p-1 rounded-full text-[#A89CB9] hover:text-[#FAF8F5]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips (التاريخ، الدين، الجغرافيا، الهوية، الذاكرة) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SIRA_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const visibleSelected = filteredPlaces.find(p => p.id === selectedPlace?.id) || null;

  return (
                <button
                  key={cat.id}
                  ref={isActive ? activeChip : undefined}
                  aria-pressed={isActive}
                  onClick={() => {
                    const query = new URLSearchParams();
                    if (cat.id !== 'all') query.set('category', cat.id);
                    onNavigate(`/explore${query.size ? '?' + query : ''}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#110B29] shadow-md shadow-[#D4AF37]/20 font-black'
                      : 'bg-[#18103A] text-[#C4B7D8] hover:text-[#FAF8F5] border border-[#2B1E55]'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Place Highlight Banner (if selected) */}
        {visibleSelected && (
          <div className="shrink-0 p-3.5 bg-[#1B1140] border-b border-[#D4AF37]/30 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={selectedPlace.coverImage}
                alt={selectedPlace.name}
                className="w-10 h-10 rounded-lg object-cover border border-[#D4AF37]/50"
              />
              <div className="min-w-0">
                <span className="text-[10px] text-[#D4AF37] block font-semibold">المكان المختار حالياً</span>
                <h4 className="text-xs font-bold text-[#FAF8F5] truncate">{selectedPlace.name}</h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onNavigate(`/place/${selectedPlace.slug}`)}
                className="px-3 py-1 rounded-lg bg-[#E5C158] hover:bg-[#F3D77A] text-[#110B29] text-xs font-bold shadow transition-all"
              >
                صفحة المكان
              </button>
            </div>
          </div>
        )}

        {/* Places List (Discovery Cards) */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4 space-y-3 overscroll-contain">
          <div className="flex items-center justify-between text-xs text-[#A89CB9] px-1">
            <span>الأماكن المتاحة ({filteredPlaces.length}):</span>
            <span className="text-[#D4AF37]">انقر على أي مكان لتحريك الخريطة إليه</span>
          </div>

          {filteredPlaces.length === 0 ? (
            <div className="text-center py-12 text-[#A89CB9] space-y-2">
              <p className="text-sm font-semibold">لم يتم العثور على أماكن مطابقة لبحثك</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-[#E5C158] underline font-bold"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            filteredPlaces.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              const visibleSelected = filteredPlaces.find(p => p.id === selectedPlace?.id) || null;

  return (
                <div
                  key={place.id}
                  id={`explore-card-${place.slug}`}
                  role="button" tabIndex={0} aria-label={`حدد ${place.name} على الخريطة`}
                  onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectPlace(place); } }}
                  onClick={() => onSelectPlace(place)}
                  className={`cursor-pointer rounded-2xl p-3.5 border transition-all duration-200 flex items-start gap-3 relative group ${
                    isSelected
                      ? 'bg-[#1F144B] border-[#E5C158] shadow-lg shadow-[#D4AF37]/15 ring-1 ring-[#E5C158]/40'
                      : 'bg-[#160E36] border-[#291C54] hover:border-[#D4AF37]/50 hover:bg-[#1A1140]'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-[#3C2975] relative">
                    <img
                      src={place.coverImage}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-[#110B29]/90 text-[#E5C158] px-1 rounded">
                      {place.categoryLabel.split(' ')[0]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-right space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-[#D4AF37] font-semibold truncate">
                        {place.quarter}
                      </span>
                      <span className="text-[9px] font-num text-[#8E80A4]">
                        {place.location.lat.toFixed(3)}°
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#FAF8F5] group-hover:text-[#E5C158] transition-colors truncate">
                      {place.name}
                    </h3>
                    <span className="text-[10px] font-num text-[#A89CB9] block truncate">
                      {place.englishName}
                    </span>

                    <p className="text-[11px] text-[#C4B7D8] line-clamp-1 leading-snug">
                      {place.shortDescription}
                    </p>

                    {/* Quick audio indicator and actions */}
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-[#A89CB9] flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-[#E5C158]" />
                        <span className="font-num">
                          {Math.floor(place.audioStory.durationSeconds / 60)} دقيقة
                        </span>
                      </span>

                      <span className="text-[11px] font-bold text-[#E5C158] group-hover:underline flex items-center gap-0.5">
                        <span>اكتشف الحكاية</span>
                        <ChevronLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </aside>
    </div>
  );
};
