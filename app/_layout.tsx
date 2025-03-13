import React, { useCallback, useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments, ErrorBoundary } from 'expo-router';
import { FirebaseProvider, useFirebase } from '../contexts/FirebaseContext';
import { UserProvider } from '../contexts/UserContext';
import { DataProvider } from '../contexts/DataContext';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../hooks/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Text, View } from 'react-native';

// スプラッシュスクリーンを表示し続ける
SplashScreen.preventAutoHideAsync();

export { ErrorBoundary };

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// 認証状態に基づいてリダイレクトを行うコンポーネント
function AuthStateListener({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebase();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('AuthStateListener: user=', user?.id, 'loading=', loading, 'segments=', segments);
    
    if (loading) return;

    const segmentsJoined = segments.join('/');
    const isLoginScreen = segments[0] === 'login';
    const isTabsRoute = segments[0] === '(tabs)';
    const isDrawerRoute = segments[0] === '(drawer)';
    const isProtectedRoute = isTabsRoute || segments[0] === undefined;
    const isRootPath = segmentsJoined === '' || segments[0] === undefined;

    console.log('Route check: isLoginScreen=', isLoginScreen, 'isProtectedRoute=', isProtectedRoute, 'segments=', segmentsJoined);

    if (!user && (isProtectedRoute || isDrawerRoute)) {
      // 未認証ユーザーが保護されたルートにアクセスした場合、ログイン画面にリダイレクト
      console.log('未認証ユーザーが保護されたルートにアクセスしたため、ログイン画面にリダイレクト');
      router.replace('/login');
    } else if (user && isLoginScreen) {
      // 認証済みユーザーがログイン画面にアクセスした場合、ホーム画面にリダイレクト
      console.log('認証済みユーザーがログイン画面にアクセスしたため、ホーム画面にリダイレクト');
      router.replace('/(drawer)');
    } else if (!user && !isLoginScreen && segments[0] !== undefined) {
      // 未認証ユーザーがログイン画面以外にアクセスした場合、ログイン画面にリダイレクト
      console.log('未認証ユーザーがログイン画面以外にアクセスしたため、ログイン画面にリダイレクト paths:', segmentsJoined);
      router.replace('/login');
    } else if (user && isRootPath) {
      // 認証済みユーザーがルートパスにアクセスした場合、ホーム画面にリダイレクト
      console.log('認証済みユーザーがルートパスにアクセスしたため、ホーム画面にリダイレクト');
      router.replace('/(drawer)');
    } else if (user && isTabsRoute) {
      // 認証済みユーザーがタブルートにアクセスした場合、ホーム画面にリダイレクト
      console.log('認証済みユーザーがタブルートにアクセスしたため、ホーム画面にリダイレクト');
      router.replace('/(drawer)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FirebaseProvider>
          <UserProvider>
            <DataProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <AuthStateListener>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  </Stack>
                </AuthStateListener>
              </ThemeProvider>
            </DataProvider>
          </UserProvider>
        </FirebaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}