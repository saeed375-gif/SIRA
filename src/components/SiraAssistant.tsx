import React, { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { BotMessageSquare, ChevronLeft, LoaderCircle, MessageCircleQuestion, RotateCcw, SendHorizonal, Sparkles, X } from 'lucide-react';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
type Suggestion = { label: string; path: string };

interface SiraAssistantProps {
  onNavigate: (path: string) => void;
}

const QUICK_QUESTIONS = [
  'اقترح مسارًا مناسبًا لرحلتي',
  'كيف أستكشف الخريطة؟',
  'ما الذي يمكن للأطفال فعله هنا؟',
];

function requestId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SiraAssistant({ onNavigate }: SiraAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, isLoading]);

  const clearConversation = () => {
    setMessages([]);
    setSuggestions([]);
    setError('');
    setInput('');
  };

  const send = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const content = (preset || input).trim();
    if (content.length < 2 || isLoading) return;

    const previousMessages = messages;
    const userMessage: Message = { id: requestId(), role: 'user', content };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setSuggestions([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: content,
          history: previousMessages.slice(-8).map(({ role, content: turnContent }) => ({ role, content: turnContent })),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.answer) throw new Error(body?.error || 'تعذر الوصول إلى دليل سِيرة الآن.');
      setMessages((current) => [...current, { id: requestId(), role: 'assistant', content: String(body.answer) }]);
      setSuggestions(Array.isArray(body.suggestions) ? body.suggestions.filter((item: unknown): item is Suggestion => {
        return Boolean(item && typeof item === 'object' && typeof (item as Suggestion).label === 'string' && typeof (item as Suggestion).path === 'string' && (item as Suggestion).path.startsWith('/'));
      }).slice(0, 2) : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر الوصول إلى دليل سِيرة الآن.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <section className="sira-assistant notranslate" dir="rtl" aria-label="دليل سيرة الذكي">
      {isOpen && (
        <div className="sira-assistant-panel" role="dialog" aria-modal="true" aria-labelledby="sira-assistant-title">
          <header className="flex items-start justify-between gap-4 border-b border-[#3C2975] bg-[#160E36] px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#E5C158] to-[#C28A2B] text-[#110B29] shadow-lg shadow-[#D4AF37]/20">
                <BotMessageSquare className="h-5 w-5" />
              </span>
              <div>
                <h2 id="sira-assistant-title" className="text-sm font-extrabold text-[#FAF8F5]">دليل سِيرة الذكي</h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#C4B7D8]">إجابات مرتبطة بمحتوى المنصة المنشور</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={clearConversation} disabled={isLoading || messages.length === 0} aria-label="بدء محادثة جديدة" title="محادثة جديدة" className="grid h-9 w-9 place-items-center rounded-xl text-[#C4B7D8] transition hover:bg-[#251854] hover:text-[#E5C158] disabled:cursor-not-allowed disabled:opacity-35">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="إغلاق دليل سيرة" className="grid h-9 w-9 place-items-center rounded-xl text-[#C4B7D8] transition hover:bg-[#251854] hover:text-[#FAF8F5]">
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="sira-assistant-messages">
            {messages.length === 0 && (
              <div className="py-2 text-right">
                <div className="rounded-2xl rounded-tr-sm border border-[#3C2975] bg-[#1C123D] p-4 text-sm leading-7 text-[#E2DCEB]">
                  أهلًا بك. أسألني عن الأماكن والمسارات والحكايات والألعاب، وسأرشدك إلى ما هو متاح داخل سِيرة.
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((question) => (
                    <button key={question} type="button" onClick={() => void send(undefined, question)} className="rounded-xl border border-[#3C2975] bg-[#160E36] px-3 py-2 text-xs font-bold text-[#E5C158] transition hover:border-[#D4AF37] hover:bg-[#251854]">
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <article key={message.id} className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-7 ${message.role === 'user' ? 'rounded-tl-sm bg-[#D4AF37] text-[#110B29]' : 'rounded-tr-sm border border-[#3C2975] bg-[#1C123D] text-[#E2DCEB]'}`}>
                  {message.content}
                </p>
              </article>
            ))}

            {isLoading && (
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-tr-sm border border-[#3C2975] bg-[#1C123D] px-3.5 py-3 text-xs text-[#C4B7D8]">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#E5C158]" /> يفكّر الدليل…
                </div>
              </div>
            )}

            {error && <p role="alert" className="rounded-xl border border-[#EF4444]/50 bg-[#401821]/50 px-3 py-2 text-xs leading-6 text-[#FECACA]">{error}</p>}

            {suggestions.length > 0 && !isLoading && (
              <div className="flex flex-wrap justify-end gap-2">
                {suggestions.map((suggestion) => (
                  <button key={suggestion.path} type="button" onClick={() => { onNavigate(suggestion.path); setIsOpen(false); }} className="inline-flex items-center gap-1 rounded-xl border border-[#D4AF37]/50 bg-[#160E36] px-3 py-2 text-xs font-bold text-[#E5C158] transition hover:bg-[#251854]">
                    <ChevronLeft className="h-3.5 w-3.5" /> {suggestion.label}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(event) => void send(event)} className="border-t border-[#3C2975] bg-[#160E36] p-3">
            <label className="sr-only" htmlFor="sira-assistant-input">اسأل دليل سيرة</label>
            <div className="flex items-end gap-2 rounded-2xl border border-[#3C2975] bg-[#110B29] p-2 focus-within:border-[#D4AF37]">
              <textarea ref={inputRef} id="sira-assistant-input" value={input} onChange={(event) => setInput(event.target.value.slice(0, 1200))} onKeyDown={handleKeyDown} rows={2} maxLength={1200} placeholder="اكتب سؤالك عن سِيرة…" disabled={isLoading} className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-6 text-[#FAF8F5] outline-none placeholder:text-[#7F7296] disabled:cursor-wait" />
              <button type="submit" disabled={isLoading || input.trim().length < 2} aria-label="إرسال السؤال" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E5C158] text-[#110B29] transition hover:bg-[#FFE79A] disabled:cursor-not-allowed disabled:opacity-40">
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
            <p className="px-1 pt-2 text-[10px] leading-5 text-[#8E80A4]">لا تشارك معلومات شخصية أو حساسة. المحادثة لا تُحفظ في حسابك.</p>
          </form>
        </div>
      )}

      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="sira-assistant-title" className="sira-assistant-trigger group" title="اسأل دليل سيرة">
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-5 w-5" />}
        <span>اسأل سِيرة</span>
        {!isOpen && <Sparkles className="h-3.5 w-3.5 text-[#FFE79A]" />}
      </button>
    </section>
  );
}
