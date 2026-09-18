import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpenText,
  Camera,
  CheckCircle2,
  Footprints,
  Gamepad2,
  Lightbulb,
  MapPin,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import type { Place, Route, UserDiscoveryProgress } from '../types';

type GameId = 'image' | 'memory' | 'route';

interface GamesViewProps {
  places: Place[];
  routes: Route[];
  progress: UserDiscoveryProgress;
  onNavigate: (path: string) => void;
  onGameComplete: (gameId: string, points: number) => void;
}

interface PlaceQuizProps {
  mode: 'image' | 'memory';
  places: Place[];
  alreadyCompleted: boolean;
  onBack: () => void;
  onComplete: (points: number) => void;
  onNavigate: (path: string) => void;
}

const QUIZ_ROUNDS = 4;

function optionsFor(places: Place[], index: number) {
  if (!places.length) return [];
  const correct = places[index];
  const options = [correct];
  for (let offset = 1; options.length < Math.min(4, places.length); offset += 1) {
    const candidate = places[(index + offset) % places.length];
    if (!options.some((place) => place.id === candidate.id)) options.push(candidate);
  }
  return options.sort((a, b) => ((a.id.charCodeAt(a.id.length - 1) + index) % 4) - ((b.id.charCodeAt(b.id.length - 1) + index) % 4));
}

const PlaceQuiz: React.FC<PlaceQuizProps> = ({
  mode,
  places,
  alreadyCompleted,
  onBack,
  onComplete,
  onNavigate,
}) => {
  const questions = places.slice(0, Math.min(QUIZ_ROUNDS, places.length));
  const [round, setRound] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const place = questions[round];
  const options = useMemo(() => optionsFor(places, round), [places, round]);
  const isCorrect = selectedId === place?.id;
  const title = mode === 'image' ? 'اعرف المكان من الصورة' : 'لمن تنتمي هذه الذاكرة؟';

  const answer = (id: string) => {
    if (selectedId) return;
    setSelectedId(id);
    if (id === place.id) setCorrectCount((count) => count + 1);
  };

  const next = () => {
    if (round < questions.length - 1) {
      setRound((value) => value + 1);
      setSelectedId(null);
      return;
    }
    setFinished(true);
    onComplete(correctCount * 10);
  };

  const restart = () => {
    setRound(0);
    setSelectedId(null);
    setCorrectCount(0);
    setFinished(false);
  };

  if (!place) {
    return <p className="py-16 text-center text-[#C4B7D8]">لا توجد أماكن كافية لبدء اللعبة.</p>;
  }

  if (finished) {
    return (
      <section className="max-w-2xl mx-auto text-center py-10">
        <Trophy className="w-16 h-16 text-[#E5C158] mx-auto mb-5" />
        <span className="text-xs font-bold text-[#D4AF37]">اكتملت الجولة</span>
        <h2 className="text-3xl sm:text-4xl font-serif-ar font-bold mt-2">{title}</h2>
        <p className="text-[#D8CDE8] mt-4">عرفت {correctCount} من {questions.length} أماكن.</p>
        <p className="font-num text-2xl text-[#E5C158] mt-2">+{correctCount * 10} نقطة معرفة</p>
        {alreadyCompleted && <p className="text-xs text-[#A89CB9] mt-2">تُضاف نقاط كل لعبة إلى رصيدك مرة واحدة فقط.</p>}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button onClick={restart} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#3C2975] bg-[#160E36] text-sm font-bold hover:border-[#E5C158]">
            <RotateCcw className="w-4 h-4" /> العب مجددًا
          </button>
          <button onClick={onBack} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E5C158] text-[#110B29] text-sm font-bold">
            اختر لعبة أخرى <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto">
      <button onClick={onBack} className="text-xs text-[#E5C158] hover:underline mb-5">الألعاب التفاعلية / {title}</button>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-xs text-[#D4AF37]">السؤال {round + 1} من {questions.length}</span>
          <h2 className="text-2xl sm:text-3xl font-serif-ar font-bold mt-1">{title}</h2>
        </div>
        <span className="font-num text-sm text-[#E5C158]">{correctCount * 10} نقطة</span>
      </div>

      <div className="h-2 bg-[#251850] overflow-hidden rounded-full mb-6">
        <div className="h-full bg-[#E5C158] transition-all" style={{ width: `${((round + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#3C2975] bg-[#160E36]">
        {mode === 'image' ? (
          <div className="relative h-64 sm:h-80">
            <img src={place.coverImage} alt="صورة مكان مقدسي مطلوب التعرّف إليه" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#110B29] via-transparent to-transparent" />
            <span className="absolute bottom-4 right-4 text-sm font-bold">أي مكان مقدسي يظهر في الصورة؟</span>
          </div>
        ) : (
          <div className="p-7 sm:p-10 min-h-64 flex flex-col justify-center relative overflow-hidden">
            <BookOpenText className="absolute -left-5 -bottom-6 w-40 h-40 text-[#E5C158]/5" />
            <span className="text-xs text-[#D4AF37] mb-3">من ذاكرة المكان في سيرة</span>
            <blockquote className="font-serif-ar text-xl sm:text-2xl leading-loose text-[#FAF8F5]">«{place.livingMemory}»</blockquote>
          </div>
        )}

        <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-3">
          {options.map((option) => {
            const answered = Boolean(selectedId);
            const correct = option.id === place.id;
            const selected = option.id === selectedId;
            const stateClass = answered && correct
              ? 'border-[#22C55E] bg-[#0E3A24]/70 text-[#DCFCE7]'
              : answered && selected
                ? 'border-[#EF4444] bg-[#3A141A]/70 text-[#FEE2E2]'
                : answered
                  ? 'border-[#251850] text-[#7F7296]'
                  : 'border-[#3C2975] hover:border-[#E5C158] hover:bg-[#251854]';
            return (
              <button key={option.id} disabled={answered} onClick={() => answer(option.id)} className={`min-h-14 px-4 py-3 rounded-xl border text-right font-bold transition-all flex items-center justify-between ${stateClass}`}>
                <span>{option.name}</span>
                {answered && correct && <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />}
                {answered && selected && !correct && <XCircle className="w-5 h-5 text-[#EF4444]" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedId && (
        <div className={`mt-4 p-5 rounded-xl border ${isCorrect ? 'border-[#22C55E]/50 bg-[#0E3A24]/40' : 'border-[#D4AF37]/40 bg-[#1A1239]'}`}>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#E5C158] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{isCorrect ? 'إجابة صحيحة' : `الإجابة هي: ${place.name}`}</p>
              <p className="text-sm text-[#D8CDE8] leading-relaxed mt-1">{place.shortDescription}</p>
              <button onClick={() => onNavigate(`/place/${place.slug}`)} className="inline-flex items-center gap-1 text-xs text-[#E5C158] mt-3 hover:underline">
                اكتشف حكاية المكان <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={next} className="shrink-0 px-4 py-2 rounded-xl bg-[#E5C158] text-[#110B29] text-xs font-bold">
              {round === questions.length - 1 ? 'النتيجة' : 'التالي'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

interface RouteOrderGameProps {
  route?: Route;
  alreadyCompleted: boolean;
  onBack: () => void;
  onComplete: (points: number) => void;
  onNavigate: (path: string) => void;
}

const RouteOrderGame: React.FC<RouteOrderGameProps> = ({ route, alreadyCompleted, onBack, onComplete, onNavigate }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const shuffledStops = useMemo(() => route ? [...route.stops].reverse() : [], [route]);

  if (!route || route.stops.length < 2) {
    return <p className="py-16 text-center text-[#C4B7D8]">لا يوجد مسار مكتمل لهذه اللعبة حاليًا.</p>;
  }

  const choose = (placeId: string) => {
    if (selected.includes(placeId) || result) return;
    const next = [...selected, placeId];
    setSelected(next);
    if (next.length === route.stops.length) {
      const correct = next.every((id, index) => id === route.stops[index].placeId);
      setResult(correct ? 'correct' : 'wrong');
      if (correct) onComplete(30);
    }
  };

  const reset = () => {
    setSelected([]);
    setResult(null);
  };

  return (
    <section className="max-w-3xl mx-auto">
      <button onClick={onBack} className="text-xs text-[#E5C158] hover:underline mb-5">الألعاب التفاعلية / رتّب المسار</button>
      <span className="text-xs text-[#D4AF37]">المكان يقود إلى المكان</span>
      <h2 className="text-3xl font-serif-ar font-bold mt-1">رتّب محطات «{route.title}»</h2>
      <p className="text-sm text-[#C4B7D8] mt-3 leading-relaxed">اختر المحطات بالترتيب الذي تسير به رحلة سيرة، من البداية حتى المحطة الأخيرة.</p>

      <div className="mt-7 min-h-20 border-y border-[#2B1E55] py-4 flex items-center gap-2 overflow-x-auto" aria-label="ترتيبك الحالي">
        {route.stops.map((_, index) => {
          const stop = route.stops.find((item) => item.placeId === selected[index]);
          return (
            <React.Fragment key={index}>
              <div className={`min-w-32 min-h-14 px-3 py-2 border flex items-center gap-2 ${stop ? 'border-[#D4AF37]/60 bg-[#160E36]' : 'border-dashed border-[#3C2975] text-[#7F7296]'}`}>
                <span className="font-num text-[#E5C158]">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-xs font-bold">{stop?.title || 'اختر محطة'}</span>
              </div>
              {index < route.stops.length - 1 && <ArrowLeft className="w-4 h-4 text-[#D4AF37] shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        {shuffledStops.map((stop) => {
          const used = selected.includes(stop.placeId);
          return (
            <button key={stop.placeId} disabled={used || Boolean(result)} onClick={() => choose(stop.placeId)} className="p-4 rounded-xl border border-[#3C2975] bg-[#160E36] text-right hover:border-[#E5C158] disabled:opacity-35 transition-all">
              <span className="flex items-center gap-2 text-[#E5C158] text-xs"><MapPin className="w-4 h-4" /> محطة من المسار</span>
              <strong className="block mt-2">{stop.title}</strong>
              <span className="text-xs text-[#A89CB9] mt-1 block">{stop.highlightText}</span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && !result && (
        <button onClick={() => setSelected((items) => items.slice(0, -1))} className="inline-flex items-center gap-2 text-xs text-[#E5C158] mt-4">
          <RotateCcw className="w-4 h-4" /> تراجع عن آخر اختيار
        </button>
      )}

      {result && (
        <div className={`mt-6 p-5 border rounded-xl ${result === 'correct' ? 'border-[#22C55E] bg-[#0E3A24]/50' : 'border-[#EF4444]/60 bg-[#3A141A]/40'}`}>
          <div className="flex items-center gap-2 font-bold">
            {result === 'correct' ? <CheckCircle2 className="text-[#22C55E]" /> : <XCircle className="text-[#EF4444]" />}
            <span>{result === 'correct' ? 'أحسنت، وصلت الحكايات بأماكنها بالترتيب الصحيح.' : 'الترتيب غير مكتمل؛ جرّب أن تبدأ من بوابة الرحلة.'}</span>
          </div>
          {result === 'correct' && <p className="text-[#E5C158] font-num mt-2">+30 نقطة معرفة {alreadyCompleted ? '· تُحتسب مرة واحدة' : ''}</p>}
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={reset} className="px-4 py-2 rounded-xl border border-[#3C2975] text-xs font-bold">أعد المحاولة</button>
            <button onClick={() => onNavigate(`/routes/${route.slug}`)} className="px-4 py-2 rounded-xl bg-[#E5C158] text-[#110B29] text-xs font-bold">عِش المسار على الخريطة</button>
          </div>
        </div>
      )}
    </section>
  );
};

export const GamesView: React.FC<GamesViewProps> = ({ places, routes, progress, onNavigate, onGameComplete }) => {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const completed = (id: GameId) => progress.completedChallenges.includes(`game:${id}`);
  const route = routes.find((item) => item.slug === 'journey-in-heart-of-jerusalem') || routes.find((item) => item.stops.length >= 3);

  const finish = (id: GameId, points: number) => {
    if (points > 0) onGameComplete(`game:${id}`, points);
  };

  if (activeGame === 'image') return <div className="min-h-screen bg-[#0D081F] px-4 py-10 pb-28"><PlaceQuiz mode="image" places={places} alreadyCompleted={completed('image')} onBack={() => setActiveGame(null)} onComplete={(points) => finish('image', points)} onNavigate={onNavigate} /></div>;
  if (activeGame === 'memory') return <div className="min-h-screen bg-[#0D081F] px-4 py-10 pb-28"><PlaceQuiz mode="memory" places={places} alreadyCompleted={completed('memory')} onBack={() => setActiveGame(null)} onComplete={(points) => finish('memory', points)} onNavigate={onNavigate} /></div>;
  if (activeGame === 'route') return <div className="min-h-screen bg-[#0D081F] px-4 py-10 pb-28"><RouteOrderGame route={route} alreadyCompleted={completed('route')} onBack={() => setActiveGame(null)} onComplete={(points) => finish('route', points)} onNavigate={onNavigate} /></div>;

  const games = [
    { id: 'image' as const, icon: Camera, eyebrow: 'صورة ومكان', title: 'اعرف المكان من الصورة', description: 'اقرأ الحجر والقباب والأزقة، ثم اختر اسم المعلم المقدسي الصحيح.', reward: 'حتى 40 نقطة' },
    { id: 'memory' as const, icon: BookOpenText, eyebrow: 'ذاكرة وحكاية', title: 'لمن تنتمي هذه الذاكرة؟', description: 'اربط مشهدًا من الحياة والذاكرة بالمكان الذي تحتفظ به سيرة.', reward: 'حتى 40 نقطة' },
    { id: 'route' as const, icon: Footprints, eyebrow: 'خريطة ومسار', title: 'رتّب محطات الرحلة', description: 'أعد بناء مسار في قلب القدس من البوابة الأولى إلى المحطة الأخيرة.', reward: '30 نقطة' },
  ];

  return (
    <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] pb-28 text-right">
      <header className="relative overflow-hidden border-b border-[#2B1E55] bg-[#110B29]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#D4AF37,transparent_35%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 text-[#E5C158] text-xs font-bold mb-5"><Gamepad2 className="w-4 h-4" /> تعلّم باللعب</div>
          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
            <div>
              <h1 className="text-4xl sm:text-6xl font-serif-ar font-bold">الألعاب التفاعلية</h1>
              <p className="max-w-2xl text-[#D8CDE8] leading-loose mt-5">اختبر ما اكتشفته في سيرة. كل لعبة مبنية من أماكن القدس وحكاياتها ومساراتها، وكل إجابة تفتح لك بابًا للعودة إلى القصة الأصلية.</p>
            </div>
            <div className="border-r-2 border-[#E5C158] pr-5 py-1">
              <span className="text-xs text-[#A89CB9]">رصيدك في سيرة</span>
              <strong className="block text-3xl font-num text-[#E5C158] mt-1">{progress.totalPoints}</strong>
              <span className="text-xs text-[#C4B7D8]">نقطة اكتشاف</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid lg:grid-cols-3 gap-5">
          {games.map((game, index) => {
            const Icon = game.icon;
            const isDone = completed(game.id);
            return (
              <button key={game.id} onClick={() => setActiveGame(game.id)} className="group text-right bg-[#160E36] border border-[#2B1E55] hover:border-[#D4AF37] overflow-hidden transition-all focus-visible:outline-2 focus-visible:outline-[#FFE79A]">
                <div className="h-1 bg-[#E5C158] origin-right scale-x-0 group-hover:scale-x-100 transition-transform" />
                <div className="p-6 sm:p-7 min-h-72 flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-num text-4xl text-[#3C2975]">0{index + 1}</span>
                    <Icon className="w-8 h-8 text-[#E5C158]" />
                  </div>
                  <span className="text-xs text-[#D4AF37] mt-8">{game.eyebrow}</span>
                  <h2 className="text-2xl font-serif-ar font-bold mt-2 group-hover:text-[#E5C158] transition-colors">{game.title}</h2>
                  <p className="text-sm text-[#C4B7D8] leading-relaxed mt-3 flex-1">{game.description}</p>
                  <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-[#2B1E55]">
                    <span className="text-xs text-[#E5C158] flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {game.reward}</span>
                    <span className={`text-xs font-bold ${isDone ? 'text-[#86EFAC]' : 'text-[#FAF8F5]'}`}>{isDone ? 'مكتملة ✓' : 'ابدأ اللعب ←'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <aside className="mt-10 border-r-2 border-[#D4AF37] pr-5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">المعرفة قبل النقاط</h2>
            <p className="text-sm text-[#A89CB9] mt-1">لا تستخدم الألعاب معلومات خارج محتوى المنصة، ويمكنك دائمًا فتح حكاية المكان لفهم الإجابة.</p>
          </div>
          <button onClick={() => onNavigate('/explore')} className="inline-flex items-center gap-2 text-sm font-bold text-[#E5C158] shrink-0">عد إلى الخريطة <ArrowLeft className="w-4 h-4" /></button>
        </aside>
      </main>
    </div>
  );
};
