import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VEHICLES } from '../data';
import { useI18n } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';
import type { Filters } from '../types';
import { IconButton, Button, Chip } from './ui';

export function FilterSheet({
  visible,
  filters,
  onChange,
  onClose,
  onReset,
  resultCount,
}: {
  visible: boolean;
  filters: Filters;
  onChange: (next: Filters) => void;
  onClose: () => void;
  onReset: () => void;
  resultCount: number;
}) {
  const insets = useSafeAreaInsets();
  const { t, loads, cityLabel, vehicleLabel } = useI18n();

  const groups: { key: keyof Filters; title: string; options: { value: string; label: string }[] }[] = [
    {
      key: 'weight',
      title: t('filter.weight'),
      options: [
        { value: 'any', label: t('filter.any') },
        { value: 'light', label: t('filter.upTo10') },
        { value: 'mid', label: t('filter.mid') },
        { value: 'heavy', label: t('filter.heavy') },
      ],
    },
    {
      key: 'truck',
      title: t('filter.truckType'),
      options: [
        { value: 'any', label: t('filter.any') },
        ...VEHICLES.map((type) => ({ value: type, label: vehicleLabel(type) })),
      ],
    },
    {
      key: 'region',
      title: t('filter.region'),
      options: [
        { value: 'any', label: t('filter.any') },
        { value: 'Tashkent', label: cityLabel('Tashkent') },
        { value: 'Samarkand', label: cityLabel('Samarkand') },
        { value: 'Bukhara', label: cityLabel('Bukhara') },
        { value: 'Fergana', label: cityLabel('Fergana') },
      ],
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('filter.closeA11y')}
        />
        <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.grab} />
          <View style={styles.head}>
            <Text style={styles.title}>{t('filter.title')}</Text>
            <IconButton name="close" onPress={onClose} plain accessibilityLabel={t('filter.closeA11y')} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {groups.map((group) => (
              <View key={group.key} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.chips}>
                  {group.options.map((opt) => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      height={42}
                      fontSize={13.5}
                      active={filters[group.key] === opt.value}
                      onPress={() => onChange({ ...filters, [group.key]: opt.value })}
                    />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.foot}>
            <Button label={t('filter.reset')} variant="ghost" onPress={onReset} style={{ minHeight: 50 }} />
            <Button
              label={t('filter.showLoads', { count: loads(resultCount) })}
              onPress={onClose}
              style={{ flex: 1, minHeight: 50 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
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
    maxHeight: '84%',
    ...shadow.sheet,
  },
  grab: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#d6dce4',
    alignSelf: 'center',
    marginBottom: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  group: {
    marginBottom: 16,
    gap: 8,
  },
  groupTitle: {
    fontSize: 10.5,
    fontFamily: font.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foot: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6,
  },
});
