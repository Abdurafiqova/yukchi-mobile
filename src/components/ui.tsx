import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { colors, font, radius } from '../theme';
import { Icon, type IconName } from './Icon';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: IconName;
  iconSize?: number;
  block?: boolean;
  disabled?: boolean;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconSize = 18,
  block,
  disabled,
  fontSize = 15,
  style,
  testID,
}: ButtonProps) {
  const palette =
    variant === 'primary'
      ? { bg: colors.orange, border: colors.orange, text: colors.orangeInk }
      : variant === 'outline'
        ? { bg: colors.surface, border: colors.navy, text: colors.navy }
        : { bg: 'transparent', border: 'transparent', text: colors.ink2 };
  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: disabled ? '#f2c4a4' : palette.bg,
          borderColor: disabled ? '#f2c4a4' : palette.border,
          opacity: pressed && !disabled ? 0.86 : 1,
          transform: [{ translateY: pressed && !disabled ? 1 : 0 }],
        },
        block && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={iconSize} color={disabled ? '#77543c' : palette.text} strokeWidth={1.9} /> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.btnText,
          { color: disabled ? '#77543c' : palette.text, fontSize },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type IconButtonProps = {
  name: IconName;
  onPress?: () => void;
  size?: number;
  plain?: boolean;
  solid?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function IconButton({ name, onPress, size = 22, plain, solid, accessibilityLabel, style, testID }: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconBtn,
        plain && { borderColor: 'transparent', backgroundColor: 'transparent' },
        solid && { backgroundColor: colors.navy, borderColor: colors.navy },
        { opacity: pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Icon name={name} size={size} color={solid ? '#fff' : colors.navy} strokeWidth={1.9} />
    </Pressable>
  );
}

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  height?: number;
  fontSize?: number;
};

export function Chip({ label, active, onPress, height = 44, fontSize = 14 }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        { height, borderColor: active ? colors.navy : colors.line, backgroundColor: active ? colors.navy : colors.surface },
        pressed && { opacity: 0.82 },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.ink2, fontSize }]}>{label}</Text>
    </Pressable>
  );
}

type BadgeProps = {
  label: string;
  tone?: 'green' | 'amber' | 'navy' | 'orange' | 'red';
};

const badgePalette = {
  green: { bg: colors.greenBg, fg: colors.green },
  amber: { bg: colors.amberBg, fg: colors.amber },
  navy: { bg: colors.navySoft, fg: colors.navy },
  orange: { bg: colors.orangeSoft, fg: colors.orangeDeep },
  red: { bg: colors.redBg, fg: colors.red },
};

export function Badge({ label, tone = 'green' }: BadgeProps) {
  const p = badgePalette[tone];
  return (
    <View style={[styles.badge, { backgroundColor: p.bg }]}>
      <Text style={[styles.badgeText, { color: p.fg }]}>{label}</Text>
    </View>
  );
}

type SegmentedProps<T extends string> = {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  wide?: boolean;
  height?: number;
};

export function Segmented<T extends string>({ options, value, onChange, wide, height = 36 }: SegmentedProps<T>) {
  return (
    <View style={[styles.segmented, wide && { alignSelf: 'stretch' }]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.seg,
              wide && { flex: 1 },
              { height },
              active && styles.segActive,
            ]}
          >
            <Text style={[styles.segText, active && { color: colors.navy }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function PageHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.pageHead}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.pageTitle}>{title}</Text>
        {sub ? <Text style={styles.pageSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  btnText: {
    fontFamily: font.bold,
    letterSpacing: 0.1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontFamily: font.semibold,
  },
  badge: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  badgeText: {
    fontSize: 11.5,
    fontFamily: font.bold,
    letterSpacing: 0.2,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 12,
    backgroundColor: '#e4e8ee',
    borderWidth: 1,
    borderColor: '#dbe0e8',
  },
  seg: {
    paddingHorizontal: 16,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segActive: {
    backgroundColor: colors.surface,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(16,37,66,0.14)' } as object,
      default: { elevation: 1, shadowColor: colors.navyDeep, shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  segText: {
    fontSize: 14,
    fontFamily: font.bold,
    color: colors.ink2,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: font.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: -4,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
  },
  pageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: font.extrabold,
    letterSpacing: -0.6,
    lineHeight: 28,
    color: colors.ink,
  },
  pageSub: {
    fontSize: 13,
    color: colors.ink3,
    fontFamily: font.regular,
    marginTop: 1,
  },
});
