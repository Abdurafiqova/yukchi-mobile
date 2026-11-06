import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius } from '../theme';
import { Icon } from './Icon';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function FloatingField({
  label,
  value,
  onChangeText,
  error,
  multiline,
  keyboardType,
  autoCapitalize,
  maxLength,
  style,
  testID,
}: FieldProps) {
  const [focused, setFocused] = React.useState(false);
  const float = useRef(new Animated.Value(value ? 1 : 0)).current;
  const raised = focused || value.length > 0;

  useEffect(() => {
    Animated.timing(float, {
      toValue: raised ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [raised, float]);

  return (
    <View style={style}>
      <View
        style={[
          styles.field,
          multiline && { height: 96 },
          focused && styles.fieldFocused,
          error ? styles.fieldInvalid : null,
        ]}
      >
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            { fontFamily: font.regular },
          ]}
          placeholderTextColor={colors.ink3}
        />
        <Animated.Text
          pointerEvents="none"
          style={[
            styles.label,
            error && { color: colors.red },
            {
              color: focused ? colors.navy : colors.ink3,
              transform: [
                { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                { scale: float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.76] }) },
              ],
            },
          ]}
        >
          {label}
        </Animated.Text>
      </View>
      {error ? (
        <View style={styles.errRow}>
          <Icon name="alert" size={14} color={colors.red} strokeWidth={2} />
          <Text style={styles.errText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

type SelectProps = {
  label?: string;
  value: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function SelectField({ label, value, onPress, style, testID }: SelectProps) {
  return (
    <View style={style}>
      {label ? <Text style={styles.cap}>{label}</Text> : null}
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.select, pressed && { borderColor: colors.navy }]}
      >
        <Text style={styles.selectText}>{value}</Text>
        <Icon name="chevronDown" size={18} color={colors.ink3} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

export function DisplayField({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <View>
      <Text style={styles.cap}>{label}</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.select, pressed && { borderColor: colors.navy }]}
      >
        <Text style={styles.selectText}>{value}</Text>
        <Icon name="chevronDown" size={18} color={colors.ink3} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  fieldFocused: {
    borderColor: colors.navy,
  },
  fieldInvalid: {
    borderColor: colors.red,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 21,
    paddingBottom: 7,
    fontSize: 16,
    color: colors.ink,
  },
  inputMultiline: {
    paddingTop: 24,
    paddingBottom: 10,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  label: {
    position: 'absolute',
    left: 15,
    top: 18,
    fontSize: 15,
  },
  errRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  errText: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.red,
    flexShrink: 1,
  },
  cap: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: colors.ink3,
    marginBottom: 6,
  },
  select: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    paddingLeft: 14,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectText: {
    fontSize: 15,
    fontFamily: font.semibold,
    color: colors.ink,
    flexShrink: 1,
  },
});
