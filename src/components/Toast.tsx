import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow } from '../theme';

export function Toast({ message }: { message: string | null }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: message ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [message, opacity]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.host}>
      <Animated.View style={[styles.toast, { opacity }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 92,
    alignItems: 'center',
    zIndex: 70,
  },
  toast: {
    maxWidth: 320,
    marginHorizontal: 20,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: colors.navyDeep,
    ...shadow.float,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontFamily: font.semibold,
    lineHeight: 18,
    textAlign: 'center',
  },
});
