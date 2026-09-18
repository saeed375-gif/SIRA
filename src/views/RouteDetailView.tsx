import { LIFE_STORIES } from '../data/lifeData';
import { DailyLifeStory, StoryAudio } from '../components/LifeExperience';
import { PlaceChallenge } from '../components/PlaceChallenge';
import React, { useState } from 'react';
import { Route, Place, RouteStop } from '../types';
import { JerusalemMap } from '../components/JerusalemMap';
import { 
  Navigation, 
  MapPin, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  Footprints, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Compass
} from 'lucide-react';

interface RouteDetailViewProps {
  onChallengeSuccess: (id: string, points: number) => void;
  route: Route;
  places: Place[];
  onNavigate: (path: string) => void;
}

export const RouteDetailView: React.FC<RouteDetailViewProps> = ({
  route,
  onChallengeSuccess,
  places,
  onNavigate,
}) => {
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const activeStop = route.stops[activeStopIndex] || route.stops[0];

  const stopStory = LIFE_STORIES.find(s => s.id === activeStop.storyId);

  // Corresponding place data
  const correspondingPlace = places.find(
    (p) => p.id === activeStop.placeId || p.slug === activeStop.placeSlug
  );

  return (
    <div className="h-[calc(100dvh-136px)] md:h-[calc(100dvh-72px)] flex flex-col md:flex-row bg-[#0D081F] text-[#FAF8F5] overflow-hidden relative">
      
      {/* MAP CANVAS (Takes majority on left, displaying the gold polyline and stops) */}
      <div className="h-[40%] shrink-0 md:flex-1 md:h-full relative order-1 md:order-2">
        <JerusalemMap
          places={places}
          selectedPlace={correspondingPlace || null}
          activeRoute={route}
          activeStopIndex={activeStopIndex}
          onSelectStop={(_, index) => setActiveStopIndex(index)}
          className="w-full h-full"
          zoomLevel={16}
          centerCoords={{ lat: activeStop.lat, lng: activeStop.lng }}
          showControls={true}
          onExplorePlace={(slug) => onNavigate(`/place/${slug}`)}
        />

        {/* Top floating indicator */}
        <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#160E36]/90 border border-[#D4AF37]/40 text-xs font-bold text-[#E5C158] backdrop-blur-md shadow-xl">
          <Navigation className="w-3.5 h-3.5 animate-pulse" />
          <span>مسار حي نشط: {route.title}</span>
        </div>
      </div>

      {/* STEP-BY-STEP SIDEBAR PANEL (On right for RTL) */}
      <aside className="w-full md:w-[420px] lg:w-[480px] h-[60%] md:h-full min-h-0 bg-[#110B29] border-t md:border-t-0 md:border-l border-[#24174B] flex flex-col z-30 shadow-2xl order-2 md:order-1 text-right">
        
        {/* Route Header */}
        <div className="p-4 md:p-5 border-b border-[#24174B] bg-[#140E2E]/95 space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('/routes')}
              className="text-xs font-bold text-[#A89CB9] hover:text-[#FAF8F5] flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              <span>كافة المسارات</span>
            </button>

            <span className="text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-md border border-[#D4AF37]/30">
              المحطة {activeStopIndex + 1} من {route.stops.length}
            </span>
          </div>

          {route.isDemo && <p className="text-xs text-[#E5C158]">مسار تجريبي · مشاهد متخيّلة · مسافات تقديرية</p>}
          <h1 className="text-xl md:text-2xl font-bold text-[#FAF8F5] font-serif-ar leading-tight">
            {route.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-[#A89CB9] font-num">
            <span>{route.distanceKm} كم</span>
            <span>•</span>
            <span>{route.durationMinutes} دقيقة مشياً</span>
            <span>•</span>
            <span className="text-[#E5C158]">صعوبة: {route.difficulty}</span>
          </div>
        </div>

        {/* Steps Stepper Selector */}
        <div className="px-4 py-3 bg-[#160E36] border-b border-[#2B1E55] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          {route.stops.map((stop, idx) => {
            const isActive = idx === activeStopIndex;
            const isCompleted = idx < activeStopIndex;
            return (
              <button
                key={stop.stepNumber}
                id={`route-step-node-${stop.stepNumber}`}
                onClick={() => setActiveStopIndex(idx)}
                className={`flex-1 min-w-[75px] py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#E5C158] text-[#110B29] border-[#E5C158] font-bold shadow-lg shadow-[#D4AF37]/20 scale-105'
                    : isCompleted
                    ? 'bg-[#1C133D] text-[#E5C158] border-[#3C2975]'
                    : 'bg-[#110B29] text-[#8E80A4] border-[#251850] hover:border-[#D4AF37]/50'
                }`}
              >
                <div className="flex items-center gap-1 text-xs font-num">
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />}
                  <span>{String(stop.stepNumber).padStart(2, '0')}</span>
                </div>
                <span className="text-[10px] truncate max-w-[70px] mt-0.5">
                  {stop.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Stop Details Card */}
        <div key={activeStopIndex} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {!stopStory && correspondingPlace && (
            <div className="relative rounded-2xl overflow-hidden border border-[#3C2975] h-44 shadow-lg group">
              <img
                src={correspondingPlace.coverImage}
                alt={activeStop.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#110B29] via-[#110B29]/30 to-transparent" />
              <span className="absolute bottom-3 right-3 text-xs font-bold text-[#E5C158] bg-[#110B29]/80 px-2.5 py-1 rounded-lg backdrop-blur-md">
                {correspondingPlace.quarter}
              </span>
            </div>
          )}

          {!stopStory && <div className="space-y-2">
            <span className="text-xs font-semibold text-[#D4AF37] font-num">
              {activeStop.subtitle}
            </span>
            <h2 className="text-2xl font-bold text-[#FAF8F5]">
              {activeStop.title}
            </h2>
            <p className="text-sm text-[#DDD5E8] leading-relaxed">
              {activeStop.highlightText}
            </p>
          </div>}

          {stopStory && <><DailyLifeStory key={stopStory.id} story={stopStory} onNavigate={onNavigate} />
            {stopStory.audioUrl && <StoryAudio story={stopStory} />}
          </>}
          {activeStop.challenge && <PlaceChallenge key={activeStop.challenge.id} challenge={activeStop.challenge} onSuccess={points => onChallengeSuccess(activeStop.challenge!.id, points)} placeName={activeStop.subtitle} />}
          {/* Audio preview for this stop */}
          {!stopStory && correspondingPlace && (
            <div className="p-3.5 rounded-xl bg-[#160E36] border border-[#2B1E55] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#E5C158] animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-[#FAF8F5] block">
                    القصة الصوتية للمحطة
                  </span>
                  <span className="text-[10px] text-[#A89CB9] font-num">
                    {activeStop.audioDuration} دقيقة
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/place/${correspondingPlace.slug}`)}
                className="px-3 py-1.5 rounded-lg bg-[#251854] hover:bg-[#D4AF37] text-[#FAF8F5] hover:text-[#110B29] text-xs font-bold transition-all border border-[#3C2975]"
              >
                استمع الآن
              </button>
            </div>
          )}

          {/* Deep Exploration Button */}
          {correspondingPlace && (
            <button
              onClick={() => onNavigate(`/place/${correspondingPlace.slug}`)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1D1244] hover:bg-[#2A1B5E] text-[#E5C158] text-xs font-bold border border-[#D4AF37]/40 shadow transition-all active:scale-95"
            >
              <span>اكتشف حكاية {correspondingPlace.name}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stepper Navigation Buttons (Next / Prev) */}
        <div className="p-4 border-t border-[#24174B] bg-[#140E2E] flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveStopIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeStopIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#160E36] border border-[#2B1E55] text-xs font-bold text-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#251854] transition-all"
          >
            <ChevronRight className="w-4 h-4" />
            <span>المحطة السابقة</span>
          </button>

          {activeStopIndex < route.stops.length - 1 ? (
            <button
              onClick={() => setActiveStopIndex((prev) => Math.min(route.stops.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] text-xs font-bold shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95"
            >
              <span>المحطة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate(route.category === 'life' ? '/explore?category=life' : '/explore')}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold shadow-lg transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>إنهاء الرحلة والعودة للخريطة</span>
            </button>
          )}
        </div>

      </aside>
    </div>
  );
};
