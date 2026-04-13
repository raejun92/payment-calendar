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
      if (!event.url.startsWith('paymentcalendar://add') && !event.url.startsWith('paymentcalendar://cancel')) return;

      // Expo Router가 라우팅하기 전에 즉시 달력으로 이동
      router.replace('/');

      try {
        const result = await handleDeepLink(event.url, user.uid, group.id);

        switch (result.type) {
          case 'added':
            Alert.alert('저장 완료', '결제 내역이 추가되었습니다.');
            break;
          case 'deleted':
            Alert.alert('취소 완료', '결제 내역이 삭제되었습니다.');
            break;
          case 'multiple':
            Alert.alert('확인 필요', '여러 건이 매칭됩니다. 수동으로 삭제해주세요.');
            break;
          case 'not_found':
            Alert.alert('매칭 실패', '매칭되는 결제를 찾을 수 없습니다.');
            break;
        }
      } catch {
        // 처리 실패 시 조용히 무시
      }
    };

    // 앱이 이미 실행 중일 때 URL 수신
    const subscription = Linking.addEventListener('url', handleUrl);

    // 앱이 URL로 열렸을 때 (콜드 스타트)
    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith('paymentcalendar://')) handleUrl({ url });
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
