import { Capacitor } from '@capacitor/core';

// Native builds are bundled inside a WebView, whose origin is localhost rather
// than the deployed website. Keep browser requests relative, but direct the
// Android shell to the production API supplied at build time.
const configuredApiBase = String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const apiUrl = (path: string) => {
  if (!path.startsWith('/')) throw new Error('API paths must start with /.');
  return Capacitor.isNativePlatform() && configuredApiBase ? `${configuredApiBase}${path}` : path;
};

export const isNativeApp = () => Capacitor.isNativePlatform();
