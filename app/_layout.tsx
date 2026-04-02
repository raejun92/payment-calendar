import { useEffect, useCallback } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { user, group, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === 'auth';
    const inGroupSetup = segments[0] === 'group';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/auth/login');
      }
    } else if (!group) {
      if (!inGroupSetup) {
        router.replace('/group/setup');
      }
    } else {
      if (inAuthGroup || inGroupSetup) {
        router.replace('/');
      }
    }
  }, [user, group, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" options={{ headerShown: true, title: '회원가입', headerBackTitle: '뒤로' }} />
      <Stack.Screen name="group/setup" options={{ headerShown: true, title: '그룹 설정', headerBackTitle: '뒤로' }} />
    </Stack>
  );
}
