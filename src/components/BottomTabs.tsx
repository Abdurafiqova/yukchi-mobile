import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n, type MessageKey } from '../i18n/index';
import { colors, font } from '../theme';
import type { MainTab } from '../types';
import { Icon, type IconName } from './Icon';

const TABS: { key: MainTab; label: MessageKey; icon: IconName }[] = [
  { key: 'feed', label: 'tabs.home', icon: 'home' },
  { key: 'routes', label: 'tabs.routes', icon: 'routes' },
  { key: 'chats', label: 'tabs.chats', icon: 'chat' },
  { key: 'profile', label: 'tabs.profile', icon: 'user' },
];

export function BottomTabs({
  active,
  onChange,
  bottomInset,
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
  bottomInset: number;
}) {
  const { t } = useI18n();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, 4) + 4 }]}>
      {TABS.map((tab) => {
        const on = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.ico, on && { backgroundColor: colors.navySoft }]}>
              <Icon name={tab.icon} size={21} color={on ? colors.navy : '#5f7086'} />
            </View>
            <Text style={[styles.label, on && { color: colors.navy }]}>{t(tab.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ico: {
    width: 40,
    height: 26,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: font.bold,
    letterSpacing: 0.2,
    color: '#5f7086',
  },
});
