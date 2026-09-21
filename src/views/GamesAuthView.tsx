import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, Eye, EyeOff, Gamepad2, KeyRound, LoaderCircle,
  LockKeyhole, Mail, RotateCcw, ShieldCheck, Sparkles, Trophy, UserRound,
} from 'lucide-react';
import {
  createSiraAccount, requestSiraPasswordRecovery, resendSiraSignupOtp,
  signInToSira, updateSiraPassword, verifySiraOtp,
  type SiraSession,
} from '../services/auth';

type AuthMode = 'login' | 'signup' | 'signup-email' | 'forgot' | 'recovery-otp' | 'new-password' | 'password-success';

interface GamesAuthViewProps {
  onAuthenticated: (session: SiraSession) => void;
  onBack: () => void;
}

const fieldClass = 'w-full rounded-xl border border-[#3C2975] bg-[#0D081F]/80 px-4 py-3.5 text-sm text-[#FAF8F5] outline-none transition placeholder:text-[#6F6382] focus:border-[#E5C158] focus:ring-2 focus:ring-[#E5C158]/15';

function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : 'تعذر الاتصال حاليًا. حاول مرة أخرى.';
}

const OtpInput: React.FC<{ value: string; onChange: (value: string) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange(next.join('').slice(0, 6));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const paste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const code = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!code) return;
    event.preventDefault();
    onChange(code);
    refs.current[Math.min(code.length, 6) - 1]?.focus();
  };

  return (
    <div dir="ltr" className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={paste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => { refs.current[index] = node; }}
          value={digit}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`الرقم ${index + 1} من رمز التحقق`}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digit && index > 0) refs.current[index - 1]?.focus();
            if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
            if (event.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
          }}
          className="h-13 min-w-0 rounded-xl border border-[#4B3689] bg-[#0D081F] text-center font-num text-xl font-bold text-[#E5C158] outline-none transition focus:border-[#E5C158] focus:ring-2 focus:ring-[#E5C158]/20 disabled:opacity-50"
        />
      ))}
    </div>
  );
};

export const GamesAuthLoading: React.FC = () => (
  <div className="min-h-[70vh] grid place-items-center bg-[#0D081F] px-4 pb-24 text-center">
    <div>
      <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-[#E5C158]" />
      <p className="mt-4 text-sm text-[#B8ACC9]">نستعيد رحلتك في ألعاب سيرة...</p>
    </div>
  </div>
);

export const GamesAuthView: React.FC<GamesAuthViewProps> = ({ onAuthenticated, onBack }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [recoverySession, setRecoverySession] = useState<SiraSession | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const resetMessages = () => { setError(''); setNotice(''); };
  const changeMode = (next: AuthMode) => {
    resetMessages();
    setOtp('');
    setMode(next);
  };

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault(); resetMessages(); setPending(true);
    try {
      onAuthenticated(await signInToSira(email, password));
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally { setPending(false); }
  };

  const submitSignup = async (event: React.FormEvent) => {
    event.preventDefault(); resetMessages();
    if (displayName.trim().length < 2) return setError('أدخل اسمك من حرفين على الأقل.');
    if (password.length < 8) return setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
    if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين.');
    setPending(true);
    try {
      const result = await createSiraAccount(displayName, email, password);
      if ('accessToken' in result) return onAuthenticated(result);
      setEmail(result.email);
      setResendIn(45);
      setNotice('أرسلنا رابط تأكيد إلى بريدك الإلكتروني.');
      setMode('signup-email');
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally { setPending(false); }
  };

  const submitOtp = async (type: 'signup' | 'recovery') => {
    resetMessages();
    if (otp.length !== 6) return setError('أدخل رمز التحقق المكوّن من 6 أرقام.');
    setPending(true);
    try {
      const session = await verifySiraOtp(email, otp, type);
      if (type === 'signup') return onAuthenticated(session);
      setRecoverySession(session);
      setPassword(''); setConfirmPassword(''); setMode('new-password');
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally { setPending(false); }
  };

  const resendCode = async () => {
    if (resendIn > 0 || pending) return;
    resetMessages(); setPending(true);
    try {
      const response = mode === 'signup-email'
        ? await resendSiraSignupOtp(email)
        : await requestSiraPasswordRecovery(email);
      setNotice(response.message);
      setResendIn(45);
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally { setPending(false); }
  };

  const submitRecoveryEmail = async (event: React.FormEvent) => {
    event.preventDefault(); resetMessages(); setPending(true);
    try {
      const response = await requestSiraPasswordRecovery(email);
      setNotice(response.message);
      setResendIn(45);
      setMode('recovery-otp');
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally { setPending(false); }
  };

  const submitNewPassword = async (event: React.FormEvent) => {
    event.preventDefault(); resetMessages();
    if (!recoverySession) return setError('انتهت جلسة الاستعادة. اطلب رمزًا جديدًا.');
    if (password.length < 8) return setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
    if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين.');
    setPending(true);
    try {
      await updateSiraPassword(password, recoverySession.accessToken);
      setMode('password-success');
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally { setPending(false); }
  };

  const otpPanel = (type: 'signup' | 'recovery') => (
    <div>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#E5C158]/35 bg-[#E5C158]/10 text-[#E5C158]">
        <Mail className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-center font-serif-ar text-3xl font-bold">{type === 'signup' ? 'تحقق من بريدك الإلكتروني' : 'أدخل رمز الاستعادة'}</h2>
      <p className="mt-2 text-center text-sm leading-7 text-[#A89CB9]">أدخل رمز التحقق الذي أرسلناه إلى<br /><span dir="ltr" className="font-num text-[#E5C158]">{email}</span></p>
      <div className="mt-7"><OtpInput value={otp} onChange={setOtp} disabled={pending} /></div>
      <button type="button" onClick={() => submitOtp(type)} disabled={pending || otp.length !== 6} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#D4AF37] to-[#E5C158] px-5 py-3.5 text-sm font-black text-[#110B29] transition hover:to-[#FFE79A] disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />} تأكيد الرمز
      </button>
      <div className="mt-5 text-center text-xs text-[#8F82A3]">
        {resendIn > 0 ? `يمكنك طلب رمز جديد بعد ${resendIn} ثانية` : (
          <button type="button" onClick={resendCode} disabled={pending} className="inline-flex items-center gap-1.5 font-bold text-[#E5C158] hover:text-[#FFE79A]"><RotateCcw className="h-3.5 w-3.5" /> إعادة إرسال الرمز</button>
        )}
      </div>
      <button type="button" onClick={() => changeMode(type === 'signup' ? 'signup' : 'forgot')} className="mx-auto mt-5 block text-xs text-[#A89CB9] hover:text-white">تغيير البريد الإلكتروني</button>
    </div>
  );

  const signupEmailPanel = (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#E5C158]/35 bg-[#E5C158]/10 text-[#E5C158]">
        <Mail className="h-7 w-7" />
      </div>
      <h2 className="mt-5 font-serif-ar text-3xl font-bold">افتح رسالة تأكيد الحساب</h2>
      <p className="mt-3 text-sm leading-7 text-[#A89CB9]">
        أرسلنا رسالة إلى<br />
        <span dir="ltr" className="font-num text-[#E5C158]">{email}</span>
      </p>
      <div className="mt-6 rounded-2xl border border-[#3C2975] bg-[#0D081F]/75 p-4 text-right text-xs leading-7 text-[#C4B7D8]">
        افتح الرسالة واضغط <strong className="text-white">Confirm email address</strong>، ثم ارجع إلى سيرة وسجّل الدخول بالبريد وكلمة المرور.
      </div>
      <button type="button" onClick={() => changeMode('login')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#D4AF37] to-[#E5C158] px-5 py-3.5 text-sm font-black text-[#110B29] transition hover:to-[#FFE79A]">
        <BadgeCheck className="h-4 w-4" /> تم التأكيد — انتقل لتسجيل الدخول
      </button>
      <div className="mt-5 text-xs text-[#8F82A3]">
        {resendIn > 0 ? `يمكنك إعادة إرسال الرسالة بعد ${resendIn} ثانية` : (
          <button type="button" onClick={resendCode} disabled={pending} className="inline-flex items-center gap-1.5 font-bold text-[#E5C158] hover:text-[#FFE79A] disabled:opacity-50">
            {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} إعادة إرسال رسالة التأكيد
          </button>
        )}
      </div>
      <button type="button" onClick={() => changeMode('signup')} className="mx-auto mt-5 block text-xs text-[#A89CB9] hover:text-white">تغيير البريد الإلكتروني</button>
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-[#0D081F] pb-24 text-[#FAF8F5]">
      <div className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_12%_12%,#6D4BC3,transparent_32%),radial-gradient(circle_at_88%_90%,#D4AF37,transparent_27%)]" />
      <div className="pointer-events-none absolute -right-28 top-20 h-80 w-80 rounded-full border border-[#E5C158]/10" />
      <div className="pointer-events-none absolute -left-16 bottom-8 h-64 w-64 rounded-full border border-[#6D4BC3]/20" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-14">
        <section className="order-2 lg:order-1">
          <button onClick={onBack} className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#3C2975] bg-[#160E36]/70 px-4 text-xs font-bold text-[#D8CDE8] transition hover:border-[#E5C158] hover:text-[#E5C158]">
            <ArrowLeft className="h-4 w-4 rotate-180" /> العودة إلى سيرة
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5C158]/30 bg-[#E5C158]/5 px-4 py-2 text-xs font-bold text-[#E5C158]"><Gamepad2 className="h-4 w-4" /> بوابة ألعاب سيرة</div>
          <h1 className="mt-5 font-serif-ar text-4xl font-bold leading-tight sm:text-6xl">القدس تنتظر<br /><span className="text-[#E5C158]">مستكشفًا جديدًا.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-8 text-[#C4B7D8] sm:text-base">سجّل دخولك لتحفظ نقاطك ونتائج ألعابك، وتتابع رحلتك من أي جهاز. تبقى الخريطة والحكايات وبقية المنصة متاحة للجميع دون تسجيل.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { icon: Trophy, title: 'احفظ تقدمك', text: 'نقاط ونتائج لا تضيع' },
              { icon: Sparkles, title: 'ارتقِ بالمستوى', text: 'تحديات ومكافآت جديدة' },
              { icon: ShieldCheck, title: 'جلسة آمنة', text: 'كلمة المرور لا تصل إلى الواجهة' },
            ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-[#2B1E55] bg-[#160E36]/65 p-4 backdrop-blur"><Icon className="h-5 w-5 text-[#E5C158]" /><strong className="mt-3 block text-sm">{title}</strong><span className="mt-1 block text-[11px] text-[#8F82A3]">{text}</span></div>)}
          </div>
        </section>

        <section className="order-1 rounded-[2rem] border border-[#3C2975] bg-[#110B29]/95 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 lg:order-2">
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="grid grid-cols-2 rounded-xl border border-[#2F2160] bg-[#0D081F] p-1" role="tablist" aria-label="الدخول إلى ألعاب سيرة">
                <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => changeMode('login')} className={`rounded-lg px-4 py-3 text-sm font-bold transition ${mode === 'login' ? 'bg-[#E5C158] text-[#110B29]' : 'text-[#A89CB9] hover:text-white'}`}>تسجيل الدخول</button>
                <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => changeMode('signup')} className={`rounded-lg px-4 py-3 text-sm font-bold transition ${mode === 'signup' ? 'bg-[#E5C158] text-[#110B29]' : 'text-[#A89CB9] hover:text-white'}`}>إنشاء حساب</button>
              </div>
              <div className="mt-7">
                <span className="text-xs font-bold text-[#D4AF37]">{mode === 'login' ? 'واصل رحلتك' : 'ابدأ رحلتك'}</span>
                <h2 className="mt-1 font-serif-ar text-3xl font-bold">{mode === 'login' ? 'أهلًا بعودتك إلى سيرة' : 'أنشئ حساب مستكشف'}</h2>
                <p className="mt-2 text-xs leading-6 text-[#8F82A3]">{mode === 'login' ? 'أدخل بياناتك للوصول إلى الألعاب المحفوظة.' : 'نحتاج الاسم والبريد وكلمة المرور فقط.'}</p>
              </div>
              <form onSubmit={mode === 'login' ? submitLogin : submitSignup} className="mt-6 space-y-4">
                {mode === 'signup' && <label className="block"><span className="mb-2 block text-xs font-bold text-[#D8CDE8]">الاسم</span><div className="relative"><UserRound className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F7296]" /><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" required maxLength={60} className={`${fieldClass} pr-11`} placeholder="اكتب اسمك هنا" /></div></label>}
                <label className="block"><span className="mb-2 block text-xs font-bold text-[#D8CDE8]">البريد الإلكتروني</span><div className="relative"><Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F7296]" /><input dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className={`${fieldClass} pr-11 text-left`} placeholder="name@example.com" /></div></label>
                <label className="block"><span className="mb-2 block text-xs font-bold text-[#D8CDE8]">كلمة المرور</span><div className="relative"><LockKeyhole className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F7296]" /><input dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} className={`${fieldClass} px-11 text-left`} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#8F82A3] hover:bg-white/5 hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
                {mode === 'signup' && <label className="block"><span className="mb-2 block text-xs font-bold text-[#D8CDE8]">تأكيد كلمة المرور</span><input dir="ltr" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} className={`${fieldClass} text-left`} placeholder="••••••••" /></label>}
                {mode === 'login' && <div className="text-left"><button type="button" onClick={() => changeMode('forgot')} className="text-xs font-bold text-[#E5C158] hover:text-[#FFE79A]">نسيت كلمة المرور؟</button></div>}
                <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#D4AF37] to-[#E5C158] px-5 py-3.5 text-sm font-black text-[#110B29] transition hover:to-[#FFE79A] disabled:cursor-not-allowed disabled:opacity-60">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : mode === 'login' ? <KeyRound className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}{mode === 'login' ? 'دخول إلى الألعاب' : 'إنشاء الحساب'}</button>
              </form>
            </>
          )}

          {mode === 'signup-email' && signupEmailPanel}
          {mode === 'recovery-otp' && otpPanel('recovery')}

          {mode === 'forgot' && <div><button type="button" onClick={() => changeMode('login')} className="inline-flex items-center gap-2 text-xs font-bold text-[#E5C158]"><ArrowLeft className="h-4 w-4" /> العودة لتسجيل الدخول</button><div className="mx-auto mt-5 grid h-16 w-16 place-items-center rounded-2xl border border-[#E5C158]/35 bg-[#E5C158]/10 text-[#E5C158]"><KeyRound className="h-7 w-7" /></div><h2 className="mt-5 text-center font-serif-ar text-3xl font-bold">استعادة كلمة المرور</h2><p className="mt-2 text-center text-sm leading-7 text-[#A89CB9]">أدخل البريد المرتبط بحسابك وسنرسل لك رمز تحقق.</p><form onSubmit={submitRecoveryEmail} className="mt-7 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-[#D8CDE8]">البريد الإلكتروني</span><input dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className={`${fieldClass} text-left`} placeholder="name@example.com" /></label><button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E5C158] px-5 py-3.5 text-sm font-black text-[#110B29] disabled:opacity-60">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} إرسال رمز التحقق</button></form></div>}

          {mode === 'new-password' && <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#E5C158]/35 bg-[#E5C158]/10 text-[#E5C158]"><LockKeyhole className="h-7 w-7" /></div><h2 className="mt-5 text-center font-serif-ar text-3xl font-bold">إنشاء كلمة مرور جديدة</h2><p className="mt-2 text-center text-sm text-[#A89CB9]">اختر كلمة مرور قوية من 8 أحرف على الأقل.</p><form onSubmit={submitNewPassword} className="mt-7 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold">كلمة المرور الجديدة</span><input dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} className={`${fieldClass} text-left`} /></label><label className="block"><span className="mb-2 block text-xs font-bold">تأكيد كلمة المرور</span><input dir="ltr" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} className={`${fieldClass} text-left`} /></label><label className="flex items-center gap-2 text-xs text-[#A89CB9]"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> إظهار كلمة المرور</label><button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E5C158] px-5 py-3.5 text-sm font-black text-[#110B29] disabled:opacity-60">{pending && <LoaderCircle className="h-4 w-4 animate-spin" />} حفظ كلمة المرور</button></form></div>}

          {mode === 'password-success' && <div className="py-6 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#22C55E]/10 text-[#4ADE80]"><BadgeCheck className="h-10 w-10" /></div><h2 className="mt-5 font-serif-ar text-3xl font-bold">تم تغيير كلمة المرور بنجاح</h2><p className="mt-3 text-sm text-[#A89CB9]">يمكنك الآن متابعة رحلتك في ألعاب سيرة.</p><button onClick={() => recoverySession && onAuthenticated(recoverySession)} className="mt-7 w-full rounded-xl bg-[#E5C158] px-5 py-3.5 text-sm font-black text-[#110B29]">الدخول إلى الألعاب</button></div>}

          {error && <div role="alert" className="mt-5 rounded-xl border border-[#EF4444]/35 bg-[#EF4444]/10 px-4 py-3 text-xs leading-6 text-[#FCA5A5]">{error}</div>}
          {notice && <div role="status" className="mt-5 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-xs leading-6 text-[#86EFAC]">{notice}</div>}
          <p className="mt-6 flex items-start gap-2 border-t border-[#2B1E55] pt-5 text-[10px] leading-5 text-[#756987]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E5C158]" /> تستخدم سيرة Supabase لإدارة الحساب والجلسة. لا تُخزن كلمة المرور أو رمز التحقق داخل واجهة الموقع.</p>
        </section>
      </div>
    </div>
  );
};
