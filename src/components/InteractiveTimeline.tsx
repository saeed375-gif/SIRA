import React, { useState } from 'react';
import { TimelineEvent } from '../types';
import { Calendar, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface InteractiveTimelineProps {
  events: TimelineEvent[];
  placeName: string;
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({
  events,
  placeName,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const activeEvent = events[selectedIndex] || events[0];

  return (
    <div className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-5 md:p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#E5C158]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider block">
              طبقات الزمن
            </span>
            <h4 className="text-base md:text-lg font-bold text-[#FAF8F5]">
              الخط الزمني التفاعلي: {placeName}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
            disabled={selectedIndex === 0}
            className="p-1.5 rounded-lg bg-[#110B29] border border-[#2B1E55] text-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#251854] transition-colors"
            title="الحقبة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-num text-[#A89CB9] px-2">
            {selectedIndex + 1} / {events.length}
          </span>
          <button
            onClick={() => setSelectedIndex((prev) => Math.min(events.length - 1, prev + 1))}
            disabled={selectedIndex === events.length - 1}
            className="p-1.5 rounded-lg bg-[#110B29] border border-[#2B1E55] text-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#251854] transition-colors"
            title="الحقبة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Year Scrubber Track */}
      <div className="relative mb-8 pb-4 pt-2">
        {/* Background line */}
        <div className="absolute top-6 left-4 right-4 h-0.5 bg-[#2B1E55]" />
        
        {/* Active progress line */}
        <div
          className="absolute top-6 right-4 h-0.5 bg-gradient-to-l from-[#D4AF37] to-[#E5C158] transition-all duration-300"
          style={{
            width: `${(selectedIndex / (events.length - 1 || 1)) * 100}%`,
          }}
        />

        {/* Buttons per year */}
        <div className="relative flex justify-between items-center px-2">
          {events.map((ev, idx) => {
            const isSelected = idx === selectedIndex;
            const isPast = idx < selectedIndex;
            return (
              <button
                key={idx}
                id={`timeline-node-${idx}`}
                onClick={() => setSelectedIndex(idx)}
                className="group flex flex-col items-center focus:outline-none transition-all"
              >
                {/* Node Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#E5C158] ring-4 ring-[#E5C158]/30 scale-125 shadow-lg shadow-[#D4AF37]/50'
                      : isPast
                      ? 'bg-[#D4AF37] ring-2 ring-[#2B1E55]'
                      : 'bg-[#1C123D] border border-[#3C2975] group-hover:border-[#E5C158]'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-[#110B29]' : isPast ? 'bg-[#110B29]' : 'bg-[#6D5E8C]'
                    }`}
                  />
                </div>

                {/* Year Label */}
                <span
                  className={`mt-2.5 text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? 'text-[#E5C158] scale-110'
                      : 'text-[#8E80A4] group-hover:text-[#FAF8F5]'
                  }`}
                >
                  {ev.year}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Period Detail Card with Smooth Fade */}
      <div
        key={selectedIndex}
        className="rounded-xl bg-gradient-to-br from-[#110B29] to-[#1A103D] border border-[#3C2975] p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-[#E5C158] bg-[#D4AF37]/15 px-3 py-1 rounded-full border border-[#D4AF37]/30">
            {activeEvent.year}
          </span>
          {activeEvent.highlight && (
            <span className="text-[11px] font-semibold text-[#C4B7D8] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#E5C158]" />
              {activeEvent.highlight}
            </span>
          )}
        </div>

        <h5 className="text-lg font-bold text-[#FAF8F5] mb-2">
          {activeEvent.title}
        </h5>

        <p className="text-sm text-[#D8CDE8] leading-relaxed">
          {activeEvent.description}
        </p>
      </div>
    </div>
  );
};
