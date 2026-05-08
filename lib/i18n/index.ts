import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { en } from './translations/en';
import { es } from './translations/es';

export const i18n = new I18n({ es, en });

i18n.enableFallback = true;
i18n.defaultLocale = 'es';

const deviceLocale = getLocales()[0]?.languageCode ?? 'es';
i18n.locale = deviceLocale.startsWith('en') ? 'en' : 'es';

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

export function setLocale(locale: 'es' | 'en') {
  i18n.locale = locale;
}
