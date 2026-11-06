import type { ImageSourcePropType } from 'react-native';
import type { CurrencyCode } from './currency';

export type UserRole = 'CARGO_OWNER' | 'DRIVER' | 'ADMIN';

export type VehicleType =
  | 'TENT'
  | 'FLATBED'
  | 'REFRIGERATED'
  | 'TIPPER'
  | 'TANKER'
  | 'VAN'
  | 'ISOTHERMAL'
  | 'CONTAINER'
  | 'CAR_CARRIER'
  | 'CRANE';

export type VehicleStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED';

export type VehicleDocumentType = 'TECH_PASSPORT' | 'INSURANCE' | 'TECH_INSPECTION' | 'PERMIT';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type CargoPhoto = {
  src: ImageSourcePropType;
  alt: string;
};

export type CargoPaymentMethod = 'CASH' | 'TRANSFER' | 'MIXED';

export type Cargo = {
  id: string;
  code?: string;
  title: string;
  from: string;
  to: string;
  pickup: string;
  drop: string;
  distance: string;
  price: number;
  currency: CurrencyCode;
  priceNegotiable: boolean;
  weight: string;
  minWeight: number;
  volume: string;
  vehicle: VehicleType;
  region: string;
  owner: string;
  initials: string;
  rating: string;
  ownerMeta: string;
  posted: string;
  postedTime: string;
  views: number;
  paymentMethod: CargoPaymentMethod;
  advanceAmount: number;
  trucksNeeded: number;
  readyToLoad: boolean;
  pickupDate: string;
  isAdditionalLoad: boolean;
  photos: CargoPhoto[];
  photo: ImageSourcePropType | null;
  marker: { left: number; top: number };
  notes: string;
  status: string;
};

export type RouteTrip = {
  id?: string;
  cargoId?: string;
  title: string;
  from: string;
  to: string;
  when: { kind: 'pickupToday'; time: string } | { kind: 'delivered'; date: string };
  price?: number;
  currency?: CurrencyCode;
  status: 'confirmed' | 'delivered';
  tone: 'green' | 'navy';
};

export type Filters = {
  weight: string;
  truck: string;
  region: string;
};

export type FeedView = 'map' | 'list';

export type MainTab = 'feed' | 'routes' | 'chats' | 'profile';

export type StackScreen =
  | { name: 'details'; cargoId: string }
  | { name: 'chat'; cargoId: string; chatId?: string; title?: string }
  | { name: 'create' };
