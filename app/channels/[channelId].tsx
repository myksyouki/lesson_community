import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated as RNAnimated, Dimensions, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, Card, Chip, FAB, IconButton, useTheme, Button } from 'react-native-paper';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import MusicFAB from '../../components/MusicFAB';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import MusicWaveAnimation from '../../components/MusicWaveAnimation';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import ThreadCard from '../../components/ThreadCard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';

// 画面サイズを取得
const { width, height } = Dimensions.get('window');

// チャンネルデータ
const CHANNELS: Record<string, {
  name: string;
  category: string;
  icon: string;
  color: string;
  tags: string[];
}> = {
  'flute-beginners': { 
    name: '初心者質問', 
    category: 'flute', 
    icon: 'help-circle', 
    color: '#7F3DFF',
    tags: ['初心者', '質問', 'フルート']
  },
  'flute-techniques': { 
    name: '演奏テクニック', 
    category: 'flute', 
    icon: 'hand-left', 
    color: '#7F3DFF',
    tags: ['テクニック', '演奏', 'フルート']
  },
  'flute-repertoire': { 
    name: 'レパートリー', 
    category: 'flute', 
    icon: 'musical-notes', 
    color: '#7F3DFF',
    tags: ['レパートリー', '楽譜', 'フルート']
  },
  'flute-gear': { 
    name: '機材相談', 
    category: 'flute', 
    icon: 'hardware-chip', 
    color: '#7F3DFF',
    tags: ['機材', '楽器', 'フルート']
  },
  'clarinet-beginners': { 
    name: '初心者質問', 
    category: 'clarinet', 
    icon: 'help-circle', 
    color: '#FF3D77',
    tags: ['初心者', '質問', 'クラリネット']
  },
  'clarinet-techniques': { 
    name: '演奏テクニック', 
    category: 'clarinet', 
    icon: 'hand-left', 
    color: '#FF3D77',
    tags: ['テクニック', '演奏', 'クラリネット']
  },
  'clarinet-repertoire': { 
    name: 'レパートリー', 
    category: 'clarinet', 
    icon: 'musical-notes', 
    color: '#FF3D77',
    tags: ['レパートリー', '楽譜', 'クラリネット']
  },
  'oboe-beginners': { 
    name: '初心者質問', 
    category: 'oboe', 
    icon: 'help-circle', 
    color: '#3D7FFF',
    tags: ['初心者', '質問', 'オーボエ']
  },
  'oboe-techniques': { 
    name: '演奏テクニック', 
    category: 'oboe', 
    icon: 'hand-left', 
    color: '#3D7FFF',
    tags: ['テクニック', '演奏', 'オーボエ']
  },
  'oboe-reeds': { 
    name: 'リード作り', 
    category: 'oboe', 
    icon: 'construct', 
    color: '#3D7FFF',
    tags: ['リード', '工作', 'オーボエ']
  },
  'saxophone-beginners': { 
    name: '初心者質問', 
    category: 'saxophone', 
    icon: 'help-circle', 
    color: '#3DFFCF',
    tags: ['初心者', '質問', 'サックス']
  },
  'saxophone-techniques': { 
    name: '演奏テクニック', 
    category: 'saxophone', 
    icon: 'hand-left', 
    color: '#3DFFCF',
    tags: ['テクニック', '演奏', 'サックス']
  },
  'saxophone-jazz': { 
    name: 'ジャズ演奏', 
    category: 'saxophone', 
    icon: 'musical-notes', 
    color: '#3DFFCF',
    tags: ['ジャズ', '即興', 'サックス']
  },
  'trumpet-beginners': { 
    name: '初心者質問', 
    category: 'trumpet', 
    icon: 'help-circle', 
    color: '#FFD93D',
    tags: ['初心者', '質問', 'トランペット']
  },
  'trumpet-techniques': { 
    name: '演奏テクニック', 
    category: 'trumpet', 
    icon: 'hand-left', 
    color: '#FFD93D',
    tags: ['テクニック', '演奏', 'トランペット']
  },
  'trumpet-jazz': { 
    name: 'ジャズ演奏', 
    category: 'trumpet', 
    icon: 'musical-notes', 
    color: '#FFD93D',
    tags: ['ジャズ', '即興', 'トランペット']
  },
};

// スレッドデータ（チャンネルごと）
const THREADS_BY_CHANNEL: Record<string, Array<{
  id: string;
  title: string;
  author: string;
  createdAt: string;
  replies: number;
  unread: boolean;
  tags?: string[];
  content?: string;
  likes?: number;
  isLiked?: boolean;
}>> = {
  'flute-beginners': [
    { id: '1', title: 'フルートの持ち方について', author: 'フルート初心者', createdAt: '2時間前', replies: 12, unread: true, tags: ['初心者', '基礎'] },
    { id: '2', title: '息の吹き込み方がわかりません', author: '練習中', createdAt: '5時間前', replies: 8, unread: false, tags: ['基礎', '呼吸法'] },
    { id: '3', title: '初めてのフルート選び', author: 'フルート購入検討中', createdAt: '1日前', replies: 24, unread: true, tags: ['楽器選び', '初心者'] },
    { id: '4', title: 'タンギングのコツを教えてください', author: 'タンギング苦手', createdAt: '2日前', replies: 15, unread: false, tags: ['テクニック', '舌使い'] },
    { id: '5', title: '音が出ません', author: '練習開始1週間', createdAt: '3日前', replies: 19, unread: false, tags: ['トラブル', '初心者'] },
  ],
  // 他のチャンネルのスレッドデータはコード簡略化のため省略
};

// タグデータ
const DEFAULT_TAGS = [
  { id: 'beginner', name: '初心者', color: '#7F3DFF' },
  { id: 'technique', name: 'テクニック', color: '#FF3D77' },
  { id: 'repertoire', name: 'レパートリー', color: '#3D7FFF' },
  { id: 'gear', name: '機材', color: '#FF9F3D' },
  { id: 'jazz', name: 'ジャズ', color: '#3DFFCF' },
  { id: 'practice', name: '練習法', color: '#FF3D3D' },
  { id: 'ensemble', name: 'アンサンブル', color: '#B03DFF' },
  { id: 'recording', name: '録音', color: '#FFD93D' },
];

// 楽器カテゴリーのデータ
const INSTRUMENT_CATEGORIES = [
  { id: 'flute', name: 'フルート', icon: 'musical-notes', color: '#7F3DFF' },
  { id: 'clarinet', name: 'クラリネット', icon: 'musical-notes', color: '#FF3D77' },
  { id: 'oboe', name: 'オーボエ', icon: 'musical-notes', color: '#3D7FFF' },
  { id: 'fagotto', name: 'ファゴット', icon: 'musical-notes', color: '#FF9F3D' },
  { id: 'saxophone', name: 'サクソフォン', icon: 'musical-notes', color: '#3DFFCF' },
  { id: 'horn', name: 'ホルン', icon: 'musical-notes', color: '#FF3D3D' },
  { id: 'euphonium', name: 'ユーフォニアム', icon: 'musical-notes', color: '#B03DFF' },
  { id: 'trumpet', name: 'トランペット', icon: 'musical-notes', color: '#FFD93D' },
  { id: 'trombone', name: 'トロンボーン', icon: 'musical-notes', color: '#3DFFB0' },
  { id: 'tuba', name: 'チューバ', icon: 'musical-notes', color: '#FF6B3D' },
  { id: 'percussion', name: 'パーカッション', icon: 'musical-notes', color: '#3DB0FF' },
];

// チャンネルページのカテゴリー別カラーテーマ
const CATEGORY_THEMES: Record<string, keyof typeof MUSIC_THEMES> = {
  'flute': 'classical',
  'clarinet': 'classical',
  'oboe': 'classical',
  'trumpet': 'jazz',
  'saxophone': 'jazz',
  'percussion': 'rock',
  'default': 'electronic',
};

// 音楽テーマ定義 - より洗練された色彩へ更新
const MUSIC_THEMES = {
  'jazz': {
    primary: ['#2D3047', '#1B1F30'],
    secondary: ['#FFB703', '#FD9E02'],
    accent: '#FFB703',
    patternOpacity: 0.05,
  },
  'classical': {
    primary: ['#2D3047', '#151928'],
    secondary: ['#8A4FFF', '#7F3DFF'],
    accent: '#8A4FFF',
    patternOpacity: 0.04,
  },
  'rock': {
    primary: ['#2A2B2A', '#1A1B1A'],
    secondary: ['#F45866', '#F44E5E'],
    accent: '#F45866',
    patternOpacity: 0.06,
  },
  'electronic': {
    primary: ['#292F36', '#1D2228'],
    secondary: ['#4ECDC4', '#45C1B8'],
    accent: '#4ECDC4',
    patternOpacity: 0.05,
  },
  'default': {
    primary: ['#2D3047', '#1A1B2B'],
    secondary: ['#6C72CB', '#5B60C2'],
    accent: '#6C72CB',
    patternOpacity: 0.04,
  },
} as const;

// テーマを取得する関数
function getCategoryTheme(category: string): keyof typeof MUSIC_THEMES {
  return (CATEGORY_THEMES[category] || 'default');
}

// タグの色を取得する関数
function getTagColor(tagName: string, defaultColor: string): string {
  const foundTag = DEFAULT_TAGS.find(tag => tag.name === tagName);
  return foundTag ? foundTag.color : defaultColor;
}

// 作成日時を整形
function formatCreatedAt(dateStr: string): string {
  if (dateStr.endsWith('前')) return dateStr;
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffMins < 60 * 24) {
      return `${Math.floor(diffMins / 60)}時間前`;
    } else {
      return `${Math.floor(diffMins / (60 * 24))}日前`;
    }
  } catch (e) {
    return dateStr;
  }
}

// 抽象的な音符パターンコンポーネント
function MusicPattern({ color, opacity, style }: { color: string, opacity: number, style?: any }) {
  return (
    <View style={[styles.musicPatternContainer, style]}>
      {[...Array(3)].map((_, i) => (
        <View key={`pattern-${i}`} style={styles.patternRow}>
          {[...Array(5)].map((_, j) => {
            const size = Math.random() * 5 + 5;
            const isCircle = Math.random() > 0.7;
            const isNote = Math.random() > 0.85;
            
            return (
              <View 
                key={`pattern-${i}-${j}`} 
                style={[
                  styles.patternItem,
                  {
                    width: size,
                    height: isCircle ? size : size * 2,
                    backgroundColor: color,
                    opacity: opacity * (Math.random() * 0.5 + 0.5),
                    borderRadius: isCircle ? size / 2 : 2,
                    marginHorizontal: 10 + Math.random() * 20,
                    marginVertical: Math.random() * 10,
                  }
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ブレッドクラムナビゲーション - より洗練されたデザイン
function BreadcrumbNavigation({ channelName, channelColor }: { channelName: string, channelColor: string }) {
  const router = useRouter();
  
  return (
    <View style={styles.breadcrumbContainer}>
      <TouchableOpacity 
        style={styles.breadcrumbItem}
        onPress={() => router.push('/')}
      >
        <Ionicons name="home" size={16} color="rgba(255, 255, 255, 0.9)" />
        <Text style={styles.breadcrumbText}>ホーム</Text>
      </TouchableOpacity>
      
      <View style={styles.breadcrumbSeparator}>
        <Ionicons name="chevron-forward" size={14} color="rgba(255, 255, 255, 0.5)" />
      </View>
      
      <TouchableOpacity 
        style={styles.breadcrumbItem}
        onPress={() => router.push('/channels')}
      >
        <Ionicons name="layers" size={16} color="rgba(255, 255, 255, 0.9)" />
        <Text style={styles.breadcrumbText}>チャンネル</Text>
      </TouchableOpacity>
      
      <View style={styles.breadcrumbSeparator}>
        <Ionicons name="chevron-forward" size={14} color="rgba(255, 255, 255, 0.5)" />
        </View>
      
      <View style={styles.breadcrumbItemActive}>
        <Text style={[styles.breadcrumbTextActive, { color: channelColor }]}>{channelName}</Text>
      </View>
    </View>
  );
}

// タグリスト表示コンポーネント - よりモダンなデザイン
function TagList({ tags, color }: { tags: string[], color: string }) {
  if (!tags || tags.length === 0) return null;
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.tagsContainer}
      contentContainerStyle={styles.tagsContent}
    >
      {tags.map((tag, index) => {
        const tagColor = getTagColor(tag, color);
        return (
          <View 
            key={`tag-${index}`} 
            style={[
              styles.tagItem, 
              { 
                backgroundColor: `${tagColor}15`,
                borderColor: `${tagColor}30`,
              }
            ]}
          >
            <Text style={[styles.tagText, { color: tagColor }]}>
              {tag}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// 空のスレッドリスト表示 - よりエンゲージメントを高めるデザイン
function EmptyThreadList({ channelColor, onPress }: { channelColor: string, onPress: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(40, 40, 60, 0.4)', 'rgba(30, 30, 45, 0.6)']}
        style={styles.emptyGradient}
      >
        <View style={[styles.emptyIconContainer, { borderColor: `${channelColor}30` }]}>
          <Ionicons name="chatbubbles-outline" size={48} color={channelColor} style={{ opacity: 0.8 }} />
        </View>
        <Text style={styles.emptyText}>まだスレッドがありません</Text>
        <Text style={styles.emptySubText}>コミュニティの最初の投稿者になりましょう</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: channelColor }]}
          onPress={onPress}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createButtonText}>スレッドを作成</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

export default function ChannelScreen() {
  const { channelId } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { userState } = useUser();
  const { getChannel } = useData();
  
  // 現在のチャンネル情報
  const [channel, setChannel] = useState<(typeof CHANNELS)[keyof typeof CHANNELS]>(
    CHANNELS[channelId as string] || { name: 'チャンネル', category: 'flute', color: '#7F3DFF', icon: 'chatbubbles', tags: [] }
  );
  
  // スレッド一覧
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredThreads, setFilteredThreads] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // アニメーション用の値
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(220); // ヘッダーの高さを調整
  const headerScale = useSharedValue(1);
  const waveOpacity = useSharedValue(1);
  
  // 楽器カテゴリー情報を取得
  const currentInstrument = INSTRUMENT_CATEGORIES.find(cat => cat.id === channel.category);
  const currentTheme = MUSIC_THEMES[getCategoryTheme(channel.category)];
  
  // タグを選択/解除
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  // チャンネルとスレッドデータのロード
  useEffect(() => {
    // データロード処理（ここではモックデータを使用）
    setTimeout(() => {
      const threadsData = THREADS_BY_CHANNEL[channelId as string] || [];
      setThreads(threadsData);
      setFilteredThreads(threadsData);
      setIsLoading(false);
    }, 500);
  }, [channelId]);
  
  // 検索/フィルタリング処理
  useEffect(() => {
    if (threads.length === 0) return;
    
    let filtered = [...threads];
    
    // 検索クエリによるフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thread => 
        thread.title.toLowerCase().includes(query) || 
        thread.author.toLowerCase().includes(query)
      );
    }
    
    // タグによるフィルタリング
    if (selectedTags.length > 0) {
      filtered = filtered.filter(thread => 
        thread.tags && selectedTags.some(tag => thread.tags.includes(tag))
      );
    }
    
    setFilteredThreads(filtered);
  }, [searchQuery, threads, selectedTags]);
  
  // スクロールハンドラ
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      
      // ヘッダーの高さと波形の透明度をスクロールに合わせて変更
      headerHeight.value = interpolate(
        scrollY.value,
        [0, 100],
        [220, 140],
        { extrapolateRight: 'clamp' }
      );
      
      headerScale.value = interpolate(
        scrollY.value,
        [0, 100],
        [1, 0.95],
        { extrapolateRight: 'clamp' }
      );
      
      waveOpacity.value = interpolate(
        scrollY.value,
        [0, 100],
        [1, 0.2],
        { extrapolateRight: 'clamp' }
      );
    },
  });
  
  // ヘッダーのアニメーションスタイル
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
      transform: [{ scale: headerScale.value }],
    };
  });
  
  // 波形アニメーションのスタイル
  const waveAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: waveOpacity.value,
    };
  });

  const onChangeSearch = (query: string) => setSearchQuery(query);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      // 検索処理（後でFirebaseと連携）
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  // 新規スレッド作成
  const handleCreateThread = () => {
    router.push(`/channels/${channelId}/create`);
  };

  // グローバルステートを使用してナビゲーション情報を共有
  useEffect(() => {
    const saveNavInfo = async () => {
      if (channel) {
        // URLパラメータからチャンネル情報を取得
        const navInfo = {
          channelId: channelId as string,
          channelName: channel.name,
          type: 'channel'
        };
        
        // AsyncStorageを使用してナビゲーション情報を保存
        try {
          await AsyncStorage.setItem('currentNavInfo', JSON.stringify(navInfo));
        } catch (e) {
          console.error('Navigation info could not be stored:', e);
        }
      }
    };
    
    saveNavInfo();
    
    return () => {
      // クリーンアップ
      const cleanupNavInfo = async () => {
        try {
          const storedInfo = await AsyncStorage.getItem('currentNavInfo');
          if (storedInfo) {
            const parsedInfo = JSON.parse(storedInfo);
            if (parsedInfo.type === 'channel') {
              await AsyncStorage.removeItem('currentNavInfo');
            }
          }
        } catch (e) {
          console.error('Navigation info could not be cleaned up:', e);
        }
      };
      
      cleanupNavInfo();
    };
  }, [channel, channelId]);

  if (!channel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>チャンネルが見つかりません</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <MusicGradientBackground 
      theme={getCategoryTheme(channel.category)}
      opacity={0.98} // 背景の透明度調整
    >
          <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            
        {/* 音楽パターン装飾 */}
        <MusicPattern 
          color={currentTheme.accent}
          opacity={currentTheme.patternOpacity}
          style={styles.backgroundPattern}
        />
        
        {/* ヘッダー部分 */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <LinearGradient
            colors={['rgba(20,20,30,0.8)', 'rgba(20,20,30,0)']}
            style={styles.headerGradient}
          >
            {/* 戻るボタン */}
            <View style={styles.backButtonContainer}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              
              {/* ユーザーアイコン */}
              {userState?.avatarUrl && (
                <TouchableOpacity onPress={() => router.push('/profile')} style={styles.userAvatar}>
                  <Image 
                    source={{ uri: userState.avatarUrl }} 
                    style={styles.avatarImage} 
                  />
                </TouchableOpacity>
              )}
            </View>
            
            {/* ブレッドクラムナビゲーション */}
            <BreadcrumbNavigation 
              channelName={channel.name} 
              channelColor={currentInstrument?.color || '#7F3DFF'} 
            />
            
            {/* チャンネルタイトル */}
            <View style={styles.channelTitleContainer}>
              <View style={[
                styles.channelIconContainer, 
                { 
                  backgroundColor: `${currentInstrument?.color}20`,
                  borderColor: `${currentInstrument?.color}40` 
                }
              ]}>
                <Ionicons 
                  name={(channel.icon as any) || 'chatbubbles'} 
                  size={24} 
                  color={currentInstrument?.color || '#7F3DFF'} 
                  />
                </View>
              
              <View style={styles.channelTitleTextContainer}>
                <Text style={styles.channelTitle}>{channel.name}</Text>
                <Text style={styles.channelCategory}>{currentInstrument?.name || ''}</Text>
              </View>
            </View>
            
            {/* チャンネルのタグ */}
            {channel.tags && (
              <TagList tags={channel.tags} color={currentInstrument?.color || '#7F3DFF'} />
            )}
            
            {/* 波形アニメーション */}
            <Animated.View style={waveAnimatedStyle}>
              <MusicWaveAnimation 
                color={currentInstrument?.color || '#7F3DFF'}
                count={5}
                height={25}
                position="bottom"
                opacity={0.25}
                style={styles.waveAnimation}
              />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

            {/* 検索バー */}
            <View style={styles.searchContainer}>
              <Searchbar
            placeholder="スレッドを検索"
                onChangeText={onChangeSearch}
                value={searchQuery}
                style={styles.searchBar}
            iconColor={currentInstrument?.color || '#7F3DFF'}
            inputStyle={styles.searchInput}
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            onSubmitEditing={handleSearch}
              />
            </View>

        {/* スレッド一覧 */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentInstrument?.color || '#7F3DFF'} />
              </View>
        ) : filteredThreads.length === 0 ? (
          <EmptyThreadList channelColor={currentInstrument?.color || '#7F3DFF'} onPress={handleCreateThread} />
            ) : (
          <Animated.FlatList
                data={filteredThreads}
                keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.sectionTitle}>スレッド一覧</Text>
                  <Text style={styles.threadCount}>{filteredThreads.length}件</Text>
                  </View>
                
                {/* タグフィルター */}
                {channel.tags && channel.tags.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterTagsContainer}
                  >
                    {channel.tags.map((tag: string, index: number) => {
                      const isSelected = selectedTags.includes(tag);
                      const tagColor = getTagColor(tag, currentInstrument?.color || '#7F3DFF');
                      return (
                        <TouchableOpacity
                          key={`filter-${index}`}
                          style={[
                            styles.filterTagItem,
                            { 
                              backgroundColor: isSelected ? tagColor : 'rgba(40, 40, 60, 0.5)',
                              borderColor: isSelected ? tagColor : `${tagColor}50`,
                            }
                          ]}
                          onPress={() => toggleTag(tag)}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" style={styles.tagCheckmark} />
                          )}
                          <Text 
                            style={[
                              styles.filterTagText, 
                              { color: isSelected ? '#FFFFFF' : tagColor }
                            ]}
                          >
                            {tag}
                          </Text>
                  </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <ThreadCard
                id={item.id}
                title={item.title}
                content={item.content || 'このスレッドの内容が表示されます。長いテキストの場合は自動的に省略されます...'}
                author={{
                  id: 'user-id',  // 実際のユーザーIDに置き換える
                  name: item.author,
                  avatar: 'https://via.placeholder.com/40'  // プレースホルダー画像
                }}
                createdAt={item.createdAt}
                channelId={channelId as string}
                likes={item.likes || 0}
                replies={item.replies}
                isLiked={item.isLiked || false}
                color={currentInstrument?.color || '#7F3DFF'}
                onLikeToggle={() => {}}
              />
                )}
              />
            )}
            
        {/* スレッド作成ボタン */}
        <MusicFAB
              onPress={handleCreateThread}
          isChannelScreen={true}
            />
          </SafeAreaView>
    </MusicGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  backLink: {
    color: '#7F3DFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  backButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 40, 60, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginLeft: 4,
  },
  breadcrumbSeparator: {
    marginHorizontal: 4,
  },
  breadcrumbItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
  },
  breadcrumbTextActive: {
    fontWeight: '600',
    fontSize: 12,
  },
  channelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  channelIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  channelTitleTextContainer: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  channelCategory: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagsContent: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  tagItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  waveAnimation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: -20,
    position: 'relative',
    zIndex: 2,
  },
  searchBar: {
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 45, 0.7)',
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 46,
  },
  searchInput: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  listHeader: {
    marginBottom: 16,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  threadCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterTagsContainer: {
    marginBottom: 12,
  },
  filterTagItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagCheckmark: {
    marginRight: 4,
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyGradient: {
    width: '100%',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(30, 30, 45, 0.6)',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginVertical: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  musicPatternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 50 + Math.random() * 100,
  },
  patternItem: {
    position: 'relative',
  },
}); 