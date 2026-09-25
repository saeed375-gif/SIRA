import React, { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ChevronLeft, LoaderCircle, RotateCcw, SendHorizonal, X } from 'lucide-react';
import { getLanguageDirection, type PlatformLanguage } from '../lib/translation';
import { apiUrl } from '../lib/api';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
type Suggestion = { label: string; path: string };
type AssistantCopy = {
  title: string; subtitle: string; greeting: string; placeholder: string; thinking: string; privacy: string;
  newChat: string; close: string; send: string; unavailable: string; quickQuestions: [string, string, string];
};

interface SiraAssistantProps {
  onNavigate: (path: string) => void;
  language: PlatformLanguage;
  theme: 'dark' | 'light';
}

const COPY: Record<PlatformLanguage, AssistantCopy> = {
  ar: { title: 'رفيق سِيرة', subtitle: 'دليلك الهادئ داخل المنصة', greeting: 'أهلًا بك. اسألني عن الأماكن والمسارات والحكايات والألعاب، وسأرشدك إلى ما هو متاح داخل سِيرة.', placeholder: 'اكتب سؤالك عن سِيرة…', thinking: 'يفكّر رفيق سِيرة…', privacy: 'لا تشارك معلومات شخصية أو حساسة. المحادثة لا تُحفظ في حسابك.', newChat: 'محادثة جديدة', close: 'إغلاق الدليل', send: 'إرسال السؤال', unavailable: 'تعذر الوصول إلى رفيق سِيرة الآن.', quickQuestions: ['اقترح مسارًا مناسبًا لرحلتي', 'كيف أستكشف الخريطة؟', 'ما الذي يمكن للأطفال فعله هنا؟'] },
  en: { title: 'Sira Companion', subtitle: 'Your calm guide through the platform', greeting: 'Welcome. Ask about places, routes, stories, or games, and I will guide you to what is available in Sira.', placeholder: 'Ask about Sira…', thinking: 'Sira Companion is thinking…', privacy: 'Do not share personal or sensitive information. This chat is not saved to your account.', newChat: 'New conversation', close: 'Close guide', send: 'Send question', unavailable: 'Sira Companion is unavailable right now.', quickQuestions: ['Suggest a route for my visit', 'How do I explore the map?', 'What can children do here?'] },
  pt: { title: 'Companheiro Sira', subtitle: 'Seu guia calmo pela plataforma', greeting: 'Boas-vindas. Pergunte sobre lugares, rotas, histórias ou jogos e eu mostrarei o que está disponível na Sira.', placeholder: 'Pergunte sobre a Sira…', thinking: 'O Companheiro Sira está pensando…', privacy: 'Não partilhe informações pessoais ou sensíveis. Esta conversa não é guardada na sua conta.', newChat: 'Nova conversa', close: 'Fechar guia', send: 'Enviar pergunta', unavailable: 'O Companheiro Sira não está disponível agora.', quickQuestions: ['Sugira uma rota para a minha visita', 'Como exploro o mapa?', 'O que as crianças podem fazer aqui?'] },
  tr: { title: 'Sira Yoldaşı', subtitle: 'Platformdaki sakin rehberiniz', greeting: 'Hoş geldiniz. Yerler, rotalar, hikâyeler veya oyunlar hakkında sorun; Sira’da bulunanlara sizi yönlendireyim.', placeholder: 'Sira hakkında sorun…', thinking: 'Sira Yoldaşı düşünüyor…', privacy: 'Kişisel veya hassas bilgi paylaşmayın. Bu sohbet hesabınıza kaydedilmez.', newChat: 'Yeni sohbet', close: 'Rehberi kapat', send: 'Soruyu gönder', unavailable: 'Sira Yoldaşı şu anda kullanılamıyor.', quickQuestions: ['Ziyaretim için bir rota öner', 'Haritayı nasıl keşfederim?', 'Çocuklar burada ne yapabilir?'] },
  ru: { title: 'Спутник Sira', subtitle: 'Ваш спокойный проводник по платформе', greeting: 'Добро пожаловать. Спросите о местах, маршрутах, историях или играх, и я подскажу, что доступно в Sira.', placeholder: 'Спросите о Sira…', thinking: 'Спутник Sira думает…', privacy: 'Не сообщайте личную или конфиденциальную информацию. Этот чат не сохраняется в вашем аккаунте.', newChat: 'Новый разговор', close: 'Закрыть помощника', send: 'Отправить вопрос', unavailable: 'Спутник Sira сейчас недоступен.', quickQuestions: ['Предложите маршрут для визита', 'Как исследовать карту?', 'Что могут делать дети?'] },
  fr: { title: 'Compagnon Sira', subtitle: 'Votre guide paisible dans la plateforme', greeting: 'Bienvenue. Posez vos questions sur les lieux, itinéraires, récits ou jeux, et je vous guiderai vers ce qui est disponible dans Sira.', placeholder: 'Posez votre question sur Sira…', thinking: 'Le Compagnon Sira réfléchit…', privacy: 'Ne partagez pas d’informations personnelles ou sensibles. Cette conversation n’est pas enregistrée dans votre compte.', newChat: 'Nouvelle discussion', close: 'Fermer le guide', send: 'Envoyer la question', unavailable: 'Le Compagnon Sira est indisponible pour le moment.', quickQuestions: ['Suggérez un itinéraire pour ma visite', 'Comment explorer la carte ?', 'Que peuvent faire les enfants ici ?'] },
  'zh-CN': { title: 'Sira 伙伴', subtitle: '您在平台中的温和向导', greeting: '欢迎。您可以询问地点、路线、故事或游戏，我会引导您了解 Sira 中可用的内容。', placeholder: '询问有关 Sira 的问题…', thinking: 'Sira 伙伴正在思考…', privacy: '请勿分享个人或敏感信息。此对话不会保存到您的帐户。', newChat: '新对话', close: '关闭向导', send: '发送问题', unavailable: 'Sira 伙伴暂时不可用。', quickQuestions: ['为我的参观推荐一条路线', '如何探索地图？', '孩子们可以在这里做什么？'] },
  ja: { title: 'Sira コンパニオン', subtitle: 'プラットフォーム内の穏やかな案内役', greeting: 'ようこそ。場所、ルート、物語、ゲームについて質問してください。Sira 内で利用できる内容をご案内します。', placeholder: 'Sira について質問する…', thinking: 'Sira コンパニオンが考えています…', privacy: '個人情報や機密情報は共有しないでください。この会話はアカウントに保存されません。', newChat: '新しい会話', close: 'ガイドを閉じる', send: '質問を送信', unavailable: 'Sira コンパニオンは現在利用できません。', quickQuestions: ['訪問に合うルートを提案して', '地図をどう探索しますか？', '子どもはここで何ができますか？'] },
  ko: { title: 'Sira 동반자', subtitle: '플랫폼 안의 차분한 안내자', greeting: '환영합니다. 장소, 경로, 이야기 또는 게임에 관해 물어보세요. Sira에서 이용할 수 있는 내용을 안내해 드립니다.', placeholder: 'Sira에 관해 질문하기…', thinking: 'Sira 동반자가 생각하고 있습니다…', privacy: '개인 정보나 민감한 정보를 공유하지 마세요. 이 대화는 계정에 저장되지 않습니다.', newChat: '새 대화', close: '안내자 닫기', send: '질문 보내기', unavailable: 'Sira 동반자를 지금 사용할 수 없습니다.', quickQuestions: ['방문에 맞는 경로를 추천해 주세요', '지도를 어떻게 탐색하나요?', '어린이는 여기서 무엇을 할 수 있나요?'] },
};

function requestId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SiraAssistant({ onNavigate, language, theme }: SiraAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const copy = COPY[language];

  useEffect(() => { if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 80); }, [isOpen]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { setError(''); }, [language]);

  const clearConversation = () => { setMessages([]); setSuggestions([]); setError(''); setInput(''); };

  const send = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const content = (preset || input).trim();
    if (content.length < 2 || isLoading) return;
    const previousMessages = messages;
    setMessages((current) => [...current, { id: requestId(), role: 'user', content }]);
    setInput(''); setError(''); setSuggestions([]); setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/assistant/chat'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message: content, language, history: previousMessages.slice(-8).map(({ role, content: turnContent }) => ({ role, content: turnContent })) }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.answer) throw new Error(response.status === 503 ? copy.unavailable : body?.error || copy.unavailable);
      setMessages((current) => [...current, { id: requestId(), role: 'assistant', content: String(body.answer) }]);
      setSuggestions(Array.isArray(body.suggestions) ? body.suggestions.filter((item: unknown): item is Suggestion => Boolean(item && typeof item === 'object' && typeof (item as Suggestion).label === 'string' && typeof (item as Suggestion).path === 'string' && (item as Suggestion).path.startsWith('/'))).slice(0, 2) : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.unavailable);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); }
  };

  return (
    <section className="sira-assistant notranslate" data-sira-theme={theme} dir={getLanguageDirection(language)} lang={language} aria-label={copy.title}>
      {isOpen && (
        <div className="sira-assistant-panel" role="dialog" aria-modal="true" aria-labelledby="sira-assistant-title">
          <header className="sira-assistant-header">
            <div className="sira-assistant-identity"><img src="/brand/sira-companion.png" width="56" height="56" alt="" className="sira-assistant-avatar" /><div><h2 id="sira-assistant-title">{copy.title}</h2><p>{copy.subtitle}</p></div></div>
            <div className="sira-assistant-actions"><button type="button" onClick={clearConversation} disabled={isLoading || messages.length === 0} aria-label={copy.newChat} title={copy.newChat}><RotateCcw className="h-4 w-4" /></button><button type="button" onClick={() => setIsOpen(false)} aria-label={copy.close} title={copy.close}><X className="h-5 w-5" /></button></div>
          </header>

          <div className="sira-assistant-messages">
            {messages.length === 0 && <div className="sira-assistant-welcome"><p>{copy.greeting}</p><div className="sira-quick-questions">{copy.quickQuestions.map((question) => <button key={question} type="button" onClick={() => void send(undefined, question)}>{question}</button>)}</div></div>}
            {messages.map((message) => <article key={message.id} className={`sira-message sira-message-${message.role}`}><p>{message.content}</p></article>)}
            {isLoading && <div className="sira-message sira-message-assistant"><p className="sira-assistant-thinking"><LoaderCircle className="h-4 w-4 animate-spin" />{copy.thinking}</p></div>}
            {error && <p role="alert" className="sira-assistant-error">{error}</p>}
            {suggestions.length > 0 && !isLoading && <div className="sira-assistant-suggestions">{suggestions.map((suggestion) => <button key={suggestion.path} type="button" onClick={() => { onNavigate(suggestion.path); setIsOpen(false); }}><ChevronLeft className="h-3.5 w-3.5" />{suggestion.label}</button>)}</div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={(event) => void send(event)} className="sira-assistant-composer"><label className="sr-only" htmlFor="sira-assistant-input">{copy.placeholder}</label><div><textarea ref={inputRef} id="sira-assistant-input" value={input} onChange={(event) => setInput(event.target.value.slice(0, 1200))} onKeyDown={handleKeyDown} rows={2} maxLength={1200} placeholder={copy.placeholder} disabled={isLoading} /><button type="submit" disabled={isLoading || input.trim().length < 2} aria-label={copy.send}><SendHorizonal className="h-4 w-4" /></button></div><p>{copy.privacy}</p></form>
        </div>
      )}
      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="sira-assistant-title" className="sira-assistant-trigger" title={copy.title} aria-label={isOpen ? copy.close : copy.title}>{isOpen ? <X className="h-5 w-5" /> : <img src="/brand/sira-companion.png" width="64" height="64" alt="" />}</button>
    </section>
  );
}
