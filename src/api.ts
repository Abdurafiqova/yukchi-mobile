import { Platform } from 'react-native';
import type {
  DocumentStatus,
  UserRole,
  VehicleDocumentType,
  VehicleStatus,
  VehicleType,
} from './types';

const webHost =
  Platform.OS === 'web'
    ? (globalThis as unknown as { location?: { hostname?: string } }).location?.hostname ?? 'localhost'
    : 'localhost';

export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? `http://${webHost}:4000/api/v1`
).replace(/\/+$/, '');

export type AuthUser = {
  id: string;
  phone: string;
  fullName: string | null;
  role: UserRole;
  rating?: number;
  ratingCount?: number;
  stats?: { cargoCount: number; offersCount: number };
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

export type OtpRequestResult = {
  ok: boolean;
  phone: string;
  expiresIn: number;
  devCode?: string;
};

export class ApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'network');
  }

  const data = (await res.json().catch(() => null)) as
    | (Record<string, unknown> & { message?: unknown; retryAfter?: unknown })
    | null;

  if (!res.ok) {
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw.join(' ') : typeof raw === 'string' ? raw : 'request failed';
    const retryAfter = typeof data?.retryAfter === 'number' ? data.retryAfter : undefined;
    throw new ApiError(res.status, message, retryAfter);
  }

  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body });
}

export type VehicleApi = {
  id: string;
  plateNumber: string;
  vehicleType: VehicleType;
  vehicleLabel: string;
  capacityKg: number;
  bodyVolumeM3: number | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
};

export type VehicleListResult = {
  items: VehicleApi[];
  total: number;
};

export type CreateVehicleInput = {
  plateNumber: string;
  vehicleType: VehicleType;
  capacityKg: number;
  bodyVolumeM3?: number;
};

export function listVehicles(token: string): Promise<VehicleListResult> {
  return request<VehicleListResult>('/vehicles', { token });
}

export function createVehicle(token: string, input: CreateVehicleInput): Promise<VehicleApi> {
  return request<VehicleApi>('/vehicles', { method: 'POST', token, body: input });
}

export type VehicleDocumentApi = {
  id: string;
  vehicleId: string;
  type: VehicleDocumentType;
  typeLabel: string;
  status: DocumentStatus;
  originalName: string;
  fileMime: string;
  fileSize: number;
  note: string | null;
  fileUrl: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleDocumentsResult = {
  items: VehicleDocumentApi[];
  required: VehicleDocumentType[];
  complete: boolean;
  vehicleStatus: VehicleStatus;
};

export function listVehicleDocuments(
  token: string,
  vehicleId: string,
): Promise<VehicleDocumentsResult> {
  return request<VehicleDocumentsResult>(`/vehicles/${vehicleId}/documents`, { token });
}

export function uploadVehicleDocument(
  token: string,
  vehicleId: string,
  form: FormData,
): Promise<VehicleDocumentApi> {
  return request<VehicleDocumentApi>(`/vehicles/${vehicleId}/documents`, {
    method: 'POST',
    token,
    body: form,
  });
}

export function deleteVehicleDocument(
  token: string,
  vehicleId: string,
  documentId: string,
): Promise<{ ok: boolean; id: string }> {
  return request<{ ok: boolean; id: string }>(
    `/vehicles/${vehicleId}/documents/${documentId}`,
    { method: 'DELETE', token },
  );
}

export type CargoApiImage = {
  id: string;
  url: string;
  alt: string | null;
};

export type CargoApi = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  cargoType: string | null;
  weightKg: number;
  volumeM3: number | null;
  vehicleType: VehicleType;
  vehicleLabel: string;
  price: number;
  currency: string;
  priceNegotiable: boolean;
  paymentMethod: 'CASH' | 'TRANSFER' | 'MIXED';
  advanceAmount: number | null;
  trucksNeeded: number;
  isAdditionalLoad: boolean;
  readyToLoad: boolean;
  status: string;
  pickup: { city: string; address: string | null; lat: number | null; lng: number | null };
  dropoff: { city: string; address: string | null; lat: number | null; lng: number | null };
  pickupDate: string;
  publishedAt: string | null;
  expiresAt: string | null;
  viewCount: number;
  offerCount: number;
  images: CargoApiImage[];
  owner: {
    id: string;
    name: string;
    companyName: string | null;
    rating: number;
    ratingCount: number;
    phone?: string;
  };
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
};

export type CargoListParams = {
  page?: number;
  limit?: number;
  q?: string;
  from?: string;
  to?: string;
  vehicleType?: VehicleType;
  minWeightKg?: number;
  maxPrice?: number;
  sort?: 'new' | 'price_asc' | 'price_desc' | 'weight_desc' | 'distance';
  nearLat?: number;
  nearLng?: number;
  radiusKm?: number;
};

export type CargoListResult = {
  items: CargoApi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
};

export function listCargos(params: CargoListParams = {}): Promise<CargoListResult> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return request<CargoListResult>(`/cargos${qs ? `?${qs}` : ''}`);
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type OfferApi = {
  id: string;
  cargoId: string;
  cargo: {
    id: string;
    code: string;
    title: string;
    pickupCity: string;
    dropoffCity: string;
    pickupDate: string;
    price: number;
    status: string;
  };
  driver: {
    id: string;
    name: string;
    rating: number;
    ratingCount: number;
    phone?: string;
  };
  vehicle: {
    id: string;
    plateNumber: string;
    vehicleType: VehicleType;
    vehicleLabel: string;
  } | null;
  price: number;
  message: string | null;
  status: OfferStatus;
  createdAt: string;
  respondedAt: string | null;
};

export type CreateOfferInput = {
  price: number;
  message?: string;
  vehicleId?: string;
};

export function createOffer(
  token: string,
  cargoId: string,
  input: CreateOfferInput,
): Promise<OfferApi> {
  return request<OfferApi>(`/cargos/${cargoId}/offers`, { method: 'POST', token, body: input });
}

export function listMyOffers(
  token: string,
  cargoId: string,
): Promise<{ items: OfferApi[]; total: number }> {
  return request<{ items: OfferApi[]; total: number }>(`/cargos/${cargoId}/offers/mine`, { token });
}

export function withdrawOffer(token: string, offerId: string): Promise<OfferApi> {
  return request<OfferApi>(`/offers/${offerId}/withdraw`, { method: 'POST', token });
}

export type ChatCounterpart = {
  id: string;
  name: string;
  phone: string;
  companyName: string | null;
  rating: number;
  ratingCount: number;
  role: UserRole;
};

export type ChatCargoSummary = {
  id: string;
  code: string;
  title: string;
  from: string;
  to: string;
  status: string;
};

export type ChatMessageApi = {
  id: string;
  conversationId: string;
  senderId: string;
  kind: 'TEXT' | 'PHOTO' | 'LOCATION';
  text: string | null;
  readAt: string | null;
  createdAt: string;
  mine: boolean;
};

export type ChatSummary = {
  id: string;
  cargo: ChatCargoSummary;
  counterpart: ChatCounterpart;
  lastMessage: ChatMessageApi | null;
  unreadCount: number;
  updatedAt: string;
};

export type ChatListResult = {
  items: ChatSummary[];
  total: number;
  unreadCount: number;
};

export type ChatMessagesResult = {
  conversation: {
    id: string;
    cargoId: string;
    counterpart: ChatCounterpart;
  };
  items: ChatMessageApi[];
  hasMore: boolean;
};

export function listChats(token: string): Promise<ChatListResult> {
  return request<ChatListResult>('/chats', { token });
}

export function getChatByCargo(token: string, cargoId: string): Promise<ChatSummary> {
  return request<ChatSummary>(`/chats/by-cargo/${cargoId}`, { token });
}

export function listChatMessages(
  token: string,
  chatId: string,
  params: { limit?: number; before?: string } = {},
): Promise<ChatMessagesResult> {
  const search = new URLSearchParams();
  if (params.limit) search.set('limit', String(params.limit));
  if (params.before) search.set('before', params.before);
  const qs = search.toString();
  return request<ChatMessagesResult>(`/chats/${chatId}/messages${qs ? `?${qs}` : ''}`, { token });
}

export function sendChatMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<ChatMessageApi> {
  return request<ChatMessageApi>(`/chats/${chatId}/messages`, {
    method: 'POST',
    token,
    body: { text },
  });
}

export function markChatRead(token: string, chatId: string): Promise<{ updated: number }> {
  return request<{ updated: number }>(`/chats/${chatId}/read`, { method: 'POST', token });
}

export type NotificationApi = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export function listNotifications(
  token: string,
  page = 1,
  limit = 20,
): Promise<{
  items: NotificationApi[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}> {
  return request(`/notifications?page=${page}&limit=${limit}`, { token });
}

export function markNotificationsRead(token: string): Promise<{ updated: number }> {
  return request<{ updated: number }>('/notifications/read-all', { method: 'POST', token });
}

export function normalizeUzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  if (local.length !== 9) return null;
  return `+998${local}`;
}

export function requestOtp(phone: string): Promise<OtpRequestResult> {
  return post<OtpRequestResult>('/auth/request-otp', { phone });
}

export function verifyOtp(phone: string, code: string, fullName: string): Promise<AuthResult> {
  return post<AuthResult>('/auth/verify-otp', {
    phone,
    code,
    fullName: fullName.trim(),
    role: 'DRIVER' satisfies UserRole,
  });
}

export function logout(refreshToken: string): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>('/auth/logout', { refreshToken });
}
