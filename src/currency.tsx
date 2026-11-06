import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { MessageKey } from './i18n/messages';
import { useI18n } from './i18n/index';
import {
  CURRENCY_CODES,
  convertCurrency,
  formatCurrencyAmount,
  isCurrencyCode,
  type CurrencyCode,
} from './currency-core';

export * from './currency-core';

const STORAGE_KEY = 'yukchi.mobile.currency';

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function webStorage(): WebStorage | null {
  try {
    return (globalThis as unknown as { localStorage?: WebStorage }).localStorage ?? null;
  } catch {
    return null;
  }
}

async function readStoredCurrency(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return webStorage()?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }
  try {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writeStoredCurrency(value: CurrencyCode): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      webStorage()?.setItem(STORAGE_KEY, value);
    } catch {
      // Storage can be unavailable; the choice stays in memory.
    }
    return;
  }
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(STORAGE_KEY, value);
  } catch {
    // Keep the in-memory choice if secure storage is unavailable.
  }
}

type CurrencyValue = {
  currency: CurrencyCode;
  setCurrency: (next: CurrencyCode) => void;
  options: { value: CurrencyCode; label: string }[];
  convert: (amount: number, from?: CurrencyCode) => number;
  formatPrice: (amount: number, from?: CurrencyCode) => string;
};

const CurrencyContext = createContext<CurrencyValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { t, locale } = useI18n();
  const [currency, setCurrencyState] = useState<CurrencyCode>('UZS');

  useEffect(() => {
    let alive = true;
    void readStoredCurrency().then((stored) => {
      if (alive && isCurrencyCode(stored)) setCurrencyState(stored);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    void writeStoredCurrency(next);
  }, []);

  const options = useMemo(
    () =>
      CURRENCY_CODES.map((code) => ({
        value: code,
        label: t(`currency.${code.toLowerCase()}` as MessageKey),
      })),
    [t],
  );

  const convert = useCallback(
    (amount: number, from: CurrencyCode = 'UZS') => convertCurrency(amount, from, currency),
    [currency],
  );

  const formatPrice = useCallback(
    (amount: number, from: CurrencyCode = 'UZS') =>
      formatCurrencyAmount(convertCurrency(amount, from, currency), currency, locale),
    [currency, locale],
  );

  const value = useMemo<CurrencyValue>(
    () => ({ currency, setCurrency, options, convert, formatPrice }),
    [currency, setCurrency, options, convert, formatPrice],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyValue {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error('useCurrency must be used within CurrencyProvider');
  return value;
}
