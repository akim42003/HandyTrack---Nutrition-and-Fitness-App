import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
// Removed useColorScheme and Colors - forcing dark mode permanently
import { colors } from '@/src/styles/colors';

export default function TabLayout() {
  // Force dark mode permanently

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.text.tertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: colors.surface.level2,
          borderTopWidth: 1,
          borderTopColor: colors.border.secondary,
          height: Platform.select({
            ios: 83, // Standard iOS tab bar height with safe area
            android: 65,
            default: 65,
          }),
          paddingBottom: Platform.select({
            ios: 20, // Safe area padding for iOS
            android: 10,
            default: 10,
          }),
          paddingTop: 8,
          position: 'relative', // Remove absolute positioning
          ...colors.shadows.small,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Food',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="fork.knife" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exercise"
        options={{
          title: 'Exercise',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dumbbell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
