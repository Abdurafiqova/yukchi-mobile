import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listVehicleDocuments, type VehicleDocumentsResult } from '../api';
import { DocumentsSheet } from '../components/DocumentsSheet';
import { Icon, type IconName } from '../components/Icon';
import { IconButton, PageHead } from '../components/ui';
import { initialsOf, useAuth } from '../auth';
import { LOCALES, LOCALE_LABELS, useI18n } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';

export function ProfileScreen({ showToast }: { showToast: (message: string) => void }) {
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale, vehicleLabel, statusLabel } = useI18n();
  const { session, vehicle, signOut } = useAuth();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [documents, setDocuments] = useState<VehicleDocumentsResult | null>(null);

  const vehicleId = vehicle?.id;
  const token = session?.accessToken;

  useEffect(() => {
    if (!vehicleId || !token) {
      setDocuments(null);
      return;
    }

    let alive = true;
    listVehicleDocuments(token, vehicleId)
      .then((next) => {
        if (alive) setDocuments(next);
      })
      .catch(() => {
        // Offline launch keeps the cached profile; the sheet retries when opened.
      });

    return () => {
      alive = false;
    };
  }, [token, vehicleId]);

  const handleDocumentsSummary = useCallback((next: VehicleDocumentsResult | null) => {
    setDocuments(next);
  }, []);

  const documentsTail = !vehicle
    ? t('profile.documentsPending')
    : documents?.complete
      ? t('profile.verified')
      : documents?.items.some((doc) => doc.status === 'PENDING')
        ? t('docs.status.pending')
        : t('profile.documentsPending');

  const driverName = session?.user.fullName || session?.user.phone || '';
  const driverVehicle = vehicle ? vehicleLabel(vehicle.type) : '';
  const trips = session?.user.stats?.offersCount ?? 0;
  const rating = (session?.user.ratingCount ?? 0) > 0 ? (session?.user.rating ?? 0).toFixed(1) : '—';

  const pickLanguage = (next: (typeof LOCALES)[number]) => {
    setLocale(next);
    setLanguageOpen(false);
  };

  return (
    <View style={styles.screen}>
      <PageHead
        title={t('profile.title')}
        sub={t('profile.sub')}
        right={
          <IconButton
            name="edit"
            onPress={() => showToast(t('profile.editToast'))}
            accessibilityLabel={t('profile.editA11y')}
          />
        }
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>{initialsOf(driverName)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.profileName} numberOfLines={1}>
              {driverName}
            </Text>
            <Text style={styles.profileRole} numberOfLines={1}>
              {vehicle ? t('profile.driverMeta', { vehicle: driverVehicle, weight: vehicle.weight }) : t('profile.role')}
            </Text>
            {session?.user.phone ? <Text style={styles.profilePhone}>{session.user.phone}</Text> : null}
          </View>
        </View>

        <View style={styles.statstrip}>
          <Stat value={String(trips)} label={t('profile.trips')} />
          <Stat value={rating} label={t('profile.rating')} />
          <Stat value="0" label={t('profile.km')} last />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t('profile.truck')}</Text>
          <View style={styles.truckRow}>
            <View style={styles.truckIco}>
              <Icon name="truck" size={22} color={colors.orangeDeep} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ownerName} numberOfLines={1}>
                {vehicle ? `${driverVehicle} · ${vehicle.plate}` : t('profile.truck')}
              </Text>
              <Text style={styles.ownerMeta} numberOfLines={1}>
                {vehicle
                  ? [`${vehicle.weight} t`, vehicle.status ? statusLabel(vehicle.status) : null]
                      .filter(Boolean)
                      .join(' · ')
                  : t('profile.truckMeta')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rows}>
          <Row
            icon="globe"
            label={t('profile.language')}
            tail={LOCALE_LABELS[locale]}
            onPress={() => setLanguageOpen(true)}
          />
          <Row
            icon="file"
            label={t('profile.documents')}
            tail={documentsTail}
            tailColor={documents?.complete ? colors.green : undefined}
            onPress={() => setDocumentsOpen(true)}
          />
          <Row
            icon="help"
            label={t('profile.help')}
            tail={t('profile.helpTail')}
            onPress={() => showToast(t('profile.helpToast'))}
          />
          <Row
            icon="back"
            label={t('profile.logout')}
            tail=""
            onPress={() => {
              void signOut();
            }}
            last
          />
        </View>
      </ScrollView>

      <Modal
        visible={languageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageOpen(false)}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLanguageOpen(false)}
            accessibilityLabel={t('common.closeA11y')}
          />
          <View style={[styles.sheet, { paddingBottom: 14 + insets.bottom }]}>
            <View style={styles.grab} />
            <Text style={styles.sheetTitle}>{t('profile.languageSheet')}</Text>
            {LOCALES.map((code) => {
              const active = code === locale;
              return (
                <Pressable
                  key={code}
                  onPress={() => pickLanguage(code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    active && { backgroundColor: colors.navySoft },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={[
                      styles.sheetOption,
                      active && { color: colors.navy, fontFamily: font.bold },
                    ]}
                  >
                    {LOCALE_LABELS[code]}
                  </Text>
                  {active ? <Icon name="check" size={18} color={colors.navy} strokeWidth={2} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      <DocumentsSheet
        visible={documentsOpen}
        onClose={() => setDocumentsOpen(false)}
        showToast={showToast}
        onSummary={handleDocumentsSummary}
      />
    </View>
  );
}

function Stat({ value, label, last }: { value: string; label: string; last?: boolean }) {
  return (
    <View style={[styles.statcell, !last && styles.statBorder]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({
  icon,
  label,
  tail,
  tailColor,
  onPress,
  last,
}: {
  icon: IconName;
  label: string;
  tail: string;
  tailColor?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.rowitem, !last && styles.rowBorder, pressed && { backgroundColor: '#f7f9fc' }]}
    >
      <View style={styles.lead}>
        <Icon name={icon} size={20} color={colors.ink2} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.tail, tailColor ? { color: tailColor, fontFamily: font.bold } : null]}>{tail}</Text>
    </Pressable>
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
    paddingBottom: 20,
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  avatarLg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLgText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: font.bold,
    letterSpacing: 0.3,
  },
  profileName: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
    lineHeight: 23,
  },
  profileRole: {
    fontSize: 13,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  profilePhone: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink3,
    marginTop: 2,
  },
  statstrip: {
    flexDirection: 'row',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  statcell: {
    flex: 1,
    padding: 12,
    gap: 1,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: '#eef1f5',
  },
  statValue: {
    fontSize: 18,
    fontFamily: font.extrabold,
    color: colors.navy,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 10.5,
    fontFamily: font.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
  },
  panelTitle: {
    fontSize: 11,
    fontFamily: font.bold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 12,
  },
  truckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  truckIco: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerName: {
    fontSize: 15,
    fontFamily: font.bold,
    color: colors.ink,
    lineHeight: 20,
  },
  ownerMeta: {
    fontSize: 12.5,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  rows: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  rowitem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f5',
  },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 14.5,
    fontFamily: font.semibold,
    color: colors.ink,
  },
  tail: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 10,
    paddingHorizontal: 20,
    ...shadow.sheet,
  },
  grab: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#d6dce4',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sheetOption: {
    fontSize: 15,
    fontFamily: font.medium,
    color: colors.ink,
  },
});
