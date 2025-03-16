// app/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl, Dimensions, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Card, Searchbar, Button, Chip, useTheme, ActivityIndicator, FAB, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import { StatusBar } from 'expo-status-bar';
import MusicFAB from '../../components/MusicFAB';
import { useNavigation } from '@react-navigation/native';
import ChannelCard from '../../components/ChannelCard';
import MusicWaveAnimation from '../../components/MusicWaveAnimation';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import { useSideMenu } from '../../contexts/SideMenuContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  withDelay,
} from 'react-native-reanimated';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs, where, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Drawer } from 'expo-router/drawer';
import SideMenu from '../../components/SideMenu';

// チャンネルデータ（楽器カテゴリーごと）
const CHANNELS_BY_CATEGORY = {
  flute: [
    { id: 'flute-beginners', name: '初心者質問', icon: 'help-circle', description: 'フルート初心者のための質問コーナー', members: 1250, unreadCount: 5, tags: ['初心者', '質問', 'フルート'] },
    { id: 'flute-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'フルートテクニックの共有と議論', members: 980, unreadCount: 0, tags: ['テクニック', '演奏', 'フルート'] },
    { id: 'flute-repertoire', name: 'レパートリー', icon: 'musical-notes', description: 'フルート曲の演奏と解釈について', members: 890, unreadCount: 3, tags: ['レパートリー', '楽譜', 'フルート'] },
    { id: 'flute-gear', name: '機材相談', icon: 'hardware-chip', description: 'フルートや関連機材について', members: 760, unreadCount: 2, tags: ['機材', '楽器', 'フルート'] },
  ],
  clarinet: [
    { id: 'clarinet-beginners', name: '初心者質問', icon: 'help-circle', description: 'クラリネット初心者のための質問コーナー', members: 850, unreadCount: 2, tags: ['初心者', '質問', 'クラリネット'] },
    { id: 'clarinet-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'クラリネットテクニックの共有と議論', members: 720, unreadCount: 0, tags: ['テクニック', '演奏', 'クラリネット'] },
    { id: 'clarinet-repertoire', name: 'レパートリー', icon: 'musical-notes', description: 'クラリネット曲の演奏と解釈について', members: 680, unreadCount: 1, tags: ['レパートリー', '楽譜', 'クラリネット'] },
  ],
  oboe: [
    { id: 'oboe-beginners', name: '初心者質問', icon: 'help-circle', description: 'オーボエ初心者のための質問コーナー', members: 650, unreadCount: 3 },
    { id: 'oboe-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'オーボエテクニックの共有と議論', members: 580, unreadCount: 0 },
    { id: 'oboe-reeds', name: 'リード作り', icon: 'construct', description: 'オーボエのリード製作について', members: 620, unreadCount: 2 },
  ],
  fagotto: [
    { id: 'fagotto-beginners', name: '初心者質問', icon: 'help-circle', description: 'ファゴット初心者のための質問コーナー', members: 520, unreadCount: 1 },
    { id: 'fagotto-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'ファゴットテクニックの共有と議論', members: 480, unreadCount: 0 },
    { id: 'fagotto-reeds', name: 'リード作り', icon: 'construct', description: 'ファゴットのリード製作について', members: 510, unreadCount: 2 },
  ],
  saxophone: [
    { id: 'saxophone-beginners', name: '初心者質問', icon: 'help-circle', description: 'サクソフォン初心者のための質問コーナー', members: 950, unreadCount: 4 },
    { id: 'saxophone-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'サクソフォンテクニックの共有と議論', members: 880, unreadCount: 0 },
    { id: 'saxophone-jazz', name: 'ジャズ演奏', icon: 'musical-notes', description: 'ジャズサクソフォンについて', members: 920, unreadCount: 3 },
    { id: 'saxophone-gear', name: '機材相談', icon: 'hardware-chip', description: 'サクソフォンや関連機材について', members: 780, unreadCount: 1 },
  ],
  horn: [
    { id: 'horn-beginners', name: '初心者質問', icon: 'help-circle', description: 'ホルン初心者のための質問コーナー', members: 680, unreadCount: 2 },
    { id: 'horn-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'ホルンテクニックの共有と議論', members: 620, unreadCount: 0 },
    { id: 'horn-repertoire', name: 'レパートリー', icon: 'musical-notes', description: 'ホルン曲の演奏と解釈について', members: 590, unreadCount: 1 },
  ],
  euphonium: [
    { id: 'euphonium-beginners', name: '初心者質問', icon: 'help-circle', description: 'ユーフォニアム初心者のための質問コーナー', members: 580, unreadCount: 2 },
    { id: 'euphonium-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'ユーフォニアムテクニックの共有と議論', members: 520, unreadCount: 0 },
    { id: 'euphonium-repertoire', name: 'レパートリー', icon: 'musical-notes', description: 'ユーフォニアム曲の演奏と解釈について', members: 490, unreadCount: 1 },
  ],
  trumpet: [
    { id: 'trumpet-beginners', name: '初心者質問', icon: 'help-circle', description: 'トランペット初心者のための質問コーナー', members: 920, unreadCount: 3 },
    { id: 'trumpet-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'トランペットテクニックの共有と議論', members: 850, unreadCount: 0 },
    { id: 'trumpet-jazz', name: 'ジャズ演奏', icon: 'musical-notes', description: 'ジャズトランペットについて', members: 880, unreadCount: 2 },
    { id: 'trumpet-gear', name: '機材相談', icon: 'hardware-chip', description: 'トランペットや関連機材について', members: 750, unreadCount: 1 },
  ],
  trombone: [
    { id: 'trombone-beginners', name: '初心者質問', icon: 'help-circle', description: 'トロンボーン初心者のための質問コーナー', members: 780, unreadCount: 3 },
    { id: 'trombone-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'トロンボーンテクニックの共有と議論', members: 720, unreadCount: 0 },
    { id: 'trombone-jazz', name: 'ジャズ演奏', icon: 'musical-notes', description: 'ジャズトロンボーンについて', members: 750, unreadCount: 2 },
  ],
  tuba: [
    { id: 'tuba-beginners', name: '初心者質問', icon: 'help-circle', description: 'チューバ初心者のための質問コーナー', members: 580, unreadCount: 2 },
    { id: 'tuba-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'チューバテクニックの共有と議論', members: 520, unreadCount: 0 },
    { id: 'tuba-repertoire', name: 'レパートリー', icon: 'musical-notes', description: 'チューバ曲の演奏と解釈について', members: 490, unreadCount: 1 },
  ],
  percussion: [
    { id: 'percussion-beginners', name: '初心者質問', icon: 'help-circle', description: 'パーカッション初心者のための質問コーナー', members: 850, unreadCount: 3 },
    { id: 'percussion-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'パーカッションテクニックの共有と議論', members: 780, unreadCount: 0 },
    { id: 'percussion-mallets', name: 'マレット楽器', icon: 'musical-notes', description: 'マリンバ、ビブラフォンなどについて', members: 720, unreadCount: 2 },
    { id: 'percussion-drums', name: 'ドラム', icon: 'musical-notes', description: 'ドラムセットについて', members: 820, unreadCount: 1 },
  ],
};

// HOMEページのタグリスト
const DEFAULT_TAGS = [
  { id: 'beginner', name: '初心者', color: '#7F3DFF', count: 12 },
  { id: 'technique', name: 'テクニック', color: '#FF3D77', count: 8 },
  { id: 'repertoire', name: 'レパートリー', color: '#3D7FFF', count: 10 },
  { id: 'gear', name: '機材', color: '#FF9F3D', count: 7 },
  { id: 'practice', name: '練習法', color: '#3DFFCF', count: 9 },
  { id: 'concert', name: '演奏会', color: '#FF3D3D', count: 5 },
  { id: 'ensemble', name: 'アンサンブル', color: '#B03DFF', count: 6 },
  { id: 'recording', name: '録音', color: '#FFD93D', count: 4 },
  { id: 'composition', name: '作曲', color: '#3DFFB0', count: 3 },
  { id: 'theory', name: '音楽理論', color: '#FF6B3D', count: 5 },
];

// 拡張されたチャンネル型定義
interface ExtendedChannel {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  threads: any[];
  threadCount?: number;
  memberCount?: number;
  icon?: string;
  unreadCount?: number;
  tags?: string[];
  imageUrl?: string;
}

// タグの型定義
interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

// HOMEページのカテゴリー別カラーテーマ
const CATEGORY_THEMES = {
  'flute': 'classical',
  'trumpet': 'jazz',
  'percussion': 'rock',
  'saxophone': 'jazz',
  'default': 'electronic',
} as const;

export default function DrawerLayout() {
  const { isMenuOpen, closeMenu } = useSideMenu();

  return (
    <View style={styles.container}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerType: 'slide',
          drawerStyle: {
            width: '85%',
            backgroundColor: 'transparent',
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'ホーム',
            title: 'ホーム',
          }}
        />
        <Drawer.Screen
          name="channels"
          options={{
            drawerLabel: 'チャンネル',
            title: 'チャンネル',
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: 'プロフィール',
            title: 'プロフィール',
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: '設定',
            title: '設定',
          }}
        />
      </Drawer>
      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});