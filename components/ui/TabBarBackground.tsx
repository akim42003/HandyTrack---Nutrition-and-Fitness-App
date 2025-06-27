import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/src/styles/colors';

export default function TabBarBackground() {
  return <View style={styles.background} />;
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.surface.level2,
  },
});