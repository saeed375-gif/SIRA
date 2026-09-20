import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft, Brain, CheckCircle2, ChevronDown, ChevronUp, Clock3, Compass,
  Flame, Gamepad2, Heart, KeyRound, Landmark, Lightbulb, LockKeyhole,
  LogOut, MapPinned, RotateCcw, Shield, Target, Timer, Trophy, UserRound,
  XCircle, Zap,
} from 'lucide-react';
import type { Place, Route, UserDiscoveryProgress } from '../types';
import type { SiraUser } from '../services/auth';
import { KidsMapGame } from '../components/KidsMapGame';

type GameId = 'blitz' | 'memory' | 'timeline' | 'compass' | 'vault' | 'kids-map';

interface GamesViewProps {
  places: Place[];
  routes: Route[];
  progress: UserDiscoveryProgress;
  onNavigate: (path: string) => void;
  onGameComplete: (gameId: string, points: number) => boolean;
  onKidsMapStageComplete: (stageId: string) => boolean;
  user: SiraUser;
  onSignOut: () => void;
}

interface GameBaseProps {
  alreadyCompleted: boolean;
  rewardGranted?: boolean;
  onBack: () => void;
  onComplete: (points: number) => boolean;
}

interface Question {
  question: string;
  options: string[];
  answer: number;
  fact: string;
  category: string;
}

const BLITZ_QUESTIONS: Question[] = [
  { question: 'ما الاسم العربي للبوابة الأشهر في السور الشمالي؟', options: ['باب الخليل', 'باب العمود', 'باب النبي داود', 'باب المغاربة'], answer: 1, fact: 'باب العمود هو المدخل الشمالي الأبرز، واسمه يستعيد عمودًا رومانيًا كان قائمًا داخل البوابة.', category: 'الأبواب' },
  { question: 'كم حيًا تاريخيًا تضم البلدة القديمة؟', options: ['ثلاثة', 'أربعة', 'خمسة', 'سبعة'], answer: 1, fact: 'تتكوّن البلدة القديمة تاريخيًا من أربعة أحياء: الإسلامي والمسيحي والأرمني واليهودي.', category: 'الجغرافيا' },
  { question: 'أي باب يواجه جبل الزيتون في الجدار الشرقي وهو مغلق منذ قرون؟', options: ['باب الرحمة', 'الباب الجديد', 'باب الساهرة', 'باب الخليل'], answer: 0, fact: 'باب الرحمة بوابة مزدوجة مغلقة في الجدار الشرقي وتواجه جبل الزيتون.', category: 'الأبواب' },
  { question: 'في أي قرن شُيّدت قبة الصخرة؟', options: ['الخامس', 'السابع', 'العاشر', 'الثاني عشر'], answer: 1, fact: 'اكتمل بناء قبة الصخرة في أواخر القرن السابع الميلادي.', category: 'العمارة' },
  { question: 'أي باب هو الأحدث بين أبواب البلدة القديمة؟', options: ['باب الأسباط', 'باب العمود', 'الباب الجديد', 'باب النبي داود'], answer: 2, fact: 'فُتح الباب الجديد سنة 1889 لتسهيل الوصول إلى الحي المسيحي.', category: 'التاريخ' },
  { question: 'أي طريق تقليدي يبدأ قرب باب الأسباط؟', options: ['طريق الآلام', 'شارع الواد', 'عقبة التكية', 'سوق القطانين'], answer: 0, fact: 'تبدأ المحطات التقليدية لطريق الآلام قرب باب الأسباط وتتجه نحو كنيسة القيامة.', category: 'المسارات' },
  { question: 'إلى أي جهة يقود باب الخليل تاريخيًا؟', options: ['الشمال', 'ميناء يافا غربًا', 'نهر الأردن شرقًا', 'بيت لحم جنوبًا'], answer: 1, fact: 'حمل باب الخليل اسم بوابة يافا أيضًا لأن الطريق الخارج منه اتجه غربًا نحو ميناء يافا.', category: 'الجغرافيا' },
  { question: 'في أي عام أُدرجت البلدة القديمة وأسوارها على قائمة التراث العالمي؟', options: ['1967', '1975', '1981', '1995'], answer: 2, fact: 'أدرجت اليونسكو البلدة القديمة في القدس وأسوارها على قائمة التراث العالمي سنة 1981.', category: 'التراث' },
  { question: 'أي وادٍ يفصل البلدة القديمة عن جبل الزيتون؟', options: ['وادي القلط', 'وادي قدرون', 'وادي النار', 'وادي الجوز'], answer: 1, fact: 'يمتد وادي قدرون بين الجدار الشرقي للبلدة القديمة وجبل الزيتون.', category: 'الطبيعة' },
  { question: 'من أعاد بناء معظم الأسوار الحالية في القرن السادس عشر؟', options: ['صلاح الدين', 'الظاهر بيبرس', 'السلطان سليمان القانوني', 'عبد الحميد الثاني'], answer: 2, fact: 'أعاد السلطان العثماني سليمان القانوني بناء أسوار القدس الحالية في القرن السادس عشر.', category: 'التاريخ' },
  { question: 'أي بوابة تحمل آثار رصاص واضحة تعود إلى حرب 1948؟', options: ['باب النبي داود', 'باب الرحمة', 'باب الحديد', 'باب الغوانمة'], answer: 0, fact: 'لا تزال آثار الرصاص ظاهرة على باب النبي داود، الشاهد على معارك عام 1948.', category: 'شاهد حجري' },
  { question: 'ما الشارع الروماني الذي كان يشق المدينة من الشمال إلى الجنوب؟', options: ['الكاردو', 'الديكومانوس', 'طريق الواد', 'درب السلسلة'], answer: 0, fact: 'الكاردو هو المحور الروماني الرئيسي الممتد عادة من الشمال إلى الجنوب.', category: 'طبقات المدينة' },
  { question: 'أي باب يصل مباشرة إلى حارتي السعدية وباب حطة؟', options: ['باب الساهرة', 'باب الخليل', 'الباب الجديد', 'باب النبي داود'], answer: 0, fact: 'يفتح باب الساهرة في الجدار الشمالي على الحي الإسلامي ومحيط حارة السعدية.', category: 'الأبواب' },
  { question: 'ما اللون الغالب على حجر القدس التقليدي؟', options: ['البازلتي الأسود', 'الكلسي الذهبي', 'الجرانيت الأحمر', 'الرخام الأخضر'], answer: 1, fact: 'الحجر الجيري المحلي يمنح مباني القدس لونها الذهبي الدافئ المميز.', category: 'العمارة' },
  { question: 'كم بوابة تاريخية رئيسية تُحصى في أسوار البلدة القديمة؟', options: ['ست', 'سبع', 'ثمانٍ', 'عشر'], answer: 2, fact: 'تُحصى ثماني بوابات تاريخية رئيسية، إحداها باب الرحمة المغلق.', category: 'الأبواب' },
];

const MEMORY_PAIRS = [
  { id: 'amud', place: 'باب العمود', clue: 'مدخل شمالي ودرجات نابضة بالحياة', icon: '🏛️' },
  { id: 'rahma', place: 'باب الرحمة', clue: 'بوابة شرقية مغلقة تواجه جبل الزيتون', icon: '🔒' },
  { id: 'qiyama', place: 'كنيسة القيامة', clue: 'روتندا تضم القبر المقدس', icon: '⛪' },
  { id: 'sakhra', place: 'قبة الصخرة', clue: 'تحفة أموية من القرن السابع', icon: '✨' },
  { id: 'khan', place: 'سوق خان الزيت', clue: 'قهوة وهيل وكعك في سوق طويل', icon: '🧺' },
  { id: 'cardo', place: 'الكاردو', clue: 'محور روماني من الشمال إلى الجنوب', icon: '🏺' },
];

const TIMELINE_EVENTS = [
  { id: 'roman', year: 'القرن الثاني', title: 'تخطيط الكاردو الروماني', note: 'محور حضري رئيسي في المدينة الرومانية.' },
  { id: 'dome', year: '691–692م', title: 'اكتمال قبة الصخرة', note: 'إحدى أقدم التحف المعمارية الإسلامية الباقية.' },
  { id: 'walls', year: '1535–1542م', title: 'إعادة بناء الأسوار الحالية', note: 'مشروع عمراني في عهد سليمان القانوني.' },
  { id: 'newgate', year: '1889م', title: 'فتح الباب الجديد', note: 'لتسهيل الوصول بين الحي المسيحي وخارج السور.' },
  { id: 'unesco', year: '1981م', title: 'الإدراج على قائمة التراث العالمي', note: 'إدراج البلدة القديمة وأسوارها لدى اليونسكو.' },
];

const COMPASS_QUESTIONS = [
  { place: 'باب العمود', direction: 'north', fact: 'يتوسط تقريبًا الجدار الشمالي.' },
  { place: 'باب الخليل', direction: 'west', fact: 'يفتح غربًا باتجاه طريق يافا التاريخي.' },
  { place: 'باب الأسباط', direction: 'east', fact: 'يقع في الجدار الشرقي قرب بداية طريق الآلام.' },
  { place: 'باب المغاربة', direction: 'south', fact: 'مدخل جنوبي قريب من حائط البراق.' },
  { place: 'باب الساهرة', direction: 'northeast', fact: 'يقع شمال شرقي السور ويقود إلى الحي الإسلامي.' },
  { place: 'باب النبي داود', direction: 'southwest', fact: 'يربط جنوب غربي البلدة القديمة بجبل صهيون.' },
];

const DIRECTIONS = [
  { id: 'north', label: 'شمال', marker: 'ش', position: 'top-3 left-1/2 -translate-x-1/2' },
  { id: 'northeast', label: 'شمال شرق', marker: 'شـق', position: 'top-10 right-5' },
  { id: 'east', label: 'شرق', marker: 'ق', position: 'top-1/2 right-3 -translate-y-1/2' },
  { id: 'southeast', label: 'جنوب شرق', marker: 'جـق', position: 'bottom-10 right-5' },
  { id: 'south', label: 'جنوب', marker: 'ج', position: 'bottom-3 left-1/2 -translate-x-1/2' },
  { id: 'southwest', label: 'جنوب غرب', marker: 'جـغ', position: 'bottom-10 left-5' },
  { id: 'west', label: 'غرب', marker: 'غ', position: 'top-1/2 left-3 -translate-y-1/2' },
  { id: 'northwest', label: 'شمال غرب', marker: 'شـغ', position: 'top-10 left-5' },
];

const VAULT_RIDDLES = [
  { question: 'حراس السور يسألون: كم بوابة تاريخية رئيسية تحيط بالبلدة القديمة؟', options: ['6', '7', '8', '9'], answer: 2, digit: '8', hint: 'احسب باب الرحمة المغلق ضمن الأبواب التاريخية.' },
  { question: 'على الرقّ أربعة أسماء لأحياء تاريخية. كم عددها؟', options: ['3', '4', '5', '6'], answer: 1, digit: '4', hint: 'الإسلامي، المسيحي، الأرمني، واليهودي.' },
  { question: 'تصف اليونسكو القدس مدينة مقدسة لعدد كم من الديانات التوحيدية؟', options: ['2', '3', '4', '5'], answer: 1, digit: '3', hint: 'الإسلام والمسيحية واليهودية.' },
  { question: 'آخر رقم في سنة إدراج البلدة القديمة على قائمة التراث العالمي هو…', options: ['0', '1', '2', '3'], answer: 1, digit: '1', hint: 'كان الإدراج في مطلع ثمانينيات القرن العشرين.' },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

const GameTopBar: React.FC<{ title: string; onBack: () => void; children?: React.ReactNode }> = ({ title, onBack, children }) => (
  <div className="max-w-5xl mx-auto mb-7">
    <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-[#E5C158] hover:text-[#FFE79A] mb-5">
      <ArrowLeft className="w-4 h-4 rotate-180" /> مركز الألعاب
    </button>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><span className="text-[10px] tracking-[0.3em] text-[#A89CB9]">تحديات القدس</span><h1 className="font-serif-ar text-3xl sm:text-4xl font-bold mt-1">{title}</h1></div>
      {children}
    </div>
  </div>
);

const GameResult: React.FC<{
  title: string; message: string; points: number; alreadyCompleted: boolean; rewardGranted?: boolean;
  onRestart: () => void; onBack: () => void; failed?: boolean;
}> = ({ title, message, points, alreadyCompleted, rewardGranted, onRestart, onBack, failed = false }) => (
  <section className="max-w-xl mx-auto text-center rounded-3xl border border-[#3C2975] bg-[#160E36] px-6 py-10 shadow-2xl shadow-black/20">
    <div className={`w-20 h-20 mx-auto rounded-full grid place-items-center ${failed ? 'bg-[#EF4444]/10 text-[#F87171]' : 'bg-[#E5C158]/10 text-[#E5C158]'}`}>{failed ? <Shield className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}</div>
    <span className="block text-xs text-[#D4AF37] mt-6">{failed ? 'انتهت المحاولة' : 'اكتمل التحدي'}</span>
    <h2 className="font-serif-ar text-3xl font-bold mt-2">{title}</h2>
    <p className="text-sm text-[#C4B7D8] leading-relaxed mt-3">{message}</p>
    {!failed && rewardGranted !== false && <div className="font-num text-4xl text-[#E5C158] mt-5">+{points}</div>}
    {!failed && rewardGranted === false && <p className="text-[11px] text-[#8F82A3] mt-4">أُنجزت اللعبة مجددًا. الاحتفال مستمر، لكن لا تُضاف نقاط عند الإعادة.</p>}
    {alreadyCompleted && rewardGranted === undefined && !failed && <p className="text-[11px] text-[#8F82A3] mt-2">أفضل نتيجة محفوظة؛ نقاط الرصيد الأساسية تُحتسب مرة واحدة.</p>}
    <div className="flex flex-wrap justify-center gap-3 mt-8">
      <button onClick={onRestart} className="inline-flex items-center gap-2 rounded-xl border border-[#4B3689] px-5 py-3 text-sm font-bold hover:border-[#E5C158]"><RotateCcw className="w-4 h-4" /> العب مجددًا</button>
      <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl bg-[#E5C158] px-5 py-3 text-sm font-bold text-[#110B29] hover:bg-[#FFE79A]">تحدٍ آخر <ArrowLeft className="w-4 h-4" /></button>
    </div>
  </section>
);

const BlitzGame: React.FC<GameBaseProps> = ({ alreadyCompleted, rewardGranted, onBack, onComplete }) => {
  const [run, setRun] = useState(0);
  const questions = useMemo(() => shuffle(BLITZ_QUESTIONS).slice(0, 10), [run]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [timeLeft, setTimeLeft] = useState(75);
  const [finished, setFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (finished) return undefined;
    const timerId = window.setInterval(() => setTimeLeft((value) => {
      if (value <= 1) { setFinished(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timerId);
  }, [finished]);

  useEffect(() => {
    if (finished && !submitted) {
      setSubmitted(true);
      if (score > 0) onComplete(score);
    }
  }, [finished, onComplete, score, submitted]);

  const question = questions[index];
  const answer = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    if (optionIndex === question.answer) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((value) => Math.max(value, nextStreak));
      setScore((value) => value + 10 + Math.min(nextStreak - 1, 4) * 2);
    } else { setStreak(0); setHearts((value) => Math.max(0, value - 1)); }
  };
  const next = () => {
    if (index === questions.length - 1 || hearts === 0) { setFinished(true); return; }
    setIndex((value) => value + 1); setSelected(null);
  };
  const restart = () => {
    setRun((value) => value + 1); setIndex(0); setSelected(null); setScore(0);
    setStreak(0); setBestStreak(0); setHearts(3); setTimeLeft(75); setFinished(false); setSubmitted(false);
  };
  if (finished) return <GameResult title="حصاد البرق" message={`أجبت عن ${index + (selected !== null ? 1 : 0)} أسئلة، وأفضل سلسلة لك كانت ${bestStreak} إجابات متتالية.`} points={score} alreadyCompleted={alreadyCompleted} rewardGranted={rewardGranted} onRestart={restart} onBack={onBack} failed={score === 0} />;

  return <>
    <GameTopBar title="برق القدس" onBack={onBack}>
      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#251850] px-3 py-2 text-[#FF9A9A]" aria-label={`${hearts} محاولات`}>{Array.from({ length: 3 }).map((_, heart) => <Heart key={heart} className={`w-4 h-4 ${heart < hearts ? 'fill-current' : 'opacity-20'}`} />)}</span>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 font-num ${timeLeft <= 15 ? 'bg-[#EF4444]/15 text-[#F87171] animate-pulse' : 'bg-[#251850] text-[#E5C158]'}`}><Timer className="w-4 h-4" /> {timeLeft}</span>
      </div>
    </GameTopBar>
    <section className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-3 text-xs">
        <span className="text-[#A89CB9]">السؤال {index + 1} / {questions.length}</span>
        <div className="flex gap-4"><span className="text-[#FF9F43] inline-flex gap-1"><Flame className="w-4 h-4" /> سلسلة {streak}</span><span className="text-[#E5C158] font-num">{score} نقطة</span></div>
      </div>
      <div className="h-2 rounded-full bg-[#251850] overflow-hidden mb-7"><div className="h-full bg-gradient-to-l from-[#E5C158] to-[#FF9F43] transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <div className="rounded-3xl border border-[#3C2975] bg-[#160E36] overflow-hidden">
        <div className="p-6 sm:p-9 border-b border-[#2B1E55]"><span className="text-[10px] rounded-full bg-[#E5C158]/10 text-[#E5C158] px-3 py-1">{question.category}</span><h2 className="font-serif-ar text-2xl sm:text-3xl font-bold leading-relaxed mt-4">{question.question}</h2></div>
        <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-3">
          {question.options.map((option, optionIndex) => {
            const answered = selected !== null; const correct = optionIndex === question.answer; const chosen = selected === optionIndex;
            const state = answered && correct ? 'border-[#22C55E] bg-[#123E28] text-[#DCFCE7]' : answered && chosen ? 'border-[#EF4444] bg-[#401821] text-[#FEE2E2]' : answered ? 'border-[#2B1E55] text-[#756987]' : 'border-[#4B3689] hover:border-[#E5C158] hover:bg-[#21164A]';
            return <button key={option} disabled={answered} onClick={() => answer(optionIndex)} className={`min-h-16 rounded-2xl border px-5 py-3 text-right font-bold transition-all flex items-center justify-between ${state}`}><span>{option}</span>{answered && correct && <CheckCircle2 className="w-5 h-5 text-[#4ADE80]" />}{answered && chosen && !correct && <XCircle className="w-5 h-5 text-[#F87171]" />}</button>;
          })}
        </div>
      </div>
      {selected !== null && <div className="mt-4 rounded-2xl border border-[#D4AF37]/30 bg-[#1B123B] p-5 flex flex-col sm:flex-row sm:items-center gap-4"><Lightbulb className="w-5 h-5 text-[#E5C158] shrink-0" /><p className="text-sm leading-relaxed text-[#D8CDE8] flex-1">{question.fact}</p><button onClick={next} className="rounded-xl bg-[#E5C158] text-[#110B29] px-5 py-2.5 text-xs font-bold shrink-0">{index === questions.length - 1 || hearts === 0 ? 'شاهد النتيجة' : 'السؤال التالي'}</button></div>}
    </section>
  </>;
};

interface MemoryCard { uid: string; pairId: string; kind: 'place' | 'clue'; text: string; icon: string }

const MemoryGame: React.FC<GameBaseProps> = ({ alreadyCompleted, rewardGranted, onBack, onComplete }) => {
  const makeCards = () => shuffle(MEMORY_PAIRS.flatMap((pair) => [
    { uid: `${pair.id}-place`, pairId: pair.id, kind: 'place' as const, text: pair.place, icon: pair.icon },
    { uid: `${pair.id}-clue`, pairId: pair.id, kind: 'clue' as const, text: pair.clue, icon: '؟' },
  ]));
  const [cards, setCards] = useState<MemoryCard[]>(makeCards);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);
  const [points, setPoints] = useState(0);
  const reveal = (cardIndex: number) => {
    if (open.length === 2 || open.includes(cardIndex) || matched.includes(cards[cardIndex].pairId)) return;
    const nextOpen = [...open, cardIndex]; setOpen(nextOpen);
    if (nextOpen.length < 2) return;
    const nextMoves = moves + 1; setMoves(nextMoves);
    const [first, second] = nextOpen.map((item) => cards[item]);
    if (first.pairId === second.pairId && first.kind !== second.kind) {
      window.setTimeout(() => {
        const nextMatched = [...matched, first.pairId]; setMatched(nextMatched); setOpen([]);
        if (nextMatched.length === MEMORY_PAIRS.length) {
          const earned = Math.max(35, 90 - nextMoves * 4); setPoints(earned); setFinished(true); onComplete(earned);
        }
      }, 450);
    } else window.setTimeout(() => setOpen([]), 850);
  };
  const restart = () => { setCards(makeCards()); setOpen([]); setMatched([]); setMoves(0); setFinished(false); setPoints(0); };
  if (finished) return <GameResult title="ذاكرة مقدسية" message={`طابقت الأزواج الستة في ${moves} محاولات. كلما قلّ العدد ارتفعت جائزتك.`} points={points} alreadyCompleted={alreadyCompleted} rewardGranted={rewardGranted} onRestart={restart} onBack={onBack} />;
  return <>
    <GameTopBar title="متاهة الذاكرة" onBack={onBack}><div className="flex gap-3 text-xs"><span className="rounded-full bg-[#251850] px-4 py-2 text-[#E5C158]">{matched.length} / {MEMORY_PAIRS.length} أزواج</span><span className="rounded-full bg-[#251850] px-4 py-2">{moves} محاولات</span></div></GameTopBar>
    <section className="max-w-4xl mx-auto">
      <p className="text-sm text-[#B8ACC9] mb-5">اكشف بطاقتين، وطابق كل معلم مقدسي بوصفه الصحيح. تذكّر مواقع البطاقات قبل أن تختفي.</p>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 [perspective:1000px]">
        {cards.map((card, cardIndex) => {
          const visible = open.includes(cardIndex) || matched.includes(card.pairId); const done = matched.includes(card.pairId);
          return <button key={card.uid} onClick={() => reveal(cardIndex)} disabled={done} aria-label={visible ? card.text : 'بطاقة مخفية'} className={`relative min-h-32 sm:min-h-40 rounded-2xl border p-3 transition-all duration-300 overflow-hidden ${visible ? done ? 'border-[#22C55E]/60 bg-[#123E28]' : 'border-[#E5C158] bg-[#21164A]' : 'border-[#3C2975] bg-gradient-to-br from-[#251850] to-[#130C30] hover:-translate-y-1 hover:border-[#E5C158]'}`}>{visible ? <div className="h-full flex flex-col items-center justify-center gap-3"><span className="text-2xl">{card.icon}</span><strong className={`leading-relaxed ${card.kind === 'clue' ? 'text-[11px] sm:text-sm text-[#D8CDE8]' : 'text-sm sm:text-lg'}`}>{card.text}</strong>{done && <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />}</div> : <div className="absolute inset-0 grid place-items-center"><span className="font-serif-ar text-4xl text-[#E5C158]/80">س</span><span className="absolute inset-3 border border-[#E5C158]/10 rounded-xl" /></div>}</button>;
        })}
      </div>
    </section>
  </>;
};

const TimelineGame: React.FC<GameBaseProps> = ({ alreadyCompleted, rewardGranted, onBack, onComplete }) => {
  const [events, setEvents] = useState(() => shuffle(TIMELINE_EVENTS));
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'wrong' | 'correct' | null>(null);
  const [points, setPoints] = useState(0);
  const move = (index: number, delta: number) => {
    const target = index + delta; if (target < 0 || target >= events.length) return;
    const next = [...events]; [next[index], next[target]] = [next[target], next[index]]; setEvents(next); setFeedback(null);
  };
  const check = () => {
    const nextAttempts = attempts + 1; setAttempts(nextAttempts);
    const correct = events.every((event, index) => event.id === TIMELINE_EVENTS[index].id);
    if (correct) { const earned = Math.max(40, 90 - (nextAttempts - 1) * 15); setPoints(earned); setFeedback('correct'); onComplete(earned); }
    else setFeedback('wrong');
  };
  const restart = () => { setEvents(shuffle(TIMELINE_EVENTS)); setAttempts(0); setFeedback(null); setPoints(0); };
  if (feedback === 'correct') return <GameResult title="حارس الزمن" message={`أعدت خمسة أحداث إلى مواضعها في ${attempts} محاولة.`} points={points} alreadyCompleted={alreadyCompleted} rewardGranted={rewardGranted} onRestart={restart} onBack={onBack} />;
  return <>
    <GameTopBar title="خطّ الزمن المبعثر" onBack={onBack}><span className="rounded-full bg-[#251850] px-4 py-2 text-xs">المحاولة {attempts + 1}</span></GameTopBar>
    <section className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#E5C158]/5 p-4 text-sm text-[#D8CDE8] mb-5"><Clock3 className="inline w-4 h-4 text-[#E5C158] ml-2" />رتّب الأحداث من الأقدم في الأعلى إلى الأحدث في الأسفل.</div>
      <div className="space-y-3">{events.map((event, eventIndex) =>
        <div key={event.id} className={`grid grid-cols-[auto_1fr_auto] gap-4 items-center rounded-2xl border bg-[#160E36] p-4 sm:p-5 ${feedback === 'wrong' && event.id !== TIMELINE_EVENTS[eventIndex].id ? 'border-[#EF4444]/50' : 'border-[#3C2975]'}`}>
          <span className="font-num text-2xl text-[#E5C158] w-8">{String(eventIndex + 1).padStart(2, '0')}</span>
          <div><span className="text-xs text-[#D4AF37]">{event.year}</span><h3 className="font-bold text-base sm:text-lg mt-1">{event.title}</h3><p className="text-xs text-[#A89CB9] mt-1 hidden sm:block">{event.note}</p></div>
          <div className="flex flex-col gap-1"><button onClick={() => move(eventIndex, -1)} disabled={eventIndex === 0} aria-label={`حرّك ${event.title} للأعلى`} className="w-9 h-9 rounded-lg border border-[#4B3689] grid place-items-center disabled:opacity-20 hover:border-[#E5C158]"><ChevronUp className="w-4 h-4" /></button><button onClick={() => move(eventIndex, 1)} disabled={eventIndex === events.length - 1} aria-label={`حرّك ${event.title} للأسفل`} className="w-9 h-9 rounded-lg border border-[#4B3689] grid place-items-center disabled:opacity-20 hover:border-[#E5C158]"><ChevronDown className="w-4 h-4" /></button></div>
        </div>)}</div>
      {feedback === 'wrong' && <p className="mt-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 text-sm text-[#FCA5A5]">ليست كل الأحداث في مكانها بعد. البطاقات ذات الإطار الأحمر تحتاج إلى إعادة ترتيب.</p>}
      <button onClick={check} className="w-full mt-5 rounded-2xl bg-[#E5C158] text-[#110B29] py-4 font-bold hover:bg-[#FFE79A]">تحقق من الخط الزمني</button>
    </section>
  </>;
};

const CompassGame: React.FC<GameBaseProps> = ({ alreadyCompleted, rewardGranted, onBack, onComplete }) => {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = COMPASS_QUESTIONS[round];
  const choose = (direction: string) => { if (selected) return; setSelected(direction); if (direction === question.direction) setScore((value) => value + 15); };
  const next = () => {
    if (round === COMPASS_QUESTIONS.length - 1) { setFinished(true); if (score > 0) onComplete(score); }
    else { setRound((value) => value + 1); setSelected(null); }
  };
  const restart = () => { setRound(0); setSelected(null); setScore(0); setFinished(false); };
  if (finished) return <GameResult title="بوصلة القدس" message={`حددت الاتجاه الصحيح في ${score / 15} من ${COMPASS_QUESTIONS.length} مواقع.`} points={score} alreadyCompleted={alreadyCompleted} rewardGranted={rewardGranted} onRestart={restart} onBack={onBack} />;
  return <>
    <GameTopBar title="بوصلة الأبواب" onBack={onBack}><span className="font-num text-[#E5C158] text-sm">{score} نقطة</span></GameTopBar>
    <section className="max-w-4xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
      <div className="relative min-h-[430px] sm:min-h-[520px] rounded-[2.5rem] border-2 border-[#8B6F2F] bg-[#171033] overflow-hidden shadow-2xl">
        <div className="absolute inset-8 sm:inset-14 rounded-[35%_45%_38%_42%] border-4 border-[#D4AF37]/35 bg-[#211747] shadow-inner"><div className="absolute inset-4 rounded-[35%_45%_38%_42%] border border-dashed border-[#E5C158]/15" /><div className="absolute inset-0 grid place-items-center text-center"><div><Landmark className="w-10 h-10 text-[#E5C158]/35 mx-auto" /><span className="block text-xs text-[#8F82A3] mt-2">البلدة القديمة</span></div></div></div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#E5C158_1px,transparent_1px)] [background-size:18px_18px]" />
        {DIRECTIONS.map((direction) => {
          const answered = Boolean(selected); const correct = direction.id === question.direction; const chosen = direction.id === selected;
          const state = answered && correct ? 'bg-[#22C55E] border-[#86EFAC] text-[#071B10] scale-110' : answered && chosen ? 'bg-[#EF4444] border-[#FCA5A5]' : answered ? 'opacity-35 bg-[#251850]' : 'bg-[#2A1B59] hover:bg-[#E5C158] hover:text-[#110B29] hover:scale-110';
          return <button key={direction.id} onClick={() => choose(direction.id)} disabled={answered} aria-label={direction.label} className={`absolute z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#D4AF37] grid place-items-center font-bold text-xs transition-all ${direction.position} ${state}`}>{direction.marker}</button>;
        })}
        <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-[#E5C158]/8" />
      </div>
      <div className="rounded-3xl border border-[#3C2975] bg-[#160E36] p-6 sm:p-8 flex flex-col justify-center">
        <span className="text-xs text-[#D4AF37]">الموقع {round + 1} من {COMPASS_QUESTIONS.length}</span><Target className="w-9 h-9 text-[#E5C158] mt-6" /><h2 className="font-serif-ar text-3xl font-bold mt-4">أين يقع {question.place}؟</h2><p className="text-sm text-[#A89CB9] leading-relaxed mt-3">اختر الجهة الأقرب لموقع الباب على سور البلدة القديمة.</p>
        {selected && <div className={`mt-6 rounded-xl border p-4 ${selected === question.direction ? 'border-[#22C55E]/50 bg-[#123E28]' : 'border-[#EF4444]/50 bg-[#401821]'}`}><strong>{selected === question.direction ? 'اتجاه صحيح!' : `الصحيح: ${DIRECTIONS.find((item) => item.id === question.direction)?.label}`}</strong><p className="text-xs leading-relaxed text-[#D8CDE8] mt-2">{question.fact}</p></div>}
        {selected && <button onClick={next} className="mt-4 rounded-xl bg-[#E5C158] text-[#110B29] py-3 font-bold">{round === COMPASS_QUESTIONS.length - 1 ? 'النتيجة' : 'الموقع التالي'}</button>}
      </div>
    </section>
  </>;
};

const VaultGame: React.FC<GameBaseProps> = ({ alreadyCompleted, rewardGranted, onBack, onComplete }) => {
  const [room, setRoom] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [solvedDigits, setSolvedDigits] = useState<string[]>([]);
  const [torches, setTorches] = useState(3);
  const [wrongs, setWrongs] = useState(0);
  const [stage, setStage] = useState<'riddles' | 'keypad' | 'won' | 'failed'>('riddles');
  const [entered, setEntered] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [points, setPoints] = useState(0);
  const riddle = VAULT_RIDDLES[room];
  const choose = (optionIndex: number) => {
    if (selected !== null) return; setSelected(optionIndex);
    if (optionIndex !== riddle.answer) {
      const nextTorches = torches - 1; setTorches(nextTorches); setWrongs((value) => value + 1);
      if (nextTorches === 0) window.setTimeout(() => setStage('failed'), 650);
    }
  };
  const continueRiddle = () => {
    if (selected !== riddle.answer) { setSelected(null); return; }
    const nextDigits = [...solvedDigits, riddle.digit]; setSolvedDigits(nextDigits); setSelected(null);
    if (room === VAULT_RIDDLES.length - 1) setStage('keypad'); else setRoom((value) => value + 1);
  };
  const pressDigit = (digit: string) => { if (entered.length < 4) { setEntered((value) => value + digit); setCodeError(false); } };
  const unlock = () => {
    if (entered === VAULT_RIDDLES.map((item) => item.digit).join('')) {
      const earned = Math.max(50, 120 - wrongs * 15); setPoints(earned); setStage('won'); onComplete(earned);
    } else { setEntered(''); setCodeError(true); setWrongs((value) => value + 1); }
  };
  const restart = () => { setRoom(0); setSelected(null); setSolvedDigits([]); setTorches(3); setWrongs(0); setStage('riddles'); setEntered(''); setCodeError(false); setPoints(0); };
  if (stage === 'won') return <GameResult title="فُتح أرشيف القدس" message="حللت الألغاز الأربعة، حفظت الأرقام، وفتحت الخزنة بالشفرة الصحيحة." points={points} alreadyCompleted={alreadyCompleted} rewardGranted={rewardGranted} onRestart={restart} onBack={onBack} />;
  if (stage === 'failed') return <GameResult title="انطفأت المشاعل" message="تحتاج إلى العودة بذاكرة أقوى. تلميحات الغرفة ستقودك إلى الشفرة في المحاولة التالية." points={0} alreadyCompleted={alreadyCompleted} rewardGranted={rewardGranted} onRestart={restart} onBack={onBack} failed />;
  return <>
    <GameTopBar title="غرفة الهروب: خزنة المدينة" onBack={onBack}><div className="flex items-center gap-2 rounded-full bg-[#251850] px-4 py-2 text-[#FFB86B] text-xs"><Flame className="w-4 h-4 fill-current" /> {torches} مشاعل</div></GameTopBar>
    <section className="max-w-3xl mx-auto">
      <div className="rounded-3xl border border-[#725B22] bg-gradient-to-b from-[#201641] to-[#110B29] overflow-hidden shadow-2xl">
        <div className="border-b border-[#3C2975] p-5 flex items-center justify-between gap-4"><div className="flex gap-2">{VAULT_RIDDLES.map((_, index) => <span key={index} className={`w-10 h-10 rounded-lg border grid place-items-center font-num ${solvedDigits[index] ? 'border-[#E5C158] bg-[#E5C158]/10 text-[#E5C158]' : 'border-[#3C2975] text-[#645777]'}`}>{solvedDigits[index] || '•'}</span>)}</div><LockKeyhole className="w-7 h-7 text-[#E5C158]" /></div>
        {stage === 'riddles' ? <div className="p-6 sm:p-10">
          <span className="text-xs text-[#D4AF37]">الغرفة {room + 1} / {VAULT_RIDDLES.length}</span><h2 className="font-serif-ar text-2xl sm:text-3xl font-bold leading-relaxed mt-4">{riddle.question}</h2>
          <div className="grid grid-cols-2 gap-3 mt-7">{riddle.options.map((option, optionIndex) => {
            const answered = selected !== null; const correct = optionIndex === riddle.answer; const chosen = selected === optionIndex;
            return <button key={option} disabled={answered} onClick={() => choose(optionIndex)} className={`rounded-2xl border py-5 font-num text-xl font-bold transition-all ${answered && correct ? 'border-[#22C55E] bg-[#123E28]' : answered && chosen ? 'border-[#EF4444] bg-[#401821]' : answered ? 'opacity-35 border-[#3C2975]' : 'border-[#4B3689] bg-[#1B123B] hover:border-[#E5C158]'}`}>{option}</button>;
          })}</div>
          {selected !== null && <div className="mt-5 rounded-xl border border-[#D4AF37]/30 bg-[#E5C158]/5 p-4"><p className="text-sm text-[#D8CDE8]"><Lightbulb className="inline w-4 h-4 text-[#E5C158] ml-2" />{riddle.hint}</p><button onClick={continueRiddle} className="w-full mt-4 rounded-xl bg-[#E5C158] text-[#110B29] py-3 text-sm font-bold">{selected === riddle.answer ? 'احفظ الرقم واعبر' : 'حاول مرة أخرى'}</button></div>}
        </div> : <div className="p-6 sm:p-10 text-center">
          <KeyRound className="w-12 h-12 text-[#E5C158] mx-auto" /><h2 className="font-serif-ar text-3xl font-bold mt-4">أدخل شفرة الخزنة</h2><p className="text-sm text-[#A89CB9] mt-2">الأرقام ظهرت لك بالترتيب في الغرف الأربع.</p>
          <div className={`h-16 max-w-xs mx-auto mt-6 rounded-xl border bg-[#0D081F] grid place-items-center font-num text-3xl tracking-[0.45em] ${codeError ? 'border-[#EF4444] text-[#F87171]' : 'border-[#725B22] text-[#E5C158]'}`}>{entered.padEnd(4, '•')}</div>
          {codeError && <p className="text-xs text-[#FCA5A5] mt-2">الشفرة غير صحيحة. استعد ترتيب الأرقام التي جمعتها.</p>}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mt-5" dir="ltr">{['1','2','3','4','5','6','7','8','9'].map((digit) => <button key={digit} onClick={() => pressDigit(digit)} className="h-12 rounded-xl border border-[#4B3689] bg-[#21164A] font-num hover:border-[#E5C158]">{digit}</button>)}<button onClick={() => setEntered('')} className="h-12 rounded-xl border border-[#4B3689] text-xs">مسح</button><button onClick={() => pressDigit('0')} className="h-12 rounded-xl border border-[#4B3689] bg-[#21164A] font-num">0</button><button onClick={unlock} disabled={entered.length !== 4} className="h-12 rounded-xl bg-[#E5C158] text-[#110B29] text-xs font-bold disabled:opacity-30">فتح</button></div>
        </div>}
      </div>
    </section>
  </>;
};

const GAME_META = [
  { id: 'blitz' as const, number: '01', icon: Zap, title: 'برق القدس', eyebrow: 'وقت · قلوب · سلاسل', description: 'عشرة أسئلة تتغير كل مرة. أمامك 75 ثانية وثلاث فرص فقط، والسلسلة ترفع نقاطك.', duration: 'دقيقتان', difficulty: 'متوسط', accent: 'from-[#FF9F43]/25 to-transparent' },
  { id: 'memory' as const, number: '02', icon: Brain, title: 'متاهة الذاكرة', eyebrow: 'كشف · حفظ · مطابقة', description: 'اثنتا عشرة بطاقة مخفية. طابق ستة معالم مقدسية بأوصافها بأقل عدد من الحركات.', duration: '3 دقائق', difficulty: 'متوسط', accent: 'from-[#A78BFA]/25 to-transparent' },
  { id: 'timeline' as const, number: '03', icon: Clock3, title: 'خط الزمن المبعثر', eyebrow: 'ترتيب · تاريخ · منطق', description: 'خمسة أحداث من طبقات القدس اختلطت. أعدها من الأقدم إلى الأحدث دون تلميح مباشر.', duration: '4 دقائق', difficulty: 'صعب', accent: 'from-[#38BDF8]/20 to-transparent' },
  { id: 'compass' as const, number: '04', icon: MapPinned, title: 'بوصلة الأبواب', eyebrow: 'خريطة · اتجاهات · مواقع', description: 'قف في قلب البلدة القديمة وحدد موقع كل باب على السور باستخدام البوصلة.', duration: '3 دقائق', difficulty: 'صعب', accent: 'from-[#4ADE80]/20 to-transparent' },
  { id: 'vault' as const, number: '05', icon: LockKeyhole, title: 'خزنة المدينة', eyebrow: 'غرفة هروب · ألغاز · شفرة', description: 'اعبر أربع غرف، اجمع أرقام الشفرة، ثم افتح أرشيف القدس قبل انطفاء المشاعل.', duration: '5 دقائق', difficulty: 'خبير', accent: 'from-[#F472B6]/20 to-transparent' },
  { id: 'kids-map' as const, number: '06', icon: MapPinned, title: 'مفاتيح القدس الصغيرة', eyebrow: 'لعبة أطفال · خريطة · أربع مراحل', description: 'رحلة مرسومة على خريطة القدس. اربح مفتاح كل محطة لتضيء الطريق إلى المحطة التالية.', duration: '4 مراحل', difficulty: 'للأطفال', accent: 'from-[#E5C158]/25 to-transparent' },
];

const celebrateGame = () => {
  try {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({ particleCount: 105, spread: 80, origin: { y: 0.72 }, colors: ['#D4AF37', '#E5C158', '#FFF9EF', '#8A68D6'] });
    }
  } catch { /* Celebration is optional. */ }
};

export const GamesView: React.FC<GamesViewProps> = ({ places, progress, onNavigate, onGameComplete, onKidsMapStageComplete, user, onSignOut }) => {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [runRewards, setRunRewards] = useState<Partial<Record<GameId, boolean>>>({});
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeGame]);
  const gameKey = (id: GameId) => `game:${id}-v2`;
  const completed = (id: GameId) => progress.completedChallenges.includes(gameKey(id));
  const startGame = (id: GameId) => {
    setRunRewards((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    setActiveGame(id);
  };
  const finish = (id: GameId, points: number) => {
    if (points <= 0) return false;
    const granted = onGameComplete(gameKey(id), points);
    setRunRewards((previous) => ({ ...previous, [id]: granted }));
    celebrateGame();
    return granted;
  };
  const back = () => setActiveGame(null);
  const shell = (content: React.ReactNode) => <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] px-4 sm:px-6 py-8 sm:py-10 pb-28 text-right">{content}</div>;
  if (activeGame === 'blitz') return shell(<BlitzGame alreadyCompleted={completed('blitz')} rewardGranted={runRewards.blitz} onBack={back} onComplete={(points) => finish('blitz', points)} />);
  if (activeGame === 'memory') return shell(<MemoryGame alreadyCompleted={completed('memory')} rewardGranted={runRewards.memory} onBack={back} onComplete={(points) => finish('memory', points)} />);
  if (activeGame === 'timeline') return shell(<TimelineGame alreadyCompleted={completed('timeline')} rewardGranted={runRewards.timeline} onBack={back} onComplete={(points) => finish('timeline', points)} />);
  if (activeGame === 'compass') return shell(<CompassGame alreadyCompleted={completed('compass')} rewardGranted={runRewards.compass} onBack={back} onComplete={(points) => finish('compass', points)} />);
  if (activeGame === 'vault') return shell(<VaultGame alreadyCompleted={completed('vault')} rewardGranted={runRewards.vault} onBack={back} onComplete={(points) => finish('vault', points)} />);
  if (activeGame === 'kids-map') return <KidsMapGame places={places} progress={progress} alreadyCompleted={completed('kids-map')} onBack={back} onCompleteGame={(points) => finish('kids-map', points)} onCompleteStage={onKidsMapStageComplete} />;

  const completedCount = GAME_META.filter((game) => completed(game.id)).length;
  return <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] pb-28 text-right">
    <header className="relative overflow-hidden border-b border-[#2B1E55] bg-[#110B29]">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_15%_10%,#6D4BC3,transparent_33%),radial-gradient(circle_at_80%_100%,#D4AF37,transparent_28%)]" />
      <div className="absolute -left-16 -top-16 w-72 h-72 border border-[#E5C158]/10 rounded-full" /><div className="absolute -left-2 -top-2 w-48 h-48 border border-[#E5C158]/10 rounded-full" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5C158]/30 bg-[#E5C158]/5 px-4 py-2 text-[#E5C158] text-xs font-bold"><Gamepad2 className="w-4 h-4" /> الموسم الأول · تحديات القدس</div>
        <div className="grid lg:grid-cols-[1fr_310px] gap-10 items-end mt-6">
          <div><h1 className="text-4xl sm:text-6xl font-serif-ar font-bold leading-tight">القدس ليست سؤالًا.<br /><span className="text-[#E5C158]">إنها تحدٍ كامل.</span></h1><p className="max-w-2xl text-[#D8CDE8] leading-loose mt-5">ألعاب متعددة الأنماط عن تاريخ القدس وجغرافيتها وأبوابها وذاكرتها. لكل لعبة قواعدها ووقتها ومخاطرها—هل تستطيع إكمال الموسم؟</p></div>
          <div className="rounded-2xl border border-[#4B3689] bg-[#160E36]/80 backdrop-blur p-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#2F2160] pb-4">
              <div className="flex min-w-0 items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E5C158]/10 text-[#E5C158]"><UserRound className="h-4 w-4" /></div><div className="min-w-0"><span className="block text-[10px] text-[#8F82A3]">مرحبًا بك</span><strong className="block truncate text-sm">{user.displayName}</strong></div></div>
              <button onClick={onSignOut} aria-label="تسجيل الخروج من ألعاب سيرة" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#3C2975] text-[#A89CB9] transition hover:border-[#EF4444]/50 hover:text-[#FCA5A5]"><LogOut className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs text-[#A89CB9]">تقدم الموسم</span><Trophy className="w-5 h-5 text-[#E5C158]" /></div>
            <div className="flex items-end gap-2 mt-3"><strong className="font-num text-4xl text-[#E5C158]">{completedCount}</strong><span className="text-sm text-[#A89CB9] mb-1">/ {GAME_META.length} ألعاب</span></div>
            <div className="h-2 rounded-full bg-[#251850] mt-4 overflow-hidden"><div className="h-full bg-gradient-to-l from-[#E5C158] to-[#FF9F43] transition-all" style={{ width: `${(completedCount / GAME_META.length) * 100}%` }} /></div>
            <div className="flex items-center justify-between mt-4 text-xs"><span>رصيدك الحالي</span><strong className="font-num text-[#E5C158]">{progress.totalPoints} نقطة</strong></div>
          </div>
        </div>
      </div>
    </header>
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <section className="rounded-3xl border border-[#725B22] bg-gradient-to-l from-[#24183F] to-[#160E36] p-5 sm:p-7 mb-8 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[#E5C158] text-[#110B29] grid place-items-center shrink-0"><Zap className="w-7 h-7 fill-current" /></div>
        <div className="flex-1"><span className="text-[10px] text-[#E5C158] tracking-[0.25em]">تحدي اليوم</span><h2 className="font-serif-ar text-2xl font-bold mt-1">سلسلة من خمس إجابات في برق القدس</h2><p className="text-xs text-[#A89CB9] mt-1">اختر بسرعة؛ كل إجابة متتالية تمنحك مضاعف نقاط أعلى.</p></div>
        <button onClick={() => startGame('blitz')} className="rounded-xl bg-[#E5C158] px-6 py-3 text-sm font-bold text-[#110B29] hover:bg-[#FFE79A] shrink-0">ابدأ التحدي</button>
      </section>
      <div className="flex items-end justify-between gap-4 mb-5"><div><span className="text-xs text-[#D4AF37]">اختر ساحتك</span><h2 className="font-serif-ar text-3xl font-bold mt-1">ست طرق لاختبار معرفتك</h2></div><span className="hidden sm:block text-xs text-[#756987]">المحتوى يتجدد عند إعادة اللعب</span></div>
      <div className="grid md:grid-cols-2 gap-5">
        {GAME_META.map((game, index) => {
          const Icon = game.icon; const isDone = completed(game.id); const isKidsMapLocked = game.id === 'kids-map' && progress.totalPoints < 250 && !isDone;
          return <button key={game.id} onClick={() => startGame(game.id)} className={`group relative text-right min-h-72 overflow-hidden rounded-3xl border bg-[#160E36] p-6 sm:p-7 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 ${index === 0 ? 'md:col-span-2' : ''} ${isDone ? 'border-[#22C55E]/45' : isKidsMapLocked ? 'border-[#725B22]/70' : 'border-[#2B1E55] hover:border-[#D4AF37]'}`}>
            <div className={`absolute inset-0 bg-gradient-to-bl ${game.accent} opacity-70`} />
            <div className="relative h-full flex flex-col"><div className="flex items-start justify-between gap-4"><span className="font-num text-5xl text-white/10">{game.number}</span><div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">{isKidsMapLocked ? <LockKeyhole className="w-6 h-6 text-[#E5C158]" /> : <Icon className="w-6 h-6 text-[#E5C158]" />}</div></div><span className="text-[10px] text-[#D4AF37] tracking-wider mt-5">{game.eyebrow}</span><h3 className={`font-serif-ar font-bold mt-2 group-hover:text-[#E5C158] transition-colors ${index === 0 ? 'text-3xl' : 'text-2xl'}`}>{game.title}</h3><p className="text-sm text-[#B8ACC9] leading-relaxed mt-3 max-w-2xl flex-1">{game.description}</p><div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10 text-[11px]"><span className="rounded-full bg-white/5 px-3 py-1.5 inline-flex gap-1"><Clock3 className="w-3.5 h-3.5" /> {game.duration}</span><span className="rounded-full bg-white/5 px-3 py-1.5">{game.difficulty}</span><span className={`mr-auto font-bold ${isDone ? 'text-[#4ADE80]' : 'text-[#E5C158]'}`}>{isDone ? 'أُنجزت ✓' : isKidsMapLocked ? `تُفتح عند 250 نقطة (${progress.totalPoints}/250)` : 'ادخل اللعبة ←'}</span></div></div>
          </button>;
        })}
      </div>
      <section className="mt-12 grid lg:grid-cols-[1fr_auto] gap-6 items-center border-t border-[#2B1E55] pt-8">
        <div><div className="inline-flex items-center gap-2 text-sm font-bold"><Shield className="w-4 h-4 text-[#E5C158]" /> معرفة موثقة</div><p className="text-xs text-[#8F82A3] leading-relaxed mt-2 max-w-2xl">بُنيت الحقائق التاريخية والجغرافية في الألعاب بالاستناد إلى ملف البلدة القديمة لدى اليونسكو ومواد بوابة Visit Palestine عن أحياء القدس وأبوابها.</p><div className="flex flex-wrap gap-4 mt-3 text-xs text-[#D4AF37]"><a href="https://whc.unesco.org/en/list/148" target="_blank" rel="noreferrer" className="hover:underline">ملف اليونسكو ↗</a><a href="https://visitpalestine.ps/destinations/jerusalem-2/jerusalem-old-city-landing/" target="_blank" rel="noreferrer" className="hover:underline">البلدة القديمة — Visit Palestine ↗</a></div></div>
        <button onClick={() => onNavigate('/explore')} className="inline-flex items-center gap-2 text-sm font-bold text-[#E5C158] shrink-0">استكشف القدس على الخريطة <ArrowLeft className="w-4 h-4" /></button>
      </section>
    </main>
  </div>;
};
