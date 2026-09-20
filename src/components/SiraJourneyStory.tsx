import React, { useEffect, useState } from 'react';
import { BookOpenText, BotMessageSquare, CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react';
import type { Place, Route, SiraJourneyProgress } from '../types';

interface SiraJourneyStoryProps {
  route: Route;
  places: Place[];
  activeStopIndex: number;
  progress?: SiraJourneyProgress;
  onRevealStop: (stopNumber: number) => void;
  onComplete: () => void;
}

type ChapterCopy = { title: string; body: string; connection?: string };

const HEART_OF_JERUSALEM_CHAPTERS: ChapterCopy[] = [
  {
    title: 'الفصل الأول: العتبة التي تجمع القادمين',
    body: 'من باب العمود تبدأ الحكاية. البوابة ليست حجرًا وحده؛ إنها لحظة انتقال من ضجيج المدينة إلى أزقة البلدة القديمة وذاكرتها.',
  },
  {
    title: 'الفصل الثاني: المدينة التي تتبادل الحكايات',
    body: 'في سوق خان الزيت تتحول الخطوات إلى لقاء: حوانيت متقاربة، روائح مألوفة، وأصوات تجعل الحركة اليومية جزءًا من ذاكرة المكان.',
    connection: 'باب العمود يفتح طريق الدخول، وسوق خان الزيت يحوّل هذا الطريق إلى حياة يومية؛ من عتبة المدينة إلى نبضها.',
  },
  {
    title: 'الفصل الثالث: طبقات من الإيمان والذاكرة',
    body: 'عند كنيسة القيامة تتسع الحكاية. هنا تظهر القدس كمدينة تتجاور فيها الذاكرة الدينية، والعمارة، وطرق الزائرين.',
    connection: 'ما بدأ حركةً في السوق يكشف هنا معنى أعمق: الأزقة نفسها تربط التجارة اليومية بذاكرة روحية وتاريخية متعددة.',
  },
  {
    title: 'الفصل الرابع: رحاب الخاتمة',
    body: 'تصل الرحلة إلى المسجد الأقصى، حيث تتصل الجغرافيا بالمعنى: ساحات ومعالم وقصص تكمل صورة البلدة القديمة كوحدة حية.',
    connection: 'تجمع هذه المحطة فصول الرحلة: بابٌ يقود، وسوقٌ يروي الحياة، ومعالم تحفظ الذاكرة، ثم رحاب تمنح الحكاية خاتمتها.',
  },
];

const fallbackChapter = (route: Route, index: number): ChapterCopy => ({
  title: `الفصل ${index + 1}: ${route.stops[index]?.title || 'محطة الرحلة'}`,
  body: route.stops[index]?.highlightText || 'هذه المحطة تضيف طبقة جديدة إلى حكاية الطريق.',
  connection: index > 0 ? 'تتصل هذه المحطة بما قبلها عبر الطريق والذاكرة التي تجمع محطات الرحلة.' : undefined,
});

const chapterFor = (route: Route, index: number) => (
  route.slug === 'journey-in-heart-of-jerusalem'
    ? HEART_OF_JERUSALEM_CHAPTERS[index] || fallbackChapter(route, index)
    : fallbackChapter(route, index)
);

export const SiraJourneyStory: React.FC<SiraJourneyStoryProps> = ({
  route,
  places,
  activeStopIndex,
  progress,
  onRevealStop,
  onComplete,
}) => {
  const [showNarrator, setShowNarrator] = useState(false);
  const revealedStopNumbers = progress?.revealedStopNumbers || [];
  const activeStop = route.stops[activeStopIndex];
  const chapter = chapterFor(route, activeStopIndex);
  const isRevealed = revealedStopNumbers.includes(activeStop.stepNumber);
  const previousStop = activeStopIndex > 0 ? route.stops[activeStopIndex - 1] : null;
  const canReveal = activeStopIndex === 0 || Boolean(previousStop && revealedStopNumbers.includes(previousStop.stepNumber));
  const isComplete = route.stops.every((stop) => revealedStopNumbers.includes(stop.stepNumber));

  useEffect(() => setShowNarrator(false), [activeStopIndex]);
  useEffect(() => { if (isComplete && !progress?.completedAt) onComplete(); }, [isComplete, onComplete, progress?.completedAt]);

  const reveal = () => {
    if (!canReveal) return;
    onRevealStop(activeStop.stepNumber);
  };

  return (
    <section className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#211747] to-[#140E36] p-4 space-y-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E5C158]/15 text-[#E5C158]"><BookOpenText className="h-4.5 w-4.5" /></div><div><span className="block text-[10px] font-bold tracking-wide text-[#E5C158]">رحلة سيرة · قصة واحدة</span><h3 className="mt-0.5 font-serif-ar text-lg font-bold text-[#FAF8F5]">رحلتك اليوم تحكي حكاية واحدة</h3></div></div>
        <span className="shrink-0 rounded-full border border-[#E5C158]/30 bg-[#110B29]/60 px-2.5 py-1 text-[10px] font-num text-[#E5C158]">{revealedStopNumbers.length}/{route.stops.length}</span>
      </div>

      {!isRevealed ? (
        <div className="rounded-xl border border-[#3C2975] bg-[#110B29]/60 p-3.5">
          <span className="text-[10px] font-bold text-[#D4AF37]">محطة {activeStopIndex + 1} · فصل جديد</span>
          <p className="mt-1.5 text-xs leading-relaxed text-[#D8CDE8]">وصلت إلى {activeStop.title}. اكشف فصلها لتعرف كيف تكمل هذه المحطة قصة الرحلة.</p>
          <button onClick={reveal} disabled={!canReveal} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#E5C158] px-3.5 py-2 text-xs font-bold text-[#110B29] transition hover:bg-[#FFE79A] disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="h-3.5 w-3.5" />{canReveal ? 'اكشف فصل الحكاية' : 'أكمل المحطة السابقة أولًا'}</button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5C158]/25 bg-[#110B29]/65 p-3.5 animate-in fade-in duration-300">
          <span className="text-[10px] font-bold text-[#E5C158]">{chapter.title}</span>
          <p className="mt-2 text-sm leading-relaxed text-[#FAF8F5]">{chapter.body}</p>
          {previousStop && chapter.connection && <div className="mt-3 border-t border-[#3C2975] pt-3"><button onClick={() => setShowNarrator((shown) => !shown)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E5C158] hover:text-[#FFE79A]"><BotMessageSquare className="h-4 w-4" />راوي سيرة: ما العلاقة بين {activeStop.title} والمحطة السابقة؟<ChevronLeft className={`h-3.5 w-3.5 transition-transform ${showNarrator ? '-rotate-90' : ''}`} /></button>{showNarrator && <p className="mt-2 rounded-lg bg-[#251854]/70 p-3 text-xs leading-relaxed text-[#D8CDE8]">{chapter.connection}</p>}</div>}
        </div>
      )}

      {isComplete && <div className="rounded-xl border border-[#E5C158]/50 bg-[#E5C158]/10 p-3.5"><div className="flex items-center gap-2 text-[#E5C158]"><CheckCircle2 className="h-5 w-5" /><strong className="font-serif-ar text-lg">أكملت سيرة هذه الرحلة</strong></div><p className="mt-1.5 text-xs leading-relaxed text-[#D8CDE8]">ملخص بصري للفصول التي اكتشفتها، من أول خطوة حتى خاتمة الحكاية.</p><div className="mt-3 grid grid-cols-2 gap-2">{route.stops.map((stop) => { const place = places.find((item) => item.id === stop.placeId || item.slug === stop.placeSlug); return <div key={stop.stepNumber} className="relative min-h-20 overflow-hidden rounded-lg border border-[#E5C158]/25 bg-[#110B29]"><img src={place?.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" /><div className="relative flex h-full min-h-20 flex-col justify-end bg-gradient-to-t from-[#110B29] to-transparent p-2"><span className="text-[9px] font-num text-[#E5C158]">{String(stop.stepNumber).padStart(2, '0')}</span><strong className="text-[10px] text-[#FAF8F5]">{stop.title}</strong></div></div>; })}</div></div>}
    </section>
  );
};
