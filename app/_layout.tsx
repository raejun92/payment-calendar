import { useEffect } from 'react';
import { Alert } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { handleDeepLink } from '@/services/deep-link';

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

  // URL Scheme 수신 처리
  useEffect(() => {
    if (loading || !user || !group) return;

    const handleUrl = async (event: { url: string }) => {
      // paymentcalendar://add 만 처리, 나머지는 Expo Router에 위임
      if (!event.url.startsWith('paymentcalendar://add')) return;

      try {
        const success = await handleDeepLink(event.url, user.uid, group.id);
        if (success) {
          // 라우팅 되지 않도록 달력 화면으로 돌아감
          router.replace('/');
          Alert.alert('저장 완료', '결제 내역이 추가되었습니다.');
        }
      } catch {
        // validation 실패 시 조용히 무시
      }
    };

    // 앱이 이미 실행 중일 때 URL 수신
    const subscription = Linking.addEventListener('url', handleUrl);

    // 앱이 URL로 열렸을 때 (콜드 스타트)
    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith('paymentcalendar://add')) handleUrl({ url });
    });

    return () => subscription.remove();
  }, [user, group, loading]);

  // 인증 상태에 따른 화면 분기
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
