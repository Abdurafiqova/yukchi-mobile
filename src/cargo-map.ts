import type { ImageSourcePropType } from 'react-native';
import type { CargoApi } from './api';
import type { IconName } from './components/Icon';
import { isCurrencyCode } from './currency';
import type { Cargo, VehicleType } from './types';

const STOCK_PHOTOS: Record<string, ImageSourcePropType> = {
  '/stock/cement.jpg': require('../assets/stock/cement.jpg'),
  '/stock/produce.jpg': require('../assets/stock/produce.jpg'),
  '/stock/steel.jpg': require('../assets/stock/steel.jpg'),
  '/stock/truck.jpg': require('../assets/stock/truck.jpg'),
};

function imageSource(url: string): ImageSourcePropType {
  const path = url.replace(/^https?:\/\/[^/]+/i, '');
  const local = STOCK_PHOTOS[path];
  if (local) return local;
  return { uri: url };
}

const VEHICLE_ICONS: Record<VehicleType, IconName> = {
  TENT: 'truck',
  FLATBED: 'truck',
  REFRIGERATED: 'snow',
  TIPPER: 'truck',
  TANKER: 'droplets',
  VAN: 'box',
  ISOTHERMAL: 'snow',
  CONTAINER: 'box',
  CAR_CARRIER: 'car',
  CRANE: 'wrench',
};

export function vehicleIcon(type: VehicleType): IconName {
  return VEHICLE_ICONS[type] ?? 'truck';
}

// Uzbekistan bounds used to place real pickup coordinates on the stylised map.
const BOUNDS = { minLng: 55.9, maxLng: 73.2, maxLat: 45.6, minLat: 37.2 };

const CITY_NAMES: Record<string, string> = {
  toshkent: 'Tashkent',
  tashkent: 'Tashkent',
  samarqand: 'Samarkand',
  samarkand: 'Samarkand',
  buxoro: 'Bukhara',
  bukhara: 'Bukhara',
  "farg'ona": 'Fergana',
  fargona: 'Fergana',
  fergana: 'Fergana',
  jizzax: 'Jizzakh',
  jizzakh: 'Jizzakh',
  andijon: 'Andijan',
  andijan: 'Andijan',
  nukus: 'Nukus',
  namangan: 'Namangan',
  qarshi: 'Karshi',
  karshi: 'Karshi',
  termiz: 'Termez',
  termez: 'Termez',
};

const STATUS_NAMES: Record<string, string> = {
  PUBLISHED: 'Published',
  PENDING_REVIEW: 'Pending review',
  IN_PROGRESS: 'Active',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};

function cityName(value: string | null | undefined) {
  const raw = (value || '').trim();
  return CITY_NAMES[raw.toLowerCase()] ?? raw;
}

function weightLabel(kg: number) {
  if (kg >= 1000) {
    const tons = Math.round((kg / 1000) * 10) / 10;
    return `${tons} t`;
  }
  return `${Math.round(kg)} kg`;
}

function markerFor(lat: number | null, lng: number | null, index: number) {
  if (lat === null || lng === null) {
    return { left: 42 + ((index * 13) % 34), top: 36 + ((index * 9) % 32) };
  }
  const left = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const top = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  // Seed pickups share city-centre coordinates, so nudge each marker to keep pills readable.
  const spreadX = ((index % 5) - 2) * 5;
  const spreadY = ((Math.floor(index / 5) % 3) - 1) * 6;
  return {
    left: Math.min(94, Math.max(6, Math.round((left + spreadX) * 10) / 10)),
    top: Math.min(92, Math.max(8, Math.round((top + spreadY) * 10) / 10)),
  };
}

export function mapCargo(api: CargoApi, index = 0): Cargo {
  const photos = api.images.map((image) => ({ src: imageSource(image.url), alt: image.alt ?? api.title }));
  const pickupCity = cityName(api.pickup.city);
  const dropCity = cityName(api.dropoff.city);
  const rating = api.owner.ratingCount > 0 ? api.owner.rating.toFixed(1) : '—';
  const postedAt = api.publishedAt ?? api.createdAt;
  const postedTime = new Date(postedAt);

  return {
    id: api.id,
    code: api.code,
    title: api.title,
    from: pickupCity,
    to: dropCity,
    pickup: api.pickup.address?.trim() || pickupCity,
    drop: api.dropoff.address?.trim() || dropCity,
    distance: api.distanceKm === undefined ? '' : `${Math.max(1, Math.round(api.distanceKm))} km`,
    price: api.price,
    currency: isCurrencyCode(api.currency) ? api.currency : 'UZS',
    priceNegotiable: api.priceNegotiable,
    weight: weightLabel(api.weightKg),
    minWeight: api.weightKg / 1000,
    volume: api.volumeM3 ? `${api.volumeM3} m³` : '—',
    vehicle: api.vehicleType,
    region: pickupCity,
    owner: api.owner.name,
    initials: api.owner.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
    rating,
    ownerMeta: api.owner.companyName ?? (api.owner.ratingCount > 0 ? `${api.owner.ratingCount} ★` : 'YUKCHI.UZ'),
    posted: postedAt.slice(0, 10),
    postedTime: Number.isNaN(postedTime.getTime())
      ? ''
      : `${String(postedTime.getHours()).padStart(2, '0')}:${String(postedTime.getMinutes()).padStart(2, '0')}`,
    views: api.viewCount,
    paymentMethod: api.paymentMethod,
    advanceAmount: api.advanceAmount ?? 0,
    trucksNeeded: api.trucksNeeded,
    readyToLoad: api.readyToLoad,
    pickupDate: api.pickupDate.slice(0, 10),
    isAdditionalLoad: api.isAdditionalLoad,
    photos,
    photo: photos[0]?.src ?? null,
    marker: markerFor(api.pickup.lat, api.pickup.lng, index),
    notes: api.description ?? '',
    status: STATUS_NAMES[api.status] ?? api.status,
  };
}
