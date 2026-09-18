import React, { useState, useRef, useCallback } from 'react';
import { Sliders, History, Sparkles } from 'lucide-react';

interface OldTodaySliderProps {
  oldImage: string;
  todayImage: string;
  oldYear: string;
  todayYear: string;
  note: string;
  placeName: string;
}

export const OldTodaySlider: React.FC<OldTodaySliderProps> = ({
  oldImage,
  todayImage,
  oldYear,
  todayYear,
  note,
  placeName,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-5 md:p-6 shadow-2xl">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#E5C158]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider block">
              الذاكرة البصرية المقارنة
            </span>
            <h4 className="text-base md:text-lg font-bold text-[#FAF8F5]">
              المكان عبر الزمن: {placeName}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A89CB9]">
          <span className="px-2.5 py-1 rounded-lg bg-[#110B29] border border-[#2B1E55] font-semibold text-[#E5C158]">
            {oldYear}
          </span>
          <span>← اسحب للمقارنة →</span>
          <span className="px-2.5 py-1 rounded-lg bg-[#110B29] border border-[#2B1E55] font-semibold text-[#FAF8F5]">
            {todayYear}
          </span>
        </div>
      </div>

      {/* Comparison Canvas */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden cursor-ew-resize select-none border border-[#3C2975]"
      >
        {/* Today Image (Background) */}
        <img
          src={todayImage}
          alt={`${placeName} — ${todayYear}`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Today Tag */}
        <span className="absolute top-4 left-4 z-10 text-xs font-bold bg-[#110B29]/80 text-[#FAF8F5] px-3 py-1 rounded-lg backdrop-blur-md border border-white/20">
          صورة أحدث ({todayYear})
        </span>

        {/* Old Image (Clipped Overlay) */}
        <div
          className="absolute inset-y-0 right-0 overflow-hidden pointer-events-none transition-all duration-75"
          style={{ width: `${100 - sliderPos}%` }}
        >
          <img
            src={oldImage}
            alt={`${placeName} — الأرشيف ${oldYear}`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              maxWidth: 'none',
              transform: 'none',
              right: 0,
            }}
          />
          {/* Old Tag */}
          <span className="absolute top-4 right-4 z-10 text-xs font-bold bg-[#D4AF37] text-[#110B29] px-3 py-1 rounded-lg shadow-lg font-num">
            الأرشيف ({oldYear})
          </span>
        </div>

        {/* Divider Handle Line */}
        <div
          className="absolute inset-y-0 z-20 w-1 bg-gradient-to-b from-[#FAF8F5] via-[#E5C158] to-[#FAF8F5] shadow-[0_0_15px_rgba(229,193,88,0.7)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Center Circular Knob */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#160E36] border-2 border-[#E5C158] flex items-center justify-center shadow-2xl">
            <Sliders className="w-4 h-4 text-[#E5C158] rotate-90" />
          </div>
        </div>
      </div>

      {/* Note / Context */}
      <div className="mt-3.5 p-3 rounded-xl bg-[#110B29]/80 border border-[#2B1E55] flex items-start gap-2 text-xs text-[#D8CDE8] leading-relaxed">
        <Sparkles className="w-4 h-4 text-[#E5C158] flex-shrink-0 mt-0.5" />
        <p>{note}</p>
      </div>
    </div>
  );
};
