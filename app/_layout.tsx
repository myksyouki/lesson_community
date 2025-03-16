import React, { useCallback, useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments, ErrorBoundary } from 'expo-router';
import { FirebaseProvider, useFirebase } from '@/contexts/FirebaseContext';
import { UserProvider } from '@/contexts/UserContext';
import { DataProvider } from '@/contexts/DataContext';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../hooks/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Text, View, Dimensions } from 'react-native';
import Animated, { 
  Easing,
  SlideInRight, 
  SlideOutLeft, 
  FadeIn, 
  FadeOut,
  interpolate, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming
} from 'react-native-reanimated';
import { SideMenuProvider, useSideMenu } from '../contexts/SideMenuContext';
import SideMenu from '../components/SideMenu';

// スプラッシュスクリーンを表示し続ける
SplashScreen.preventAutoHideAsync();

export { ErrorBoundary };

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// カードインターポレーターのパラメータ型を定義
interface CardInterpolationProps {
  current: { progress: { interpolate: (params: { inputRange: number[], outputRange: any[] }) => any } };
  next?: { progress: { interpolate: (params: { inputRange: number[], outputRange: any[] }) => any } };
  layouts: { screen: { width: number, height: number } };
}

// カスタムトランジションアニメーション
const customTransition = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 350,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }: CardInterpolationProps) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
};

// モーダル用のトランジション
const modalTransition = {
  gestureEnabled: true,
  gestureDirection: 'vertical',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 400,
        easing: Easing.bezier(0.35, 0.9, 0.1, 1),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.bezier(0.35, 0.9, 0.1, 1),
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: CardInterpolationProps) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.6],
        }),
      },
    };
  },
};

// 認証状態に基づいてリダイレクトを行うコンポーネント
function AuthStateListener({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebase();
  const segments = useSegments();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return;
    
    // すでにリダイレクト処理を行ったかどうかをチェック
    if (hasRedirectedRef.current) return;
    
    // 現在のルート情報を取得
    const segmentsJoined = segments.join('/');
    const isLoginScreen = segments[0] === 'login';
    const isTabsRoute = segments[0] === '(tabs)';
    const isDrawerRoute = segments[0] === '(drawer)';
    const isProtectedRoute = isTabsRoute || isDrawerRoute || segments[0] === undefined;
    const isRootPath = segmentsJoined === '' || segments[0] === undefined;
    
    console.log('[Auth] 状態:', user?.id ? '認証済み' : '未認証', '現在のルート:', segmentsJoined);

    // リダイレクト処理
    let shouldRedirectToLogin = false;
    let shouldRedirectToHome = false;
    
    if (!user && isProtectedRoute) {
      // 未認証ユーザーが保護されたルートにアクセスした場合
      console.log('[Auth] 未認証ユーザーが保護されたルート→ログイン画面へ');
      shouldRedirectToLogin = true;
    } else if (user && isLoginScreen) {
      // 認証済みユーザーがログイン画面にアクセスした場合
      console.log('[Auth] 認証済みユーザーがログイン画面→ホーム画面へ');
      shouldRedirectToHome = true;
    } else if (!user && !isLoginScreen && segments[0] !== 'onboarding' && segments[0] !== 'instrument-selector') {
      // 未認証ユーザーがログイン画面以外のルートにアクセスした場合（一部例外あり）
      console.log('[Auth] 未認証ユーザーが保護されていないルート→ログイン画面へ');
      shouldRedirectToLogin = true;
    } else if (user && isRootPath) {
      // 認証済みユーザーがルートパスにアクセスした場合
      console.log('[Auth] 認証済みユーザーがルートパス→ホーム画面へ');
      shouldRedirectToHome = true;
    } else if (user && isTabsRoute) {
      // 認証済みユーザーがタブルートにアクセスした場合
      console.log('[Auth] 認証済みユーザーがタブルート→ホーム画面へ');
      shouldRedirectToHome = true;
    }
    
    // リダイレクトが必要な場合のみ実行
    if (shouldRedirectToLogin) {
      hasRedirectedRef.current = true;
      router.replace('/login');
    } else if (shouldRedirectToHome) {
      hasRedirectedRef.current = true;
      router.replace('/');
    }
  }, [user, loading]); // segmentsは依存配列から除外し、認証状態の変更時のみ実行

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

  // React Native Paperのテーマ設定
  const paperTheme = colorScheme === 'dark' 
    ? { 
        ...require('react-native-paper').MD3DarkTheme,
        colors: {
          ...require('react-native-paper').MD3DarkTheme.colors,
          primary: '#7F3DFF',
          secondary: '#3D7FFF',
        }
      } 
    : { 
        ...require('react-native-paper').MD3LightTheme,
        colors: {
          ...require('react-native-paper').MD3LightTheme.colors,
          primary: '#7F3DFF',
          secondary: '#3D7FFF',
        }
      };

  // カスタムアニメーション用のコンポーネント
  const AnimatedStack = Animated.createAnimatedComponent(Stack);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <UserProvider>
            <FirebaseProvider>
              <DataProvider>
                <PaperProvider theme={paperTheme}>
                  <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                    <SideMenuProvider>
                      <SideMenuWithContext />
                      <AuthStateListener>
                        <Stack 
                          screenOptions={{ 
                            headerShown: false,
                            animation: 'fade_from_bottom',
                            animationDuration: 300,
                            gestureEnabled: true,
                          }}
                        >
                          <Stack.Screen 
                            name="login" 
                            options={{ 
                              headerShown: false,
                              animation: 'fade',
                              animationDuration: 400,
                            }} 
                          />
                          <Stack.Screen 
                            name="(tabs)" 
                            options={{ 
                              headerShown: false,
                              animation: 'slide_from_right',
                              animationDuration: 350,
                            }} 
                          />
                          <Stack.Screen 
                            name="(drawer)" 
                            options={{ 
                              headerShown: false,
                              animation: 'slide_from_right',
                              animationDuration: 350,
                            }} 
                          />
                          <Stack.Screen 
                            name="modal" 
                            options={{ 
                              presentation: 'modal',
                              animation: 'slide_from_bottom',
                              animationDuration: 400,
                            }} 
                          />
                          <Stack.Screen 
                            name="onboarding" 
                            options={{ 
                              animation: 'fade',
                              animationDuration: 500,
                            }} 
                          />
                          <Stack.Screen 
                            name="instrument-selector" 
                            options={{ 
                              animation: 'fade_from_bottom', 
                              animationDuration: 450,
                            }} 
                          />
                        </Stack>
                      </AuthStateListener>
                    </SideMenuProvider>
                  </NavigationThemeProvider>
                </PaperProvider>
              </DataProvider>
            </FirebaseProvider>
          </UserProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// SideMenuコンポーネントをSideMenuContextと連携させるためのラッパーコンポーネント
function SideMenuWithContext() {
  const { isMenuOpen, closeMenu, isMenuExpanded, setMenuExpanded } = useSideMenu();
  
  return (
    <SideMenu 
      isOpen={isMenuOpen} 
      onClose={closeMenu}
      isExpanded={isMenuExpanded}
      onExpandChange={setMenuExpanded}
    />
  );
}