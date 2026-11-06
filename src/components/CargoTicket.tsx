import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { vehicleIcon } from '../cargo-map';
import { useCurrency } from '../currency';
import { Icon } from './Icon';
import { useI18n } from '../i18n/index';
import { colors, font, radius } from '../theme';
import type { Cargo } from '../types';

export function CargoTicket({ cargo, onPress }: { cargo: Cargo; onPress: () => void }) {
  const { t, cityLabel, vehicleLabel, paymentLabel, formatDate } = useI18n();
  const { currency, formatPrice } = useCurrency();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('feed.openA11y', {
        title: cargo.title,
        from: cityLabel(cargo.from),
        to: cityLabel(cargo.to),
      })}
      style={({ pressed }) => [styles.card, pressed && { borderColor: colors.navyLine }]}
    >
      <View style={styles.top}>
        <View style={styles.vehicle}>
          <Icon name={vehicleIcon(cargo.vehicle)} size={28} color={colors.navy} strokeWidth={1.6} />
          <Text style={styles.vehicleLabel} numberOfLines={1}>
            {vehicleLabel(cargo.vehicle)}
          </Text>
        </View>

        <View style={styles.mid}>
          <View style={styles.badgeRow}>
            <View style={[styles.dot, { backgroundColor: cargo.readyToLoad ? colors.green : '#9aa6b4' }]} />
            <Text style={[styles.ready, !cargo.readyToLoad && { color: colors.ink3 }]}>
              {cargo.readyToLoad ? t('cargo.ready') : formatDate(cargo.pickupDate)}
            </Text>
            {cargo.isAdditionalLoad ? (
              <View style={styles.additional}>
                <Text style={styles.additionalText}>{t('cargo.additional')}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.city} numberOfLines={1}>
            {cityLabel(cargo.from)}
          </Text>

          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{cargo.weight}</Text>
            </View>
            {cargo.volume !== '—' ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{cargo.volume}</Text>
              </View>
            ) : null}
            {cargo.trucksNeeded > 1 ? (
              <View style={styles.chip}>
                <Icon name="truck" size={11} color={colors.ink2} strokeWidth={2} />
                <Text style={styles.chipText}>
                  {t('cargo.trucks', { n: cargo.trucksNeeded })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.price} numberOfLines={1}>
            {cargo.priceNegotiable || !cargo.price ? t('cargo.negotiable') : formatPrice(cargo.price, cargo.currency)}
          </Text>
          {!cargo.priceNegotiable && cargo.price ? (
            <Text style={styles.currency}>{currency}</Text>
          ) : null}
          <View style={styles.payment}>
            <Text style={styles.paymentText}>{paymentLabel(cargo.paymentMethod)}</Text>
          </View>
          <View style={styles.views}>
            <Text style={styles.viewsText}>{cargo.postedTime}</Text>
            <Icon name="eye" size={11} color={colors.ink3} strokeWidth={2} />
            <Text style={styles.viewsText}>{cargo.views}</Text>
          </View>
        </View>
      </View>

      <View style={styles.route}>
        <Text style={styles.routeCity} numberOfLines={1}>
          {cityLabel(cargo.from)}
        </Text>
        <View style={styles.road}>
          <Text style={styles.routeTitle} numberOfLines={1}>
            {cargo.title}
          </Text>
          <View style={styles.roadLine}>
            <View style={styles.dashes} />
            <View style={styles.truckBubble}>
              <Icon name="truck" size={14} color={colors.orangeDeep} strokeWidth={2.2} />
            </View>
          </View>
        </View>
        <Text style={[styles.routeCity, styles.routeCityEnd]} numberOfLines={1}>
          {cityLabel(cargo.to)}
        </Text>
      </View>

      <Text style={styles.notes} numberOfLines={1}>
        {cargo.notes || cargo.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  top: {
    flexDirection: 'row',
    gap: 10,
  },
  vehicle: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  vehicleLabel: {
    maxWidth: 56,
    fontSize: 9,
    fontFamily: font.bold,
    color: colors.ink3,
    textAlign: 'center',
  },
  mid: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ready: {
    fontSize: 11.5,
    fontFamily: font.bold,
    color: colors.green,
  },
  additional: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 99,
    backgroundColor: colors.orangeSoft,
  },
  additionalText: {
    fontSize: 10,
    fontFamily: font.bold,
    color: colors.orangeDeep,
  },
  city: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.35,
    color: colors.ink,
    lineHeight: 23,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: colors.surface2,
  },
  chipText: {
    fontSize: 11,
    fontFamily: font.semibold,
    color: colors.ink2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 1,
    maxWidth: 118,
  },
  price: {
    fontSize: 17,
    fontFamily: font.extrabold,
    letterSpacing: -0.3,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  currency: {
    fontSize: 10,
    fontFamily: font.bold,
    color: colors.ink3,
  },
  payment: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: colors.navySoft,
  },
  paymentText: {
    fontSize: 10.5,
    fontFamily: font.bold,
    color: colors.navy,
  },
  views: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 10.5,
    fontFamily: font.medium,
    color: colors.ink3,
  },
  route: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeCity: {
    maxWidth: '30%',
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink2,
  },
  routeCityEnd: {
    textAlign: 'right',
    marginLeft: 'auto',
  },
  road: {
    flex: 1,
    minWidth: 0,
  },
  routeTitle: {
    fontSize: 10.5,
    fontFamily: font.semibold,
    color: colors.ink3,
    textAlign: 'center',
    marginBottom: 3,
  },
  roadLine: {
    height: 16,
    justifyContent: 'center',
  },
  dashes: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 7.5,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
  },
  truckBubble: {
    alignSelf: 'center',
    width: 26,
    height: 17,
    borderRadius: 5,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notes: {
    marginTop: 7,
    fontSize: 11.5,
    fontFamily: font.medium,
    color: colors.ink3,
  },
});
