import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, PanResponder, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';
import SideMenu from '../../components/SideMenu';
import { INSTRUMENT_COLORS } from '../../constants/Colors';
import { SideMenuProvider, useSideMenu } from '../../contexts/SideMenuContext';

// 楽器カテゴリーの定義
const INSTRUMENT_CATEGORIES = [
  { id: 'flute', name: 'フルート', color: INSTRUMENT_COLORS.flute, icon: 'musical-note' },
  { id: 'clarinet', name: 'クラリネット', color: INSTRUMENT_COLORS.clarinet, icon: 'musical-notes' },
  { id: 'oboe', name: 'オーボエ', color: INSTRUMENT_COLORS.oboe, icon: 'musical-note' },
  { id: 'fagotto', name: 'ファゴット', color: INSTRUMENT_COLORS.fagotto, icon: 'musical-notes' },
  { id: 'saxophone', name: 'サックス', color: INSTRUMENT_COLORS.saxophone, icon: 'musical-note' },
  { id: 'horn', name: 'ホルン', color: INSTRUMENT_COLORS.horn, icon: 'musical-notes' },
  { id: 'euphonium', name: 'ユーフォニアム', color: INSTRUMENT_COLORS.euphonium, icon: 'musical-note' },
  { id: 'trumpet', name: 'トランペット', color: INSTRUMENT_COLORS.trumpet, icon: 'musical-notes' },
  { id: 'trombone', name: 'トロンボーン', color: INSTRUMENT_COLORS.trombone, icon: 'musical-note' },
  { id: 'tuba', name: 'チューバ', color: INSTRUMENT_COLORS.tuba, icon: 'musical-notes' },
  { id: 'percussion', name: 'パーカッション', color: INSTRUMENT_COLORS.percussion, icon: 'musical-note' },
];

// 楽器カテゴリーの型定義
interface InstrumentCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

function AppLayoutContent() {
  const { userState } = useUser();
  const { selectedCategories } = userState;
  const { width: screenWidth } = Dimensions.get('window');
  
  // サイドメニューコンテキストからフックを使用
  const { 
    isMenuOpen, 
    isMenuExpanded, 
    openMenu, 
    closeMenu, 
    setMenuExpanded 
  } = useSideMenu();
  
  // 選択されている楽器カテゴリー（最初の1つを使用）
  const activeCategory = selectedCategories.length > 0 ? selectedCategories[0] : 'flute';
  
  // 現在の楽器カテゴリー情報
  const currentInstrument = INSTRUMENT_CATEGORIES.find((cat: InstrumentCategory) => cat.id === activeCategory);

  // スワイプジェスチャーの設定
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // メニューが閉じているか、部分的に開いている場合のみスワイプを検知
        if (!isMenuOpen || (isMenuOpen && !isMenuExpanded)) {
          // 右スワイプのみ検知
          return gestureState.dx > 5 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx);
        }
        return false;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 20 && !isMenuOpen) {
          // 右スワイプでメニューを開く
          openMenu();
        } else if (gestureState.dx > 50 && isMenuOpen && !isMenuExpanded) {
          // さらに右スワイプでメニューを展開
          setMenuExpanded(true);
        }
      },
      onPanResponderRelease: () => {
        // スワイプ終了時の処理
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* サイドメニュー */}
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={closeMenu} 
        isExpanded={isMenuExpanded}
        onExpandChange={setMenuExpanded}
      />
      
      {/* オーバーレイ（メニューが開いているときに表示） */}
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      
      {/* メインコンテンツ */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
          animationDuration: 300,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="category/index" 
          options={{ 
            headerShown: false
          }} 
        />
      </Stack>
    </View>
  );
}

// メインのAppLayoutコンポーネント
export default function AppLayout() {
  return (
    <SideMenuProvider>
      <AppLayoutContent />
    </SideMenuProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    opacity: 0.5,
    zIndex: 5,
  },
  headerContainer: {
    backgroundColor: '#1A1A1A',
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  menuButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 