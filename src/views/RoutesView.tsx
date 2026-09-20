import React from 'react';
import { Route } from '../types';
import { Navigation, Footprints, Clock, Compass, ChevronLeft, Sparkles, MapPin } from 'lucide-react';

interface RoutesViewProps {
  routes: Route[];
  onNavigate: (path: string) => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({ routes, onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] pb-24 md:pb-16 text-right">
      {/* Header */}
      <div className="bg-[#140E2E] border-b border-[#24174B] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1140] border border-[#D4AF37]/40 text-xs font-bold text-[#E5C158]">
            <Compass className="w-3.5 h-3.5" />
            <span>مسارات المشي والاستكشاف في البلدة القديمة</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#FAF8F5] font-serif-ar">
            مسارات سيرة التفاعلية
          </h1>
          <p className="text-sm text-[#C4B7D8] max-w-2xl leading-relaxed">
            امشِ في القدس كما يجب أن تُعاش؛ مسارات مرسومة خطوة بخطوة تربط المعالم ببعضها وتكشف لك أسرار الأزقة والممرات الحجرية.
          </p>
        </div>
      </div>

      {/* Routes Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {routes.map((route) => (
            <div
              key={route.id}
              className="rounded-3xl bg-[#160E36] border border-[#2B1E55] hover:border-[#D4AF37]/60 shadow-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300"
            >
              {/* Cover Image & Badges */}
              <div className="sira-image-overlay relative h-64 overflow-hidden">
                <img
                  src={route.coverImage}
                  alt={route.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#160E36] via-[#160E36]/30 to-transparent" />

                <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
                  <span className="text-xs font-bold bg-[#E5C158] text-[#110B29] px-3 py-1 rounded-lg shadow-lg">
                    {route.stops.length} محطات استكشافية
                  </span>
                  <span className="text-xs font-num font-bold bg-[#110B29]/80 text-[#FAF8F5] px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">
                    {route.distanceKm} كم • {route.durationMinutes} دقيقة
                  </span>
                </div>

                <div className="absolute bottom-3 right-4 left-4">
                  <h3 className="text-2xl font-bold text-[#FAF8F5] group-hover:text-[#E5C158] transition-colors font-serif-ar">
                    {route.title}
                  </h3>
                  <span className="text-xs font-num text-[#D4AF37] block">
                    {route.englishTitle}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <p className="text-xs sm:text-sm text-[#D8CDE8] leading-relaxed">
                  {route.description}
                </p>

                {route.slug === 'journey-in-heart-of-jerusalem' && (
                  <div className="rounded-xl border border-[#D4AF37]/30 bg-[#E5C158]/5 px-3 py-2.5 text-xs leading-relaxed text-[#D8CDE8]">
                    <Sparkles className="inline h-3.5 w-3.5 text-[#E5C158] ml-1.5" />
                    <strong className="text-[#E5C158]">رحلة سيرة:</strong> ليست محطات منفصلة؛ كل محطة تكشف فصلًا من حكاية واحدة.
                  </div>
                )}

                {/* Stops Timeline Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#A89CB9] block">
                    المحطات الرئيسية في المسار:
                  </span>
                  <div className="space-y-1.5">
                    {route.stops.map((stop) => (
                      <div
                        key={stop.stepNumber}
                        className="flex items-center gap-3 p-2 rounded-xl bg-[#110B29]/70 border border-[#2B1E55] text-xs"
                      >
                        <span className="w-6 h-6 rounded-md bg-[#251854] text-[#E5C158] font-bold font-num flex items-center justify-center flex-shrink-0">
                          {String(stop.stepNumber).padStart(2, '0')}
                        </span>
                        <span className="font-bold text-[#FAF8F5] truncate">
                          {stop.title}
                        </span>
                        <span className="text-[10px] text-[#A89CB9] mr-auto font-num">
                          {stop.audioDuration}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#271A4E] flex items-center justify-between gap-3">
                  <span className="text-xs text-[#E5C158] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>مستوى الصعوبة: {route.difficulty}</span>
                  </span>

                  <button
                    onClick={() => onNavigate(`/routes/${route.slug}`)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] font-bold text-xs shadow-xl shadow-[#D4AF37]/20 transition-all active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{route.slug === 'journey-in-heart-of-jerusalem' ? 'ابدأ حكاية الرحلة' : 'تتبع المسار على الخريطة الحية'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
