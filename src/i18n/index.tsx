import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  LOCALES,
  messages,
  type Locale,
  type MessageKey,
  type TFn,
} from './messages';

export { LOCALES, LOCALE_CODES, LOCALE_LABELS } from './messages';
export type { Locale, MessageKey, TFn } from './messages';

const STORAGE_KEY = 'yukchi.mobile.locale';

type WebStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function getWebStorage(): WebStorageLike | null {
  try {
    const g = globalThis as unknown as { localStorage?: WebStorageLike };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as string[]).includes(value);
}

function fromTag(tag: string | undefined | null): Locale {
  const lower = (tag || '').toLowerCase();
  if (lower.startsWith('uz')) return 'uz';
  if (lower.startsWith('ru')) return 'ru';
  if (lower.startsWith('en')) return 'en';
  return 'uz';
}

function detectLocale(): Locale {
  const storage = Platform.OS === 'web' ? getWebStorage() : null;
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_KEY);
      if (isLocale(saved)) return saved;
    } catch {
      // Storage may be unavailable in private browsing; fall back to detection.
    }
  }
  try {
    const g = globalThis as unknown as { navigator?: { language?: string } };
    const navLanguage = g.navigator?.language;
    if (navLanguage) return fromTag(navLanguage);
  } catch {
    // Ignore and fall back to Intl below.
  }
  try {
    return fromTag(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'uz';
  }
}

const MONTHS: Record<Locale, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  ru: ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const CITY_KEYS: Record<string, MessageKey> = {
  tashkent: 'city.tashkent',
  toshkent: 'city.tashkent',
  samarkand: 'city.samarkand',
  samarqand: 'city.samarkand',
  bukhara: 'city.bukhara',
  buxoro: 'city.bukhara',
  fergana: 'city.fergana',
  "farg'ona": 'city.fergana',
  fargona: 'city.fergana',
  jizzakh: 'city.jizzakh',
  jizzax: 'city.jizzakh',
  nukus: 'city.nukus',
};

const VEHICLE_KEYS: Record<string, MessageKey> = {
  tent: 'vehicle.tent',
  awning: 'vehicle.tent',
  flatbed: 'vehicle.flatbed',
  refrigerated: 'vehicle.refrigerated',
  tipper: 'vehicle.tipper',
  tanker: 'vehicle.tanker',
  van: 'vehicle.van',
  isothermal: 'vehicle.isothermal',
  container: 'vehicle.container',
  carrier: 'vehicle.carrier',
  car_carrier: 'vehicle.carrier',
  'car carrier': 'vehicle.carrier',
  crane: 'vehicle.crane',
};

const STATUS_KEYS: Record<string, MessageKey> = {
  published: 'status.published',
  'pending review': 'status.pending',
  pending: 'status.pending',
  active: 'status.active',
  blocked: 'status.blocked',
  confirmed: 'status.confirmed',
  delivered: 'status.delivered',
};

const TIME_KEYS: Record<string, MessageKey> = {
  yesterday: 'time.yesterday',
  today: 'time.today',
  tue: 'time.tue',
};

export type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFn;
  money: (value: number) => string;
  loads: (n: number) => string;
  formatDate: (iso: string) => string;
  cityLabel: (name: string) => string;
  vehicleLabel: (name: string) => string;
  paymentLabel: (method: string) => string;
  statusLabel: (status: string) => string;
  distanceLabel: (value: string) => string;
  timeLabel: (value: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    const storage = Platform.OS === 'web' ? getWebStorage() : null;
    if (storage) {
      try {
        storage.setItem(STORAGE_KEY, next);
      } catch {
        // Persisting the locale is best-effort.
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const doc = (globalThis as unknown as { document?: { documentElement?: { lang?: string } } }).document;
      if (doc?.documentElement) doc.documentElement.lang = locale;
    } catch {
      // The document is unavailable outside the web runtime.
    }
  }, [locale]);

  const value = useMemo<I18nValue>(() => {
    const dict = messages[locale];

    const t: TFn = (key, params) => {
      let text = dict[key] ?? messages.en[key] ?? key;
      if (params) {
        for (const [name, raw] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(raw));
        }
      }
      return text;
    };

    const money = (amount: number) => {
      const grouped = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'en' ? ',' : ' ');
      return grouped;
    };

    const loads = (n: number) => {
      let key: MessageKey = 'count.loads.many';
      if (locale === 'ru') {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) key = 'count.loads.one';
        else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) key = 'count.loads.few';
      } else if (locale === 'en') {
        key = n === 1 ? 'count.loads.one' : 'count.loads.many';
      } else {
        key = 'count.loads.one';
      }
      return t(key, { n });
    };

    const formatDate = (iso: string) => {
      const date = new Date(`${iso}T00:00:00`);
      if (Number.isNaN(date.getTime())) return iso;
      const day = date.getDate();
      const month = MONTHS[locale][date.getMonth()];
      const year = date.getFullYear();
      if (locale === 'en') return `${month} ${day}, ${year}`;
      return `${day} ${month} ${year}`;
    };

    const cityLabel = (name: string) => {
      const key = CITY_KEYS[(name || '').trim().toLowerCase()];
      return key ? t(key) : name;
    };

    const vehicleLabel = (name: string) => {
      const key = VEHICLE_KEYS[(name || '').trim().toLowerCase()];
      return key ? t(key) : name;
    };

    const paymentLabel = (method: string) => {
      const key = `payment.${(method || 'cash').trim().toLowerCase()}` as MessageKey;
      return dict[key] ?? method;
    };

    const statusLabel = (status: string) => {
      const key = STATUS_KEYS[(status || '').trim().toLowerCase()];
      return key ? t(key) : status;
    };

    const distanceLabel = (value: string) => {
      const raw = (value || '').trim();
      if (/^just now$/i.test(raw)) return t('time.justNow');
      const match = raw.match(/^(\d+)\s*km(\s*away)?$/i);
      if (match) return t('distance.km', { n: match[1] });
      return value;
    };

    const timeLabel = (value: string) => {
      const key = TIME_KEYS[(value || '').trim().toLowerCase()];
      return key ? t(key) : value;
    };

    return {
      locale,
      setLocale,
      t,
      money,
      loads,
      formatDate,
      cityLabel,
      vehicleLabel,
      paymentLabel,
      statusLabel,
      distanceLabel,
      timeLabel,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
