import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, IconButton, PageHead, Segmented } from '../components/ui';
import { useCurrency } from '../currency';
import { ROUTES_ACTIVE, ROUTES_DONE } from '../data';
import { useI18n } from '../i18n/index';
import { colors, font, radius } from '../theme';

export function RoutesScreen({
  onOpenCargo,
  showToast,
}: {
  onOpenCargo: (id: string) => void;
  showToast: (message: string) => void;
}) {
  const { t, cityLabel, statusLabel, formatDate } = useI18n();
  const { currency, formatPrice } = useCurrency();
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const whenText = (trip: (typeof ROUTES_ACTIVE)[number]) =>
    trip.when.kind === 'pickupToday'
      ? t('routes.whenToday', { time: trip.when.time })
      : t('routes.whenDelivered', { date: formatDate(trip.when.date) });

  return (
    <View style={styles.screen}>
      <PageHead
        title={t('routes.title')}
        sub={t('routes.sub')}
        right={
          <IconButton
            name="calendar"
            onPress={() => showToast(t('routes.calendarToast'))}
            accessibilityLabel={t('routes.calendarA11y')}
          />
        }
      />
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Segmented
          wide
          height={38}
          options={[
            { key: 'active', label: t('routes.active') },
            { key: 'done', label: t('routes.completed') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {tab === 'active'
          ? ROUTES_ACTIVE.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => r.cargoId && onOpenCargo(r.cargoId)}
                style={({ pressed }) => [styles.card, pressed && { borderColor: colors.navyLine }]}
              >
                <View style={styles.top}>
                  <Text style={styles.id}>{r.id}</Text>
                  <Badge label={statusLabel(r.status)} tone={r.tone} />
                </View>
                <Text style={styles.title}>{r.title}</Text>
                <Text style={styles.route}>
                  {cityLabel(r.from)} → {cityLabel(r.to)}
                </Text>
                <View style={styles.foot}>
                  <Text style={styles.footText}>{whenText(r)}</Text>
                  <Text style={styles.link}>{t('routes.openCargo')}</Text>
                </View>
              </Pressable>
            ))
          : ROUTES_DONE.map((r) => (
              <View key={r.title} style={styles.card}>
                <View style={styles.top}>
                  <Text style={styles.route}>
                    {cityLabel(r.from)} → {cityLabel(r.to)}
                  </Text>
                  <Badge label={statusLabel(r.status)} tone={r.tone} />
                </View>
                <Text style={styles.title}>{r.title}</Text>
                <View style={styles.foot}>
                  <Text style={styles.footText}>{whenText(r)}</Text>
                  {r.price != null ? (
                    <Text style={styles.link}>
                      {formatPrice(r.price, r.currency)} {currency}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: 8,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  id: {
    fontSize: 11,
    fontFamily: font.bold,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  title: {
    fontSize: 16,
    fontFamily: font.bold,
    letterSpacing: -0.1,
    color: colors.ink,
  },
  route: {
    fontSize: 13.5,
    fontFamily: font.regular,
    color: colors.ink2,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.line,
  },
  footText: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  link: {
    fontSize: 12.5,
    fontFamily: font.bold,
    color: colors.navy,
  },
});
