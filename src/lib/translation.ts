export const PLATFORM_LANGUAGES = [
  { code: 'ar', label: 'العربية', direction: 'rtl' },
  { code: 'en', label: 'English', direction: 'ltr' },
  { code: 'pt', label: 'Português', direction: 'ltr' },
  { code: 'tr', label: 'Türkçe', direction: 'ltr' },
  { code: 'ru', label: 'Русский', direction: 'ltr' },
  { code: 'fr', label: 'Français', direction: 'ltr' },
  { code: 'zh-CN', label: '中文', direction: 'ltr' },
  { code: 'ja', label: '日本語', direction: 'ltr' },
  { code: 'ko', label: '한국어', direction: 'ltr' },
] as const;

export type PlatformLanguage = typeof PLATFORM_LANGUAGES[number]['code'];

const languageCodes = new Set<PlatformLanguage>(PLATFORM_LANGUAGES.map((language) => language.code));
const PREFERENCE_COOKIE = 'sira_language';

export function isPlatformLanguage(value: string): value is PlatformLanguage {
  return languageCodes.has(value as PlatformLanguage);
}

export function getTranslationCookie(): PlatformLanguage | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith('googtrans='))?.slice('googtrans='.length);
  const targetLanguage = value?.match(/^\/ar\/([^/]+)$/)?.[1] || '';
  return isPlatformLanguage(targetLanguage) ? targetLanguage : null;
}

function getSavedLanguagePreference(): PlatformLanguage | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${PREFERENCE_COOKIE}=`))?.slice(PREFERENCE_COOKIE.length + 1) || '';
  return isPlatformLanguage(value) ? value : null;
}

export function detectDeviceLanguage(): PlatformLanguage {
  if (typeof navigator === 'undefined') return 'ar';
  const deviceLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const deviceLanguage of deviceLanguages) {
    const normalized = deviceLanguage.toLowerCase();
    if (normalized.startsWith('zh')) return 'zh-CN';
    const code = normalized.split('-')[0];
    if (isPlatformLanguage(code)) return code;
  }
  return 'ar';
}

export function getInitialPlatformLanguage(): PlatformLanguage {
  return getSavedLanguagePreference() || detectDeviceLanguage();
}

export function getLanguageDirection(language: PlatformLanguage) {
  return PLATFORM_LANGUAGES.find((item) => item.code === language)?.direction || 'ltr';
}

export function setTranslationCookie(language: PlatformLanguage, remember = true) {
  const value = language === 'ar' ? '' : `googtrans=/ar/${language}`;
  const expiry = language === 'ar' ? 'max-age=0' : 'max-age=31536000';
  document.cookie = `${value}; path=/; ${expiry}; SameSite=Lax`;
  if (remember) document.cookie = `${PREFERENCE_COOKIE}=${language}; path=/; max-age=31536000; SameSite=Lax`;
}
