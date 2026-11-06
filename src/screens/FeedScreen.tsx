import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MainMap } from '../components/MapArt';
import { FilterSheet } from '../components/FilterSheet';
import { CurrencySheet } from '../components/CurrencySheet';
import { CargoTicket } from '../components/CargoTicket';
import { Icon } from '../components/Icon';
import { Button, Chip, IconButton, Segmented } from '../components/ui';
import { firstName, useAuth } from '../auth';
import { useCurrency } from '../currency';
import { useI18n } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';
import type { Cargo, FeedView, Filters } from '../types';

const EMPTY_FILTERS: Filters = { weight: 'any', truck: 'any', region: 'any' };

function distanceKm(value: string): number {
  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  return match ? Number(match[1].replace(',', '.')) : Number.MAX_SAFE_INTEGER;
}

export function filterCargos(cargos: Cargo[], query: string, filters: Filters) {
  const q = query.trim().toLowerCase();
  return cargos
    .filter((c) => {
      const haystack = [c.title, c.from, c.to, c.owner, c.id, c.vehicle].join(' ').toLowerCase();
      if (q && haystack.indexOf(q) === -1) return false;
      const w = filters.weight;
      if (w === 'light' && c.minWeight > 10) return false;
      if (w === 'mid' && (c.minWeight <= 10 || c.minWeight > 20)) return false;
      if (w === 'heavy' && c.minWeight <= 20) return false;
      if (filters.truck !== 'any' && c.vehicle !== filters.truck) return false;
      if (filters.region !== 'any' && c.region !== filters.region) return false;
      return true;
    })
    .sort((a, b) => distanceKm(a.distance) - distanceKm(b.distance));
}

type Props = {
  cargos: Cargo[];
  query: string;
  setQuery: (q: string) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  view: FeedView;
  setView: (v: FeedView) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onOpenCargo: (id: string) => void;
  onPost: () => void;
  showToast: (message: string) => void;
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  hasNext: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

export function FeedScreen({
  cargos,
  query,
  setQuery,
  filters,
  setFilters,
  view,
  setView,
  selectedId,
  setSelectedId,
  onOpenCargo,
  onPost,
  showToast,
  loading,
  loadingMore,
  error,
  hasNext,
  onLoadMore,
  onRetry,
}: Props) {
  const { t, loads, cityLabel, vehicleLabel, distanceLabel } = useI18n();
  const { currency, convert, formatPrice } = useCurrency();
  const { session } = useAuth();
  const driverName = firstName(session?.user.fullName);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const list = filterCargos(cargos, query, filters);
  const selected = list.find((c) => c.id === selectedId) || list[0] || null;
  const filterBadge = (['weight', 'truck', 'region'] as const).filter((k) => filters[k] !== 'any').length;
  const markerAmount = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (value >= 10_000) return `${Math.round(value / 1000)}K`;
    return String(Math.round(value));
  };
  const quick = [
    { key: 'reset', label: t('feed.allLoads') },
    { key: 'region:Tashkent', label: cityLabel('Tashkent') },
    { key: 'region:Samarkand', label: cityLabel('Samarkand') },
    { key: 'weight:heavy', label: t('filter.heavy') },
    { key: 'truck:TENT', label: vehicleLabel('TENT') },
  ];

  useEffect(() => {
    if (list.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!list.some((c) => c.id === selectedId)) {
      setSelectedId(list[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.map((c) => c.id).join(','), selectedId]);

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setQuery('');
  };

  const toggleQuick = (key: string) => {
    if (key === 'reset') {
      resetFilters();
      return;
    }
    const [kind, value] = key.split(':');
    const current = filters[kind as keyof Filters];
    setFilters({ ...filters, [kind]: current === value ? 'any' : value });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topbar}>
        <View style={styles.brandline}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>Y</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.brandName}>YUKCHI.UZ</Text>
              <Text style={styles.brandSub} numberOfLines={1}>
                {driverName
                  ? t('feed.greeting', { name: driverName, count: loads(cargos.length) })
                  : t('feed.nearby', { city: cityLabel('Tashkent'), count: loads(cargos.length) })}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setCurrencyOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('currency.viewIn')}
            testID="currency-button"
            style={({ pressed }) => [styles.currencyBtn, pressed && { backgroundColor: colors.navySoft }]}
          >
            <Icon name="coins" size={14} color={colors.navy} strokeWidth={1.8} />
            <Text style={styles.currencyBtnText}>{currency}</Text>
            <Icon name="chevronDown" size={12} color={colors.ink3} strokeWidth={2} />
          </Pressable>
          <IconButton name="plus" onPress={onPost} accessibilityLabel={t('feed.postA11y')} testID="post-button" />
        </View>

        <View style={styles.searchline}>
          <View style={styles.search}>
            <Icon name="search" size={20} color={colors.ink3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('feed.search')}
              placeholderTextColor="#6c7a8c"
              style={styles.searchInput}
              autoCapitalize="none"
              testID="feed-search"
            />
          </View>
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('feed.filterA11y')}
            testID="filter-button"
            style={({ pressed }) => [styles.filterBtn, pressed && { backgroundColor: colors.navySoft }]}
          >
            <Icon name="filter" size={18} color={colors.navy} strokeWidth={1.9} />
            <Text style={styles.filterText}>{t('feed.filter')}</Text>
            {filterBadge > 0 ? (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{filterBadge}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={{ marginHorizontal: -20 }}
        >
          {quick.map((q) => {
            const [kind, value] = q.key.split(':');
            const on =
              q.key === 'reset'
                ? filterBadge === 0 && !query
                : filters[kind as keyof Filters] === value;
            return (
              <Chip
                key={q.key}
                label={q.label}
                active={on}
                onPress={() => toggleQuick(q.key)}
              />
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.viewbar}>
        <Segmented
          options={[
            { key: 'map', label: t('feed.map') },
            { key: 'list', label: t('feed.list') },
          ]}
          value={view}
          onChange={setView}
        />
        <Text style={styles.resultCount}>{loads(list.length)}</Text>
      </View>

      {view === 'map' ? (
        <View style={styles.feedbody}>
          <View style={styles.mapview}>
            <MainMap />
            <YouDot />
            {list.map((c) => {
              const on = c.id === selected?.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedId(c.id)}
                  onLongPress={() => onOpenCargo(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('feed.markerA11y', {
                    title: c.title,
                    from: cityLabel(c.from),
                    to: cityLabel(c.to),
                    price: formatPrice(c.price, c.currency),
                    currency,
                  })}
                  style={[
                    styles.marker,
                    { left: `${c.marker.left}%` as unknown as number, top: `${c.marker.top}%` as unknown as number },
                    on && { backgroundColor: colors.navy, borderColor: colors.navy },
                  ]}
                >
                  <Text style={[styles.markerAmount, on && { color: '#fff' }]}>
                    {markerAmount(convert(c.price, c.currency))}
                  </Text>
                  <Text style={[styles.markerCur, on && { color: 'rgba(255,255,255,0.78)' }]}>
                    {currency}
                  </Text>
                  <View
                    style={[
                      styles.markerArrow,
                      { borderTopColor: on ? colors.navy : colors.surface },
                    ]}
                  />
                </Pressable>
              );
            })}
            <Pressable
              style={styles.locateBtn}
              onPress={() => {
                setSelectedId(list[0] ? list[0].id : null);
                showToast(t('feed.centered'));
              }}
              accessibilityLabel={t('feed.locateA11y')}
            >
              <Icon name="crosshair" size={20} color={colors.navy} />
            </Pressable>
          </View>

          <View style={styles.sheetcard}>
            <View style={styles.sheetHandle} />
            {selected ? (
              <>
                <View style={styles.nearestRow}>
                  <View style={styles.nearestThumb}>
                    {selected.photo ? (
                      <Image source={selected.photo} style={styles.fillImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.nearestNoPhoto}>
                        <Icon name="truck" size={30} color={colors.navy} strokeWidth={1.6} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <View style={styles.tagRow}>
                      <Icon name="pin" size={12} color={colors.orangeDeep} strokeWidth={2} />
                      <Text style={styles.tag}>
                        {t('feed.nearest', { distance: distanceLabel(selected.distance) })}
                      </Text>
                    </View>
                    <Text style={styles.nearestTitle} numberOfLines={1}>
                      {selected.title}
                    </Text>
                    <Text style={styles.nearestRoute} numberOfLines={1}>
                      {cityLabel(selected.from)} → {cityLabel(selected.to)}
                    </Text>
                    <Text style={styles.price}>
                      {formatPrice(selected.price, selected.currency)}{' '}
                      <Text style={styles.priceSmall}>{currency}</Text>
                    </Text>
                  </View>
                </View>
                <Button
                  label={t('feed.viewDetails')}
                  onPress={() => onOpenCargo(selected.id)}
                  block
                  style={{ marginTop: 10 }}
                  testID="view-details"
                />
              </>
            ) : (
              <EmptyState compact onClear={resetFilters} />
            )}
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 240) {
              onLoadMore();
            }
          }}
          scrollEventThrottle={120}
        >
          {loading && !list.length ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color={colors.navy} />
            </View>
          ) : error && !list.length ? (
            <View style={styles.statusBox}>
              <View style={styles.emptyIcon}>
                <Icon name="search" size={24} color={colors.navy} />
              </View>
              <Text style={styles.emptyTitle}>{t('feed.loadErrorTitle')}</Text>
              <Text style={styles.emptyText}>{t('feed.loadErrorText')}</Text>
              <Button
                label={t('feed.retry')}
                variant="outline"
                onPress={onRetry}
                style={{ marginTop: 10, minHeight: 48 }}
              />
            </View>
          ) : list.length ? (
            <>
              {filterBadge === 0 && !query ? (
                <View style={styles.nearbyPill}>
                  <Icon name="pin" size={13} color={colors.orangeDeep} strokeWidth={2} />
                  <Text style={styles.nearbyPillText}>{t('feed.nearbyHint')}</Text>
                </View>
              ) : null}
              {list.map((c) => (
                <CargoTicket key={c.id} cargo={c} onPress={() => onOpenCargo(c.id)} />
              ))}
              {loadingMore ? (
                <View style={styles.footerBox}>
                  <ActivityIndicator color={colors.navy} />
                </View>
              ) : null}
            </>
          ) : (
            <EmptyState onClear={resetFilters} />
          )}
        </ScrollView>
      )}

      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setSheetOpen(false)}
        onReset={resetFilters}
        resultCount={list.length}
      />
      <CurrencySheet visible={currencyOpen} onClose={() => setCurrencyOpen(false)} />
    </View>
  );
}

function YouDot() {
  const ping = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(ping, {
        toValue: 1,
        duration: 2600,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [ping]);

  return (
    <View pointerEvents="none" style={styles.youDotWrap}>
      <Animated.View
        style={[
          styles.youRing,
          {
            opacity: ping.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0, 0] }),
            transform: [
              { scale: ping.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 1.5, 1.5] }) },
            ],
          },
        ]}
      />
      <View style={styles.youDot} />
    </View>
  );
}

function EmptyState({ compact, onClear }: { compact?: boolean; onClear: () => void }) {
  const { t } = useI18n();
  return (
    <View style={[styles.empty, compact && { paddingVertical: 18, paddingHorizontal: 8 }]}>
      <View style={styles.emptyIcon}>
        <Icon name="search" size={24} color={colors.navy} />
      </View>
      <Text style={styles.emptyTitle}>{t('feed.emptyTitle')}</Text>
      <Text style={styles.emptyText}>{compact ? t('feed.emptyCompact') : t('feed.emptyFull')}</Text>
      <Button
        label={t('feed.clearFilters')}
        variant="outline"
        onPress={onClear}
        style={{ marginTop: 10, minHeight: 48 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topbar: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  brandline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  currencyBtn: {
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencyBtnText: {
    fontSize: 12.5,
    fontFamily: font.bold,
    color: colors.navy,
    letterSpacing: 0.3,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
  },
  brandName: {
    fontSize: 11,
    fontFamily: font.bold,
    letterSpacing: 1.2,
    color: colors.ink3,
    lineHeight: 14,
  },
  brandSub: {
    fontSize: 17,
    fontFamily: font.bold,
    letterSpacing: -0.25,
    color: colors.ink,
    lineHeight: 21,
  },
  searchline: {
    flexDirection: 'row',
    gap: 10,
  },
  search: {
    flex: 1,
    minWidth: 0,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 16,
    color: colors.ink,
    fontFamily: font.regular,
    outlineStyle: 'none',
  } as object,
  filterBtn: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    fontFamily: font.bold,
    color: colors.navy,
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 99,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontSize: 12,
    fontFamily: font.extrabold,
    color: colors.orangeInk,
  },
  chipRow: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 2,
  },
  viewbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  resultCount: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  feedbody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    minHeight: 0,
  },
  mapview: {
    flex: 1,
    minHeight: 170,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d5dde4',
    backgroundColor: colors.mapBg,
    ...shadow.card,
  },
  marker: {
    position: 'absolute',
    width: 74,
    height: 44,
    marginLeft: -37,
    marginTop: -51,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d3dbe3',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    ...shadow.card,
  },
  markerAmount: {
    fontSize: 13,
    fontFamily: font.extrabold,
    letterSpacing: -0.1,
    color: colors.navy,
    fontVariant: ['tabular-nums'],
  },
  markerCur: {
    fontSize: 10,
    fontFamily: font.bold,
    color: colors.ink3,
  },
  markerArrow: {
    position: 'absolute',
    left: 37 - 6,
    top: 43,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  locateBtn: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d3dbe3',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  youDotWrap: {
    position: 'absolute',
    left: '56%' as unknown as number,
    top: '52%' as unknown as number,
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.navy,
    borderWidth: 3,
    borderColor: '#fff',
  },
  youRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(26,54,93,0.22)',
  },
  sheetcard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    ...shadow.card,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.handle,
    alignSelf: 'center',
    marginBottom: 10,
  },
  nearestRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  nearestThumb: {
    width: 74,
    height: 74,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.navySoft,
  },
  fillImg: {
    width: '100%',
    height: '100%',
  },
  nearestNoPhoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navySoft,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tag: {
    fontSize: 11,
    fontFamily: font.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.orangeDeep,
  },
  nearestTitle: {
    fontSize: 18,
    fontFamily: font.bold,
    letterSpacing: -0.25,
    color: colors.ink,
    lineHeight: 22,
  },
  nearestRoute: {
    fontSize: 13.5,
    color: colors.ink2,
    fontFamily: font.regular,
  },
  price: {
    fontSize: 17,
    fontFamily: font.extrabold,
    letterSpacing: -0.2,
    color: colors.navy,
    fontVariant: ['tabular-nums'],
  },
  priceSmall: {
    fontSize: 11,
    fontFamily: font.bold,
    color: colors.ink3,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  nearbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: colors.orangeSoft,
  },
  nearbyPillText: {
    fontSize: 11.5,
    fontFamily: font.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.orangeDeep,
  },
  loadrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  loadrowThumb: {
    width: 76,
    height: 76,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: colors.navySoft,
  },
  loadrowTitle: {
    fontSize: 16.5,
    fontFamily: font.bold,
    letterSpacing: -0.15,
    color: colors.ink,
  },
  loadrowRoute: {
    fontSize: 13,
    color: colors.ink2,
    fontFamily: font.regular,
  },
  loadrowMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  loadrowPrice: {
    fontSize: 15,
    fontFamily: font.extrabold,
    color: colors.navy,
    fontVariant: ['tabular-nums'],
  },
  dotSep: {
    color: '#98a4b4',
    fontSize: 12,
  },
  dist: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  loadrowGo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    color: colors.ink,
  },
  emptyText: {
    fontSize: 14,
    color: colors.ink3,
    textAlign: 'center',
    maxWidth: 260,
    fontFamily: font.regular,
  },
  statusBox: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  footerBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
