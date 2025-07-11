import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useState, useEffect } from 'react';

// Removed useColorScheme - forcing dark mode permanently
import { UserProfile } from '../src/types';
import { getUserProfile } from '../src/utils/storage';
import { ProfileSetup } from '../src/screens/ProfileSetup';
import { AnimatedSplashScreen } from '../src/components/AnimatedSplashScreen';

export default function RootLayout() {
  // Force dark mode permanently
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      console.log('Layout: Checking for existing user profile...');
      const profile = await getUserProfile();
      console.log('Layout: Retrieved profile:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error checking user profile:', error);
    } finally {
      setProfileChecked(true);
    }
  };

  const handleProfileComplete = (profile: UserProfile) => {
    console.log('Layout: Profile setup completed, received profile:', profile);
    setUserProfile(profile);
  };

  if (!loaded || !profileChecked) {
    return <AnimatedSplashScreen />;
  }

  if (!userProfile) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
