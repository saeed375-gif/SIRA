import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle2, LockKeyhole, MapPin, Sparkles, Star, Trophy, XCircle } from 'lucide-react';
import type { Place, UserDiscoveryProgress } from '../types';
import { JerusalemMap } from './JerusalemMap';

interface KidsMapGameProps {
  places: Place[];
  progress: UserDiscoveryProgress;
  alreadyCompleted: boolean;
  onBack: () => void;
  onCompleteGame: (points: number) => boolean;
  onCompleteStage: (stageId: string) => boolean;
}

const ENTRY_COST = 250;
const STAGE_REWARD = 50;
const FINAL_REWARD = 250;

const STAGES = [
  {
    id: 'gate', number: '01', slug: 'bab-al-amoud', title: 'بوابة الحكاية', placeName: 'باب العمود',
    position: { left: '18%', top: '63%' }, point: [18, 63],
    question: 'أي مكان نبدأ منه رحلتنا إلى البلدة القديمة؟',
    options: ['باب العمود', 'البحر الميت', 'مطار القدس'], answer: 0,
    fact: 'باب العمود هو أحد أشهر مداخل البلدة القديمة من جهتها الشمالية.',
  },
  {
    id: 'market', number: '02', slug: 'khan-al-zait', title: 'سوق الروائح', placeName: 'سوق خان الزيت',
    position: { left: '42%', top: '48%' }, point: [42, 48],
    question: 'ما الذي نسمعه ونتخيله في سوق خان الزيت؟',
    options: ['روائح التوابل وحكايات الباعة', 'أمواج البحر', 'صوت الطائرات'], answer: 0,
    fact: 'سوق خان الزيت من الأسواق العتيقة التي ترتبط بالزيت والتوابل وحركة الناس.',
  },
  {
    id: 'church', number: '03', slug: 'holy-sepulchre', title: 'ساحة اللقاء', placeName: 'كنيسة القيامة',
    position: { left: '66%', top: '37%' }, point: [66, 37],
    question: 'أي قيمة نتعلمها من حكاية كنيسة القيامة في القدس؟',
    options: ['التعايش واحترام الحكايات', 'السرعة في السباق', 'جمع الأشياء'], answer: 0,
    fact: 'تروي كنيسة القيامة جانبًا مهمًا من التنوع الديني والتاريخي في البلدة القديمة.',
  },
  {
    id: 'aqsa', number: '04', slug: 'al-aqsa-mosque', title: 'نهاية الرحلة الذهبية', placeName: 'المسجد الأقصى',
    position: { left: '77%', top: '67%' }, point: [77, 67],
    question: 'كم تبلغ مساحة المسجد الأقصى بكل ساحاته ومعالمه المسوّرة؟',
    options: ['44 دونمًا', '144 دونمًا', '400 دونم'], answer: 1,
    fact: 'المسجد الأقصى بكل ما داخل سوره تبلغ مساحته 144 دونمًا.',
  },
] as const;

const celebrate = () => {
  try {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({ particleCount: 95, spread: 75, origin: { y: 0.72 }, colors: ['#D4AF37', '#E5C158', '#FFF9EF', '#8A68D6'] });
    }
  } catch { /* Celebration is decorative; the game remains playable without it. */ }
};

export const KidsMapGame: React.FC<KidsMapGameProps> = ({
  places,
  progress,
  alreadyCompleted,
  onBack,
  onCompleteGame,
  onCompleteStage,
}) => {
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [stageRewardGranted, setStageRewardGranted] = useState<boolean | null>(null);
  const [finalRewardGranted, setFinalRewardGranted] = useState<boolean | null>(null);
  const mapPlaces = useMemo(() => STAGES.map((stage) => places.find((place) => place.slug === stage.slug)).filter(Boolean) as Place[], [places]);
  const kidsMapGame = progress.kidsMapGame || { completedStageIds: [], stagePoints: 0 };
  const completedStageIds = kidsMapGame.completedStageIds || [];
  const stagePoints = kidsMapGame.stagePoints || 0;
  const gamePoints = progress.gamePoints || 0;
  const canEnter = gamePoints >= ENTRY_COST || alreadyCompleted;
  const activeStage = STAGES.find((stage) => stage.id === activeStageId) || null;
  const activeIndex = activeStage ? STAGES.findIndex((stage) => stage.id === activeStage.id) : -1;

  const isComplete = (stageId: string) => completedStageIds.includes(stageId);
  const isUnlocked = (index: number) => {
    if (!canEnter) return false;
    if (index === 0) return true;
    return isComplete(STAGES[index - 1].id) && stagePoints >= index * STAGE_REWARD;
  };

  const openStage = (stageId: string, index: number) => {
    if (!isUnlocked(index)) return;
    setActiveStageId(stageId);
    setAnswer(null);
    setStageRewardGranted(null);
    setFinalRewardGranted(null);
  };

  const answerStage = (optionIndex: number) => {
    if (!activeStage || answer !== null) return;
    setAnswer(optionIndex);
    if (optionIndex !== activeStage.answer) return;

    celebrate();
    setStageRewardGranted(onCompleteStage(activeStage.id));
    if (activeIndex === STAGES.length - 1) {
      setFinalRewardGranted(onCompleteGame(FINAL_REWARD));
    }
  };

  if (!canEnter) {
    return <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] px-4 sm:px-6 py-8 sm:py-10 pb-28 text-right">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-[#E5C158] hover:text-[#FFE79A] mb-7"><ArrowLeft className="w-4 h-4 rotate-180" /> مركز الألعاب</button>
        <section className="rounded-[2rem] border border-[#D4AF37]/45 bg-gradient-to-br from-[#251850] to-[#110B29] p-7 sm:p-10 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-[#E5C158]/15 border border-[#E5C158]/40 text-[#E5C158] grid place-items-center mx-auto"><LockKeyhole className="w-9 h-9" /></div>
          <span className="block text-xs text-[#D4AF37] mt-6">مغامرة الأطفال على الخريطة</span>
          <h1 className="font-serif-ar text-3xl sm:text-4xl font-bold mt-2">مفاتيح القدس الصغيرة</h1>
          <p className="text-sm text-[#D8CDE8] leading-loose mt-4">اجمع <strong className="text-[#E5C158] font-num">{ENTRY_COST}</strong> نقطة من الألعاب الأخرى لفتح المرحلة الأولى والبدء في رحلة المعالم الأربعة.</p>
          <div className="mt-7 rounded-2xl border border-[#4B3689] bg-[#110B29]/75 p-4"><strong className="font-num text-3xl text-[#E5C158]">{gamePoints}</strong><span className="text-xs text-[#A89CB9] mr-2">/ {ENTRY_COST} نقطة من الألعاب</span><div className="h-2 rounded-full bg-[#251850] overflow-hidden mt-4"><div className="h-full bg-gradient-to-l from-[#E5C158] to-[#FF9F43]" style={{ width: `${Math.min(100, (gamePoints / ENTRY_COST) * 100)}%` }} /></div></div>
          <button onClick={onBack} className="mt-7 rounded-xl bg-[#E5C158] px-6 py-3 text-sm font-bold text-[#110B29] hover:bg-[#FFE79A]">العب ألعابًا أخرى</button>
        </section>
      </div>
    </div>;
  }

  return <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] px-4 sm:px-6 py-8 sm:py-10 pb-28 text-right">
    <div className="max-w-6xl mx-auto">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-[#E5C158] hover:text-[#FFE79A] mb-6"><ArrowLeft className="w-4 h-4 rotate-180" /> مركز الألعاب</button>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
        <div><span className="text-[10px] tracking-[0.28em] text-[#D4AF37]">لعبة أطفال · خريطة المغامرة</span><h1 className="font-serif-ar text-3xl sm:text-5xl font-bold mt-2">مفاتيح القدس الصغيرة</h1><p className="text-sm text-[#C4B7D8] mt-3">افتح محطة، أجب، وخذ مفتاحًا ذهبيًا للانتقال إلى المحطة التالية.</p></div>
        <div className="rounded-2xl border border-[#D4AF37]/35 bg-[#160E36] px-5 py-4"><span className="block text-[10px] text-[#A89CB9]">مفاتيح المراحل</span><strong className="font-num text-3xl text-[#E5C158]">{stagePoints}</strong><span className="text-xs text-[#A89CB9] mr-1">/ 150</span></div>
      </div>

      <section className="relative min-h-[470px] sm:min-h-[560px] overflow-hidden rounded-[2rem] border border-[#725B22] bg-[#160E36] shadow-2xl">
        <div className="absolute inset-0 pointer-events-none opacity-80"><JerusalemMap places={mapPlaces} interactive={false} gestureHandling="none" showControls={false} zoomLevel={15} centerCoords={{ lat: 31.7786, lng: 35.2321 }} className="w-full h-full rounded-none" /></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#110B29]/30 via-transparent to-[#110B29]/75" />
        <div className="absolute top-4 right-4 left-4 z-[1001] flex items-center justify-between gap-3 rounded-2xl border border-[#E5C158]/30 bg-[#110B29]/85 backdrop-blur px-4 py-3"><span className="inline-flex items-center gap-2 text-xs font-bold text-[#E5C158]"><MapPin className="w-4 h-4" /> خريطة المغامرة</span><span className="text-[11px] text-[#D8CDE8]">{completedStageIds.length} من 4 مراحل مكتملة</span></div>
        <svg className="absolute inset-0 z-[1000] h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {STAGES.slice(1).map((stage, index) => <line key={stage.id} x1={STAGES[index].point[0]} y1={STAGES[index].point[1]} x2={stage.point[0]} y2={stage.point[1]} stroke={isUnlocked(index + 1) ? '#E5C158' : '#FFF9EF'} strokeOpacity={isUnlocked(index + 1) ? 0.95 : 0.28} strokeWidth={isUnlocked(index + 1) ? 0.9 : 0.55} strokeDasharray={isUnlocked(index + 1) ? '0' : '2.4 2.4'} />)}
        </svg>
        {STAGES.map((stage, index) => {
          const unlocked = isUnlocked(index); const complete = isComplete(stage.id); const selected = activeStageId === stage.id;
          return <button key={stage.id} onClick={() => openStage(stage.id, index)} disabled={!unlocked} aria-label={`${stage.title}${complete ? '، مكتملة' : unlocked ? '، مفتوحة' : '، مقفلة'}`} style={stage.position} className={`absolute z-[1002] -translate-x-1/2 -translate-y-1/2 w-28 sm:w-36 rounded-2xl border p-2.5 sm:p-3 text-center shadow-2xl transition-all ${complete || selected ? 'border-[#E5C158] bg-[#2B1A56] ring-2 ring-[#E5C158]/35' : unlocked ? 'border-[#E5C158]/70 bg-[#160E36] hover:scale-105' : 'border-[#7D6B90] bg-[#211537]/95 opacity-75 cursor-not-allowed'}`}>
            <span className={`mx-auto grid h-9 w-9 place-items-center rounded-full ${complete ? 'bg-[#E5C158] text-[#110B29]' : unlocked ? 'bg-[#E5C158]/15 text-[#E5C158]' : 'bg-[#8E80A4]/15 text-[#C4B7D8]'}`}>{complete ? <CheckCircle2 className="w-5 h-5" /> : unlocked ? <Star className="w-5 h-5" /> : <LockKeyhole className="w-4 h-4" />}</span>
            <span className="block text-[10px] text-[#E5C158] font-num mt-1">{stage.number}</span><strong className="block text-[11px] sm:text-xs leading-snug mt-0.5">{stage.title}</strong>
            <span className="block text-[9px] text-[#C4B7D8] mt-1">{complete ? 'مكتملة' : unlocked ? 'ابدأ الآن' : `تحتاج ${index * STAGE_REWARD} مفتاحًا`}</span>
          </button>;
        })}
      </section>

      <section className="mt-6 rounded-3xl border border-[#3C2975] bg-[#160E36] p-5 sm:p-7">
        {!activeStage ? <div className="text-center py-4"><Sparkles className="w-8 h-8 text-[#E5C158] mx-auto" /><h2 className="font-serif-ar text-2xl font-bold mt-3">اختر نجمة ذهبية على الخريطة</h2><p className="text-sm text-[#A89CB9] mt-2">تفوز كل مرحلة بـ{STAGE_REWARD} مفتاحًا خاصًا بهذه الرحلة. هذه المفاتيح تفتح المراحل التالية فقط.</p></div> : <>
          <div className="flex items-center justify-between gap-4"><div><span className="text-xs text-[#D4AF37]">المرحلة {activeStage.number} · {activeStage.placeName}</span><h2 className="font-serif-ar text-2xl sm:text-3xl font-bold mt-1">{activeStage.title}</h2></div><span className="rounded-full bg-[#E5C158]/10 border border-[#E5C158]/30 px-3 py-1.5 text-xs text-[#E5C158]">{stageRewardGranted === false ? 'إنجاز جديد بلا مفتاح' : `+${STAGE_REWARD} مفتاح مرحلة`}</span></div>
          <p className="text-base sm:text-lg font-bold leading-relaxed mt-5">{activeStage.question}</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">{activeStage.options.map((option, optionIndex) => { const correct = optionIndex === activeStage.answer; const chosen = answer === optionIndex; const state = answer === null ? 'border-[#4B3689] hover:border-[#E5C158] hover:bg-[#21164A]' : correct ? 'border-[#22C55E] bg-[#123E28] text-[#DCFCE7]' : chosen ? 'border-[#EF4444] bg-[#401821] text-[#FEE2E2]' : 'opacity-45 border-[#3C2975]'; return <button key={option} disabled={answer !== null} onClick={() => answerStage(optionIndex)} className={`min-h-16 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${state}`}>{option}{answer !== null && correct && <CheckCircle2 className="inline w-4 h-4 mr-2 text-[#4ADE80]" />}{chosen && !correct && <XCircle className="inline w-4 h-4 mr-2 text-[#F87171]" />}</button>; })}</div>
          {answer !== null && <div className={`mt-5 rounded-2xl border p-4 ${answer === activeStage.answer ? 'border-[#22C55E]/50 bg-[#123E28]/50' : 'border-[#EF4444]/50 bg-[#401821]/50'}`}><p className="text-sm leading-relaxed">{answer === activeStage.answer ? activeStage.fact : 'حاول مرة أخرى؛ اقرأ السؤال بهدوء ثم اختر الإجابة الأقرب للحكاية.'}</p>{answer === activeStage.answer && activeIndex < STAGES.length - 1 && <div className="mt-3 flex items-center gap-2 text-[#E5C158] font-bold"><Sparkles className="w-5 h-5" />{stageRewardGranted === false ? 'أنجزت المرحلة مجددًا — احتفال بلا مفاتيح جديدة.' : `أحسنت! حصلت على ${STAGE_REWARD} مفتاحًا لفتح المرحلة التالية.`}</div>}{answer === activeStage.answer && activeIndex === STAGES.length - 1 && <div className="mt-3 flex items-center gap-2 text-[#E5C158] font-bold"><Trophy className="w-5 h-5" />{finalRewardGranted === false || (finalRewardGranted === null && alreadyCompleted) ? 'أنجزت اللعبة مجددًا — احتفال جديد بلا نقاط إضافية.' : `اكتملت الرحلة! أضيفت ${FINAL_REWARD} نقطة إلى رصيد الألعاب.`}</div>}</div>}
          {answer !== null && answer !== activeStage.answer && <button onClick={() => setAnswer(null)} className="mt-4 rounded-xl border border-[#4B3689] px-5 py-2.5 text-xs font-bold hover:border-[#E5C158]">أعد المحاولة</button>}
        </>}
      </section>
    </div>
  </div>;
};
