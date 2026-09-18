import React, { useEffect, useId, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
interface Props {
  title: string; durationSeconds: number; narrator: string; script: string;
  highlights: Array<{ time: number; text: string }>; placeName: string;
  audioUrl?: string; isDemo?: boolean; isAiGenerated?: boolean;
}
const format = (n: number) => `${Math.floor(n / 60)}:${Math.floor(n % 60).toString().padStart(2, '0')}`;
export const AudioStoryPlayer: React.FC<Props> = ({ title, durationSeconds, narrator, script, highlights, placeName, audioUrl, isDemo, isAiGenerated }) => {
  const audio = useRef<HTMLAudioElement>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const id = useId();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const reset = () => {
    if (audio.current) { audio.current.pause(); audio.current.currentTime = 0; }
    if (utterance.current) { window.speechSynthesis.cancel(); utterance.current = null; }
    setPlaying(false); setTime(0); setEnded(false);
  };
  useEffect(() => {
    const stopOthers = (event: Event) => {
      if ((event as CustomEvent).detail !== id) reset();
    };
    window.addEventListener('sira-audio-play', stopOthers);
    return () => {
      window.removeEventListener('sira-audio-play', stopOthers);
      if (utterance.current) window.speechSynthesis?.cancel();
    };
  }, [id, audioUrl, script]);
  const toggle = async () => {
    setError('');
    if (playing) {
      if (audio.current) audio.current.pause();
      else { window.speechSynthesis.pause(); setPlaying(false); }
      return;
    }
    window.dispatchEvent(new CustomEvent('sira-audio-play', { detail: id }));
    if (audio.current) {
      try { await audio.current.play(); } catch { setError('تعذّر تشغيل الصوت. حاول مجددًا أو اقرأ الوصف أدناه.'); }
    } else {
      if (!('speechSynthesis' in window)) { setError('القراءة الآلية غير متاحة في هذا المتصفح. يمكنك قراءة النص أدناه.'); return; }
      if (utterance.current && window.speechSynthesis.paused) { window.speechSynthesis.resume(); setPlaying(true); return; }
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('ar'));
      if (!voices.length) { setError('لا يتوفر صوت عربي على هذا الجهاز. النص الكامل متاح أدناه.'); return; }
      const speech = new SpeechSynthesisUtterance(script);
      speech.voice = voices[0]; speech.lang = 'ar'; speech.rate = rate;
      speech.onstart = () => { setPlaying(true); setEnded(false); };
      speech.onend = () => { setPlaying(false); setEnded(true); utterance.current = null; };
      speech.onerror = e => { setPlaying(false); utterance.current = null; if (e.error !== 'canceled' && e.error !== 'interrupted') setError('تعذّرت القراءة الآلية. يمكنك قراءة النص أدناه.'); };
      utterance.current = speech; window.speechSynthesis.speak(speech);
    }
  };
  return <div className={`sira-audio rounded-2xl bg-[#160E36] border p-5 ${playing ? 'border-[#E5C158] shadow-lg shadow-[#D4AF37]/10' : 'border-[#D4AF37]/30'}`}>
    <div className="flex gap-3 items-start"><Volume2 className="w-5 h-5 text-[#E5C158] shrink-0" /><div>
      <p className="text-xs text-[#E5C158] mb-1">{placeName} · {isAiGenerated ? 'سرد عربي مولّد بالذكاء الاصطناعي' : audioUrl ? (isDemo ? 'عيّنة صوتية مصنوعة' : narrator) : 'قراءة آلية للنص'}</p>
      <h3 className="text-lg text-[#FAF8F5] font-bold">{title}</h3>
    </div></div>
    {audioUrl && <audio ref={audio} src={audioUrl} preload="metadata" onPlay={() => { setPlaying(true); setEnded(false); }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setEnded(true); }} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onError={() => { setPlaying(false); setError('تعذّر تحميل الملف الصوتي. يمكنك قراءة النص الكامل أدناه.'); }} />}
    <div aria-hidden="true" className="flex items-center gap-1 h-12 my-4" dir="ltr">{Array.from({ length: 36 }, (_, i) => <span key={i} className={`flex-1 rounded-full ${playing ? 'wave-bar-active bg-[#E5C158]' : 'bg-[#645080]'}`} style={{ height: `${20 + ((i * 37) % 75)}%`, animationDelay: `${i % 7 * .13}s` }} />)}</div>
    {audioUrl && <><input aria-label={`موضع تشغيل ${title}`} type="range" min={0} max={duration || durationSeconds} step="0.1" value={time} onChange={e => { if (audio.current) audio.current.currentTime = Number(e.target.value); setTime(Number(e.target.value)); }} className="w-full accent-[#E5C158]" dir="ltr" /><div className="flex justify-between text-xs text-[#C4B7D8] my-2" dir="ltr"><span>{format(time)}</span><span>{format(duration)}</span></div></>}
    <div className="flex items-center justify-between gap-2">
      <button onClick={toggle} aria-label={`${playing ? 'إيقاف مؤقت' : 'تشغيل'}: ${title}`} aria-pressed={playing} className="life-button">{playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'إيقاف مؤقت' : ended ? 'استمع مجددًا' : 'استمع إلى المكان'}</button>
      <button onClick={reset} aria-label="إعادة الصوت إلى البداية" className="p-2 text-[#E5C158]"><RotateCcw size={18} /></button>
      {audioUrl && <button aria-label="تغيير سرعة الصوت" className="rounded-lg border border-[#D4AF37]/30 px-2.5 py-1.5 text-xs text-[#E5C158]" onClick={() => { const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1; setRate(next); if (audio.current) audio.current.playbackRate = next; }}>{rate}×</button>}
    </div>
    {error && <p role="alert" className="text-sm text-[#FFE79A] mt-3">{error}</p>}
    <details className="mt-4 text-xs text-[#C4B7D8]"><summary className="cursor-pointer py-2">{audioUrl ? 'النص وبيانات التسجيل' : 'اقرأ النص'}</summary><p className="leading-loose mt-2">{script || highlights[0]?.text}</p>{isAiGenerated && <p className="mt-3 rounded-lg bg-[#E5C158]/5 border border-[#D4AF37]/20 p-3 text-[#D8CDE8]">هذا السرد من إنتاج الذكاء الاصطناعي اعتمادًا على النص التحريري المرفق، وليس شهادةً صوتية أو تسجيلًا ميدانيًا من القدس.</p>}{isDemo && !isAiGenerated && <p className="mt-2">صوت تجريبي مصنوع؛ ليس تسجيلًا ميدانيًا من القدس.</p>}</details>
  </div>;
};
