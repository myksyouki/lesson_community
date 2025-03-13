import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { UserProvider } from '../contexts/UserContext';
import { DataProvider } from '../contexts/DataContext';
import { Stack, usePathname, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle, LinearGradient as SvgLinearGradient, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

// スプラッシュスクリーンを表示し続ける
SplashScreen.preventAutoHideAsync();

// 楽器カテゴリーごとのテーマカラー
const INSTRUMENT_COLORS: Record<string, string> = {
  'flute': '#7F3DFF',
  'clarinet': '#FF3D77',
  'oboe': '#3D7FFF',
  'fagotto': '#FF9F3D',
  'saxophone': '#3DFFCF',
  'horn': '#FF3D3D',
  'euphonium': '#B03DFF',
  'trumpet': '#FFD93D',
  'trombone': '#3DFFB0',
  'tuba': '#FF6B3D',
  'percussion': '#3DB0FF',
  'default': '#7F3DFF',
};

// ヘッダーのハンバーガーメニューボタン
function HeaderMenuButton() {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={{
        width: 50,  // 幅を大きく
        height: 50, // 高さを大きく
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
      }}
    >
      <Ionicons name="menu" size={32} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

// 背景グラデーションコンポーネント
function BackgroundGradient() {
  const { userState } = useUser();
  const selectedCategory = userState?.selectedCategories?.[0] || 'default';
  const themeColor = INSTRUMENT_COLORS[selectedCategory] || INSTRUMENT_COLORS.default;
  
  // 色の透明度を調整（より視認しやすく）
  const colorWithOpacity = (color: string, opacity: number) => {
    return color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
  };
  
  return (
    <View style={styles.backgroundGradient}>
      <Svg width="100%" height="100%" style={styles.gradientSvg}>
        <Defs>
          <SvgLinearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colorWithOpacity(themeColor, 0.25)} />
            <Stop offset="100%" stopColor="#121212" />
          </SvgLinearGradient>
          
          <SvgLinearGradient id="bottomGradient" x1="100%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor={colorWithOpacity(themeColor, 0.2)} />
            <Stop offset="100%" stopColor="#121212" />
          </SvgLinearGradient>
          
          <RadialGradient id="centerGlow" cx="50%" cy="30%" r="70%" fx="50%" fy="30%">
            <Stop offset="0%" stopColor={colorWithOpacity(themeColor, 0.15)} />
            <Stop offset="100%" stopColor="#12121200" />
          </RadialGradient>
        </Defs>
        
        {/* 背景の基本色 */}
        <Rect x="0" y="0" width="100%" height="100%" fill="#121212" />
        
        {/* 上部のグラデーション */}
        <Rect x="0" y="0" width="100%" height="40%" fill="url(#topGradient)" />
        
        {/* 下部のグラデーション */}
        <Rect x="0" y="60%" width="100%" height="40%" fill="url(#bottomGradient)" />
        
        {/* 中央の光彩 */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#centerGlow)" />
        
        {/* 波のような効果 - 上部 */}
        <Path
          d="M0,100 C150,80 300,120 450,100 C600,80 750,120 900,100 L900,0 L0,0 Z"
          fill={colorWithOpacity(themeColor, 0.15)}
        />
        
        {/* 波のような効果 - 中部 */}
        <Path
          d="M0,300 C150,280 300,320 450,300 C600,280 750,320 900,300 L900,200 L0,200 Z"
          fill={colorWithOpacity(themeColor, 0.12)}
        />
        
        {/* 波のような効果 - 下部 */}
        <Path
          d="M0,500 C150,480 300,520 450,500 C600,480 750,520 900,500 L900,400 L0,400 Z"
          fill={colorWithOpacity(themeColor, 0.18)}
        />
        
        {/* 波のような効果 - 最下部 */}
        <Path
          d="M0,700 C150,680 300,720 450,700 C600,680 750,720 900,700 L900,600 L0,600 Z"
          fill={colorWithOpacity(themeColor, 0.15)}
        />
      </Svg>
    </View>
  );
}

// ナビゲーション構造を視覚的に表示するコンポーネント
function NavigationBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const [navStructure, setNavStructure] = useState<{
    type: 'channel' | 'thread' | 'chat' | 'home';
    channelName?: string;
    threadName?: string;
    channelId?: string;
    threadId?: string;
  }>({ type: 'home' });

  useEffect(() => {
    // AsyncStorageからナビゲーション情報を取得
    const getNavInfo = async () => {
      try {
        const storedInfo = await AsyncStorage.getItem('currentNavInfo');
        if (storedInfo) {
          const parsedInfo = JSON.parse(storedInfo);
          setNavStructure({
            type: parsedInfo.type,
            channelName: parsedInfo.channelName,
            threadName: parsedInfo.threadTitle,
            channelId: parsedInfo.channelId,
            threadId: parsedInfo.threadId
          });
          return;
        }
      } catch (e) {
        console.error('Failed to retrieve navigation info:', e);
      }
      
      // AsyncStorageから情報が取得できない場合はパスから推測
      if (pathname.includes('/threads/') && pathname.split('/').length > 3) {
        // スレッド画面
        const parts = pathname.split('/');
        setNavStructure({
          type: 'thread',
          channelId: parts[2],
          threadId: parts[3]
        });
      } else if (pathname.includes('/channels/')) {
        // チャンネル画面
        const parts = pathname.split('/');
        setNavStructure({
          type: 'channel',
          channelId: parts[2]
        });
      } else if (pathname.includes('/chat/')) {
        // チャット画面
        setNavStructure({
          type: 'chat'
        });
      } else {
        // ホーム画面
        setNavStructure({ type: 'home' });
      }
    };

    getNavInfo();
  }, [pathname]);

  // ホーム画面では表示しない
  if (navStructure.type === 'home') {
    return null;
  }

  return (
    <View style={styles.breadcrumbContainer}>
      <TouchableOpacity 
        style={styles.breadcrumbItem}
        onPress={() => router.push('/')}
      >
        <Ionicons name="home" size={16} color="#FFFFFF" />
        <Text style={styles.breadcrumbText}>ホーム</Text>
      </TouchableOpacity>
      
      {navStructure.type === 'channel' && (
        <>
          <Text style={styles.breadcrumbSeparator}>{'>'}</Text>
          <View style={styles.breadcrumbItem}>
            <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
            <Text style={styles.breadcrumbText}>
              {navStructure.channelName || 'チャンネル'}
            </Text>
          </View>
        </>
      )}
      
      {navStructure.type === 'thread' && (
        <>
          <Text style={styles.breadcrumbSeparator}>{'>'}</Text>
          <TouchableOpacity 
            style={styles.breadcrumbItem}
            onPress={() => navStructure.channelId ? 
              router.push(`/channels/${navStructure.channelId}`) : 
              router.back()
            }
          >
            <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
            <Text style={styles.breadcrumbText}>
              {navStructure.channelName || 'チャンネル'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.breadcrumbSeparator}>{'>'}</Text>
          <View style={styles.breadcrumbItem}>
            <Ionicons name="document-text" size={16} color="#FFFFFF" />
            <Text style={styles.breadcrumbText}>
              {navStructure.threadName || 'スレッド'}
            </Text>
          </View>
        </>
      )}
      
      {navStructure.type === 'chat' && (
        <>
          <Text style={styles.breadcrumbSeparator}>{'>'}</Text>
          <View style={styles.breadcrumbItem}>
            <Ionicons name="chatbox" size={16} color="#FFFFFF" />
            <Text style={styles.breadcrumbText}>チャット</Text>
          </View>
        </>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <DataProvider>
          <PaperProvider>
            <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                <Stack.Screen name="channels/[channelId]" options={{ headerShown: false }} />
                <Stack.Screen name="threads/[channelId]/[threadId]" options={{ headerShown: false }} />
                <Stack.Screen name="threads/create" options={{ headerShown: false }} />
                <Stack.Screen name="instrument-selector" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
              </Stack>
              
              {/* ナビゲーション構造表示 */}
              <NavigationBreadcrumb />
            </GestureHandlerRootView>
          </PaperProvider>
        </DataProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gradientSvg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  breadcrumbContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 30, 46, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(42, 42, 42, 0.5)',
  },
  breadcrumbText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
  },
  breadcrumbSeparator: {
    color: '#AAAAAA',
    marginHorizontal: 4,
    fontSize: 14,
  },
});