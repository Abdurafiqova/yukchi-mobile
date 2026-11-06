import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrency } from '../currency';
import { useI18n } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';
import { Icon } from './Icon';

export function CurrencySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { currency, setCurrency, options } = useCurrency();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('filter.closeA11y')} />
        <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.grab} />
          <Text style={styles.title}>{t('currency.viewIn')}</Text>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={styles.list}>
            {options.map((option) => {
              const active = option.value === currency;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setCurrency(option.value);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && { opacity: 0.8 }]}
                >
                  <View style={[styles.codeBox, active && styles.codeBoxActive]}>
                    <Text style={[styles.code, active && { color: colors.navy }]}>{option.value}</Text>
                  </View>
                  <Text style={[styles.name, active && styles.nameActive]}>{option.label}</Text>
                  {active ? <Icon name="check" size={18} color={colors.navy} strokeWidth={2.2} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.note}>{t('currency.rateNote')}</Text>
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
  title: {
    fontSize: 19,
    fontFamily: font.extrabold,
    color: colors.navy,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  list: {
    maxHeight: 420,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  rowActive: {
    backgroundColor: colors.navySoft,
  },
  codeBox: {
    width: 48,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: {
    backgroundColor: colors.surface,
  },
  code: {
    fontSize: 12.5,
    fontFamily: font.bold,
    color: colors.ink2,
    letterSpacing: 0.3,
  },
  name: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: font.medium,
    color: colors.ink,
  },
  nameActive: {
    fontFamily: font.bold,
    color: colors.navy,
  },
  note: {
    marginTop: 10,
    fontSize: 11.5,
    fontFamily: font.medium,
    color: colors.ink3,
    textAlign: 'center',
  },
});
