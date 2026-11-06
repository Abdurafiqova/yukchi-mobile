import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { AuthResult, AuthUser, VehicleApi } from './api';
import { ApiError, createVehicle, listVehicles, logout } from './api';
import type { UserRole, VehicleStatus, VehicleType } from './types';

const SESSION_KEY = 'yukchi.mobile.session';
const VEHICLE_KEY = 'yukchi.mobile.vehicle';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type DriverVehicle = {
  id?: string;
  type: VehicleType;
  plate: string;
  weight: number;
  status?: VehicleStatus;
};

export type NewVehicle = {
  type: VehicleType;
  plate: string;
  weight: number;
};

function toDriverVehicle(vehicle: VehicleApi): DriverVehicle {
  return {
    id: vehicle.id,
    type: vehicle.vehicleType,
    plate: vehicle.plateNumber,
    weight: Math.round(vehicle.capacityKg / 100) / 10,
    status: vehicle.status,
  };
}

async function pickVehicle(token: string): Promise<DriverVehicle | null> {
  const result = await listVehicles(token);
  const found = result.items.find((item) => item.status === 'ACTIVE') ?? result.items[0] ?? null;
  return found ? toDriverVehicle(found) : null;
}

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function getWebStorage(): StorageLike | null {
  try {
    return (globalThis as unknown as { localStorage?: StorageLike }).localStorage ?? null;
  } catch {
    return null;
  }
}

async function readKey(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return getWebStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  try {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeKey(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const storage = getWebStorage();
      if (!storage) return;
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    } catch {
      // Storage can be unavailable in private browsing; the session stays in memory.
    }
    return;
  }
  try {
    const SecureStore = await import('expo-secure-store');
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Keep the session in memory if secure storage is unavailable.
  }
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type AuthValue = {
  ready: boolean;
  session: AuthSession | null;
  vehicle: DriverVehicle | null;
  signIn: (result: AuthResult) => Promise<void>;
  saveVehicle: (vehicle: NewVehicle) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [sessionRaw, vehicleRaw] = await Promise.all([readKey(SESSION_KEY), readKey(VEHICLE_KEY)]);
      const stored = parseJson<AuthSession>(sessionRaw);
      const cached = parseJson<DriverVehicle>(vehicleRaw);

      let restoredSession: AuthSession | null = null;
      let restoredVehicle: DriverVehicle | null =
        cached?.type && cached.plate ? cached : null;

      if (stored?.accessToken && stored.user?.id) {
        restoredSession = {
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          user: { ...stored.user, role: stored.user.role as UserRole },
        };

        try {
          restoredVehicle = await pickVehicle(stored.accessToken);
          await writeKey(
            VEHICLE_KEY,
            restoredVehicle ? JSON.stringify(restoredVehicle) : null,
          );
        } catch {
          // The API may be unreachable on launch; keep the cached vehicle for offline display.
        }
      }

      if (!alive) return;
      setSession(restoredSession);
      setVehicle(restoredVehicle);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (result: AuthResult) => {
    const next: AuthSession = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
    setSession(next);
    setVehicle(null);
    await Promise.all([writeKey(SESSION_KEY, JSON.stringify(next)), writeKey(VEHICLE_KEY, null)]);

    try {
      const found = await pickVehicle(result.accessToken);
      setVehicle(found);
      await writeKey(VEHICLE_KEY, found ? JSON.stringify(found) : null);
    } catch {
      // A new driver still continues to the vehicle step; the list retries on next launch.
    }
  }, []);

  const saveVehicle = useCallback(
    async (input: NewVehicle) => {
      if (!session) {
        throw new ApiError(401, 'no session');
      }

      const created = await createVehicle(session.accessToken, {
        plateNumber: input.plate,
        vehicleType: input.type,
        capacityKg: Math.max(1, Math.round(input.weight * 1000)),
      });
      const next = toDriverVehicle(created);

      setVehicle(next);
      await writeKey(VEHICLE_KEY, JSON.stringify(next));
    },
    [session],
  );

  const signOut = useCallback(async () => {
    const current = session;
    setSession(null);
    setVehicle(null);
    await Promise.all([writeKey(SESSION_KEY, null), writeKey(VEHICLE_KEY, null)]);
    if (current?.refreshToken) {
      void logout(current.refreshToken).catch(() => {
        // The local session is already cleared; a stale refresh token expires on its own.
      });
    }
  }, [session]);

  const value = useMemo<AuthValue>(
    () => ({ ready, session, vehicle, signIn, saveVehicle, signOut }),
    [ready, session, vehicle, signIn, saveVehicle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? '').trim().split(/\s+/)[0] || '';
}

export function initialsOf(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Y';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
