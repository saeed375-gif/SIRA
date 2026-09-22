import React, { useEffect, useState } from 'react';
import { Compass, Map, Navigation, Info, Search, Sparkles, Gamepad2, Languages, LoaderCircle, Sun, Moon } from 'lucide-react';
import { UserDiscoveryProgress } from '../types';
import { SiraLogo } from './SiraLogo';
import { PLATFORM_LANGUAGES, getTranslationCookie, setTranslationCookie, type PlatformLanguage } from '../lib/translation';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  progress: UserDiscoveryProgress;
  totalPlacesCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  language: PlatformLanguage;
  onLanguageChange: (language: PlatformLanguage) => void;
}

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (options: Record<string, unknown>, elementId: string) => unknown;
      };
    };
    siraGoogleTranslateElementInit?: () => void;
  }
}

const TRANSLATE_ELEMENT_ID = 'sira-google-translate-element';
const TRANSLATE_SCRIPT_ID = 'sira-google-translate-script';
let googleTranslateReady: Promise<void> | null = null;
let googleTranslateInitialised = false;

const loadGoogleTranslate = () => {
  if (googleTranslateReady) return googleTranslateReady;

  googleTranslateReady = new Promise((resolve, reject) => {
    const initialise = () => {
      if (!googleTranslateInitialised && window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'ar', includedLanguages: PLATFORM_LANGUAGES.map((language) => language.code).join(','), autoDisplay: false },
          TRANSLATE_ELEMENT_ID,
        );
        googleTranslateInitialised = true;
      }
      resolve();
    };

    window.siraGoogleTranslateElementInit = initialise;
    const existingScript = document.getElementById(TRANSLATE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = TRANSLATE_SCRIPT_ID;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=siraGoogleTranslateElementInit';
    script.async = true;
    script.onerror = () => reject(new Error('Unable to load translation service'));
    document.head.appendChild(script);
  });

  return googleTranslateReady;
};

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  progress,
  totalPlacesCount,
  theme,
  onToggleTheme,
  language,
  onLanguageChange,
}) => {
  const [translationLoading, setTranslationLoading] = useState(false);

  const navItems = [
    { path: '/', label: 'الرئيسية', icon: Compass },
    { path: '/explore', label: 'استكشف الخريطة', icon: Map },
    { path: '/routes', label: 'المسارات', icon: Navigation },
    { path: '/games', label: 'الألعاب التفاعلية', icon: Gamepad2 },
    { path: '/search', label: 'بحث', icon: Search },
    { path: '/about', label: 'عن سيرة', icon: Info },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
  };

  useEffect(() => {
    // Set the device-language cookie before loading Google Translate. This
    // applies automatic translation without unexpectedly refreshing the page.
    const translatedLanguage = getTranslationCookie();
    if (translatedLanguage !== language) {
      setTranslationCookie(language, false);
    }
    if (language === 'ar') return;
    void loadGoogleTranslate().catch(() => setTranslationLoading(false));
  }, [language]);

  const changeLanguage = (nextLanguage: PlatformLanguage) => {
    if (nextLanguage === language && getTranslationCookie()) return;
    setTranslationLoading(true);
    setTranslationCookie(nextLanguage);
    onLanguageChange(nextLanguage);
    // The widget reads this cookie while the page starts. Reloading before it
    // mutates content keeps React's DOM tree stable and avoids the proxy warning.
    window.location.reload();
  };

  const discoveredCount = progress.discoveredPlaceIds.length;
  const progressPercent = Math.round((discoveredCount / totalPlacesCount) * 100) || 0;

  return (
    <header className="sira-site-header sticky top-0 z-40 w-full bg-[#110B29]/95 backdrop-blur-xl border-b border-[#261A4E] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand logo */}
        <button
          onClick={() => handleNavClick('/')}
          aria-label="سيرة — الصفحة الرئيسية"
          className="flex shrink-0 items-center text-right group focus-visible:outline-2 focus-visible:outline-[#E5C158] focus-visible:outline-offset-4 rounded-xl"
        >
          <SiraLogo className="h-16 w-16 opacity-95 transition-opacity group-hover:opacity-100" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#160E36]/80 p-1.5 rounded-2xl border border-[#2B1E55]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#110B29] shadow-md shadow-[#D4AF37]/20'
                    : 'text-[#C4B7D8] hover:text-[#FAF8F5] hover:bg-[#251854]/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#110B29]' : 'text-[#E5C158]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Google Translate runs inside the page, avoiding the form warning shown by its proxy URL. */}
        <label className="notranslate hidden md:inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#3C2975] bg-[#160E36] px-3 py-2 text-xs font-bold text-[#E5C158] transition-all hover:border-[#D4AF37] hover:bg-[#251854] focus-within:outline-2 focus-within:outline-[#E5C158] focus-within:outline-offset-4">
          {translationLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
          <span className="sr-only">لغة المنصة</span>
          <select value={language} onChange={(event) => changeLanguage(event.target.value as PlatformLanguage)} disabled={translationLoading} aria-label="لغة المنصة" className="max-w-28 cursor-pointer appearance-none bg-transparent text-xs font-bold text-[#E5C158] outline-none disabled:cursor-wait">
            {PLATFORM_LANGUAGES.map((item) => <option key={item.code} value={item.code} className="bg-[#160E36] text-[#FAF8F5]">{item.label}</option>)}
          </select>
        </label>

        <button
          type="button"
          id="sira-theme-toggle"
          onClick={onToggleTheme}
          aria-pressed={theme === 'light'}
          title={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          className="hidden md:inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#3C2975] bg-[#160E36] px-3 py-2 text-xs font-bold text-[#E5C158] transition-all hover:border-[#D4AF37] hover:bg-[#251854] focus-visible:outline-2 focus-visible:outline-[#E5C158] focus-visible:outline-offset-4"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === 'dark' ? 'فاتح' : 'داكن'}</span>
        </button>

        {/* Right side: Discovery Progress Badge & Actions */}
        <div className="hidden xl:flex items-center gap-3">
          {/* Discovery Progress Pill */}
          <div
            onClick={() => handleNavClick('/explore')}
            className="cursor-pointer group flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#160E36] border border-[#3C2975] hover:border-[#D4AF37]/50 transition-all"
            title="معدل استكشافك لمعالم القدس"
          >
            <div className="flex items-center gap-1 text-[#E5C158]">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              <span className="text-xs font-bold font-num">
                {discoveredCount} / {totalPlacesCount}
              </span>
            </div>

            {/* Visual Mini Progress Dots */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPlacesCount }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx < discoveredCount ? 'bg-[#E5C158]' : 'bg-[#3C2975]'
                  }`}
                />
              ))}
            </div>

            <span className="text-[11px] font-bold text-[#C4B7D8] border-r border-[#2F2160] pr-2 mr-0.5">
              {progress.totalPoints} نقطة
            </span>
          </div>

          {/* Direct CTA */}
          <button
            onClick={() => handleNavClick('/routes/journey-in-heart-of-jerusalem')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] text-xs font-bold shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>ابدأ رحلتك</span>
          </button>
        </div>

        {/* Mobile navigation already lives in the persistent bottom bar. Keep
            the header dedicated to the two global controls instead. */}
        <div className="notranslate md:hidden flex shrink-0 items-center gap-2" dir="ltr">
          <label className="relative grid h-11 w-11 place-items-center rounded-xl border border-[#2B1E55] bg-[#160E36] text-[#E5C158] transition-all hover:border-[#D4AF37] hover:bg-[#251854] focus-within:outline-2 focus-within:outline-[#E5C158] focus-within:outline-offset-4">
            {translationLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Languages className="h-5 w-5" />}
            <span className="sr-only">لغة المنصة</span>
            <select value={language} onChange={(event) => changeLanguage(event.target.value as PlatformLanguage)} disabled={translationLoading} aria-label="لغة المنصة" className="absolute h-11 w-11 cursor-pointer appearance-none bg-transparent text-transparent outline-none disabled:cursor-wait">
              {PLATFORM_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
          <button
            type="button"
            id="sira-theme-toggle-mobile"
            onClick={onToggleTheme}
            aria-pressed={theme === 'light'}
            title={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#2B1E55] bg-[#160E36] text-[#E5C158] transition-all hover:border-[#D4AF37] hover:bg-[#251854] focus-visible:outline-2 focus-visible:outline-[#E5C158] focus-visible:outline-offset-4"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div id={TRANSLATE_ELEMENT_ID} className="absolute h-px w-px overflow-hidden opacity-0" aria-hidden="true" />
    </header>
  );
};
