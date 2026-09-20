import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Challenge } from '../types';
import { HelpCircle, CheckCircle2, XCircle, Award, Sparkles, ArrowLeft } from 'lucide-react';

interface PlaceChallengeProps {
  challenge: Challenge;
  placeName: string;
  onSuccess?: (points: number) => boolean;
  onContinueJourney?: () => void;
  nextPlaceSlug?: string;
  onNavigateToNext?: (slug: string) => void;
}

export const PlaceChallenge: React.FC<PlaceChallengeProps> = ({
  challenge,
  placeName,
  onSuccess,
  onContinueJourney,
  nextPlaceSlug,
  onNavigateToNext,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [rewardGranted, setRewardGranted] = useState<boolean | null>(null);
  const isCorrect = selectedOptionId === challenge.correctOptionId;

  const handleSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOptionId(optionId);
    setIsAnswered(true);

    if (optionId === challenge.correctOptionId) {
      // Trigger confetti celebration
      try {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#D4AF37', '#E5C158', '#FAF8F5', '#8A68D6'],
        });
      } catch (e) {
        // fallback
      }

      setRewardGranted(onSuccess ? onSuccess(challenge.rewardPoints) : false);
    }
  };

  const handleReset = () => {
    setSelectedOptionId(null);
    setIsAnswered(false);
    setRewardGranted(null);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#160E36] to-[#251752] border border-[#D4AF37]/40 p-5 md:p-7 shadow-2xl relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E5C158]">
            <Award className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider block">
              تحدي الاكتشاف
            </span>
            <h4 className="text-base md:text-lg font-bold text-[#FAF8F5]">
              هل أصبحت تعرف {placeName}؟
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#110B29]/80 border border-[#D4AF37]/30 text-xs font-bold text-[#E5C158]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-num">{rewardGranted === false ? 'إنجاز جديد بلا نقاط' : `+${challenge.rewardPoints} نقطة اكتشاف`}</span>
        </div>
      </div>

      {/* Question */}
      <p className="text-base md:text-lg font-bold text-[#FAF8F5] mb-5 leading-relaxed">
        {challenge.question}
      </p>

      {/* Options */}
      <div className="space-y-2.5 mb-5">
        {challenge.options.map((opt) => {
          const isThisSelected = selectedOptionId === opt.id;
          const isThisCorrect = opt.id === challenge.correctOptionId;

          let btnStyle = 'bg-[#110B29]/80 border-[#322363] hover:border-[#D4AF37]/60 text-[#FAF8F5]';

          if (isAnswered) {
            if (isThisCorrect) {
              btnStyle = 'bg-[#0E3A24]/80 border-[#22C55E] text-[#DCFCE7] shadow-lg shadow-[#22C55E]/10';
            } else if (isThisSelected && !isThisCorrect) {
              btnStyle = 'bg-[#3A141A]/80 border-[#EF4444] text-[#FEE2E2]';
            } else {
              btnStyle = 'bg-[#110B29]/40 border-[#25184B] text-[#7E7196] opacity-50';
            }
          }

          return (
            <button
              key={opt.id}
              id={`challenge-opt-${opt.id}`}
              disabled={isAnswered}
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-right p-4 rounded-xl border transition-all flex items-center justify-between gap-3 text-sm md:text-base font-medium ${btnStyle}`}
            >
              <span>{opt.text}</span>
              {isAnswered && isThisCorrect && (
                <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0 animate-scale-in" />
              )}
              {isAnswered && isThisSelected && !isThisCorrect && (
                <XCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {isAnswered && (
        <div
          className={`p-4 rounded-xl border mb-4 animate-in fade-in zoom-in-95 duration-300 ${
            isCorrect
              ? 'bg-[#0E3A24]/60 border-[#22C55E]/40 text-[#DCFCE7]'
              : 'bg-[#3A141A]/60 border-[#EF4444]/40 text-[#FEE2E2]'
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                <span className="text-base text-[#22C55E]">أحسنت صنعاً! أثبتّ معرفتك بالقدس.</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-[#EF4444]" />
                <span className="text-base text-[#EF4444]">حاول مجدداً لتثبيت المعلومة.</span>
              </>
            )}
          </div>
          <p className="text-xs md:text-sm text-[#E2E8F0] mt-1 leading-relaxed">
            {challenge.explanation}
          </p>
        </div>
      )}

      {/* Bottom Action */}
      {isAnswered && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {!isCorrect ? (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-[#110B29] hover:bg-[#251854] text-xs font-bold text-[#FAF8F5] border border-[#3C2975] transition-all"
            >
              إعادة المحاولة
            </button>
          ) : (
            <div className="text-xs font-bold text-[#E5C158] flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>{rewardGranted === false ? 'أتممت التحدي مجددًا — احتفال بلا نقاط جديدة.' : onSuccess ? 'تم تسجيل نقاط الاكتشاف في رصيدك!' : 'أحسنت الربط بين الحكاية والمكان.'}</span>
            </div>
          )}

          {nextPlaceSlug && (
            <button
              onClick={() => onNavigateToNext ? onNavigateToNext(nextPlaceSlug) : (window.location.href = `/place/${nextPlaceSlug}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] font-bold text-xs md:text-sm shadow-xl shadow-[#D4AF37]/25 transition-all active:scale-95 ml-auto"
            >
              <span>واصل رحلتك للمحطة التالية</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
