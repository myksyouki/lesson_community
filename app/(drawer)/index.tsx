// app/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl, Dimensions, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Card, Searchbar, Button, Chip, useTheme, ActivityIndicator, FAB, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import { StatusBar } from 'expo-status-bar';
import MusicFAB from '../../components/MusicFAB';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import ChannelCard from '../../components/ChannelCard';
import MusicWaveAnimation from '../../components/MusicWaveAnimation';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  withDelay,
} from 'react-native-reanimated';
import firestore from '@react-native-firebase/firestore';

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
  icon?: string;
  unreadCount?: number;
  tags?: string[];
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

export default function HomeScreen() {
  const { userState } = useUser();
  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();
  const [channels, setChannels] = useState<ExtendedChannel[]>([]);
  const [hotThreads, setHotThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // アニメーション用の値
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const tagListScale = useSharedValue(0.9);
  
  // おすすめチャンネルのインデックス
  const recommendedIndex = 0; // 例として最初のチャンネルをおすすめとする

  // データロード用関数
  useEffect(() => {
    loadInitialData();
    loadTags();
    
    // アニメーションの開始
    headerOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
    headerTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) });
    tagListScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  }, []);

  // タグが変更されたらデータをリロード
  useEffect(() => {
    loadChannelsByTags();
  }, [selectedTags]);

  // Firebaseからタグデータを取得
  const loadTags = async () => {
    try {
      // Firebaseが利用可能な場合、タグデータを取得
      // 注: 実際の実装ではfirestore()を使用
      // const tagsSnapshot = await firestore().collection('tags').get();
      // const tagsData = tagsSnapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // }));
      // setTags(tagsData);
      
      // 現在はモックデータを使用
      setTags(DEFAULT_TAGS);
    } catch (error) {
      console.error('Error loading tags:', error);
      // エラーが発生した場合はデフォルトタグを表示
      setTags(DEFAULT_TAGS);
    }
  };

  const loadInitialData = () => {
    const currentCategory = userState.selectedCategories[0] || 'flute';
    const channelsForCategory = CHANNELS_BY_CATEGORY[currentCategory as keyof typeof CHANNELS_BY_CATEGORY] || [];
    
    // チャンネルデータを整形
    const formattedChannels = channelsForCategory.map(channel => ({
      ...channel,
      category: currentCategory,
      threads: [],
    }));
    
    setChannels(formattedChannels);
    setLoading(false);
  };
  
  // 選択されたタグに基づいてチャンネルをフィルタリング
  const loadChannelsByTags = () => {
    if (selectedTags.length === 0) {
      loadInitialData();
      return;
    }
    
    const currentCategory = userState.selectedCategories[0] || 'flute';
    const allChannels = CHANNELS_BY_CATEGORY[currentCategory as keyof typeof CHANNELS_BY_CATEGORY] || [];
    
    // 選択されたタグに一致するチャンネルをフィルタリング
    const filteredChannels = allChannels.filter(channel => {
      if (!channel.tags) return false;
      // channelのタグに選択されたタグが1つでも含まれていれば表示
      return selectedTags.some(tag => channel.tags?.includes(tag));
    });
    
    // チャンネルデータを整形
    const formattedChannels = filteredChannels.map(channel => ({
      ...channel,
      category: currentCategory,
      threads: [],
    }));
    
    setChannels(formattedChannels);
  };
  
  // タグの選択/解除を処理
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };
  
  // 新しいタグを作成（Firebaseに保存）
  const createTag = async (name: string, color: string) => {
    try {
      // Firebaseに新しいタグを追加
      // const newTagRef = await firestore().collection('tags').add({
      //   name,
      //   color,
      //   count: 0,
      //   createdAt: firestore.FieldValue.serverTimestamp(),
      //   createdBy: userState.uid
      // });
      
      // UIを更新
      const newTag = {
        id: `tag-${Date.now()}`, // 実際の実装ではnewTagRef.idを使用
        name,
        color,
        count: 0
      };
      
      setTags(prev => [...prev, newTag]);
      
      // 作成したタグを選択
      setSelectedTags(prev => [...prev, newTag.id]);
      
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInitialData();
    loadTags();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // タグリストのアニメーションスタイル
  const tagListAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: tagListScale.value }],
      opacity: tagListScale.value,
    };
  });
  
  // ヘッダーのアニメーションスタイル
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  const onChangeSearch = (query: string) => setSearchQuery(query);
  
  const handleSearch = () => {
    // 実装予定の検索機能
    console.log('検索:', searchQuery);
  };
  
  const navigateToChannelList = () => {
    router.push('/channels');
  };

  // 選択されたカテゴリーのテーマを取得
  const getCategoryTheme = (category: string) => {
    return CATEGORY_THEMES[category as keyof typeof CATEGORY_THEMES] || 'default';
  };
  
  // 検索アイコンのアニメーション効果
  const renderSearchIcon = () => (
    <Animated.View>
      <IconButton icon="search" size={24} iconColor={theme.colors.primary} />
    </Animated.View>
  );
  
  // 現在選択されている楽器カテゴリの情報を取得
  const currentInstrument = {
    id: userState.selectedCategories[0] || 'flute',
    name: userState.selectedCategories[0] === 'flute' ? 'フルート' : 
          userState.selectedCategories[0] === 'clarinet' ? 'クラリネット' : 
          userState.selectedCategories[0] === 'saxophone' ? 'サクソフォン' : 
          'フルート',
    color: userState.selectedCategories[0] === 'flute' ? '#7F3DFF' : 
           userState.selectedCategories[0] === 'clarinet' ? '#FF3D77' : 
           userState.selectedCategories[0] === 'saxophone' ? '#3DFFCF' : 
           '#7F3DFF',
  };

  return (
    <MusicGradientBackground 
      theme={getCategoryTheme(userState.selectedCategories[0] || 'flute')}
      opacity={0.95} // 背景の透明度を少し上げて楽器カラーが見えるように
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* 音楽波形アニメーション（背景） */}
        <MusicWaveAnimation 
          color={currentInstrument.color} 
          count={7} 
          height={50} 
          position="bottom"
          opacity={0.25}
        />
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={currentInstrument.color}
              colors={[currentInstrument.color, '#3D7FFF']}
            />
          }
        >
          {/* ヘッダー */}
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Ionicons name="menu" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>ホーム</Text>
            </View>
            
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Image
                source={{ uri: userState.avatarUrl || 'https://via.placeholder.com/40' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </Animated.View>
          
          {/* 検索バー */}
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="チャンネルや投稿を検索"
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchBar}
              iconColor={currentInstrument.color}
              inputStyle={{ color: '#FFFFFF' }}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              onSubmitEditing={handleSearch}
              icon={renderSearchIcon}
            />
          </View>
          
          {/* タグリスト */}
          <View style={styles.tagContainer}>
            <View style={styles.tagHeader}>
              <Text style={styles.sectionTitle}>タグリスト</Text>
              <TouchableOpacity onPress={() => router.push('/tags')}>
                <Text style={[styles.viewAllText, { color: currentInstrument.color }]}>管理</Text>
              </TouchableOpacity>
            </View>
            
            <Animated.View style={tagListAnimatedStyle}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagList}
              >
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagItem,
                      selectedTags.includes(tag.name) && { backgroundColor: `${tag.color}30` }
                    ]}
                    onPress={() => toggleTag(tag.name)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag.name) && { color: tag.color, fontWeight: 'bold' }
                      ]}
                    >
                      {tag.name}
                    </Text>
                    {tag.count > 0 && (
                      <View style={[styles.tagCount, { backgroundColor: tag.color }]}>
                        <Text style={styles.tagCountText}>{tag.count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={[styles.tagItem, styles.createTagItem]}
                  onPress={() => router.push('/tags/create')}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.createTagText}>新規タグ</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
          
          {/* おすすめチャンネル */}
          {channels.length > 0 && (
            <View style={styles.recommendedContainer}>
              <Text style={styles.sectionTitle}>おすすめチャンネル</Text>
              <ChannelCard
                id={channels[recommendedIndex].id}
                name={channels[recommendedIndex].name}
                description={channels[recommendedIndex].description}
                icon={channels[recommendedIndex].icon || 'chatbubbles'}
                color={currentInstrument.color}
                membersCount={channels[recommendedIndex].members}
                threadsCount={5}
                tags={channels[recommendedIndex].tags}
              />
            </View>
          )}
          
          {/* チャンネル一覧 */}
          <View style={styles.channelsContainer}>
            <View style={styles.channelsHeader}>
              <Text style={styles.sectionTitle}>チャンネル</Text>
              <TouchableOpacity onPress={navigateToChannelList}>
                <Text style={[styles.viewAllText, { color: currentInstrument.color }]}>すべて表示</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color={currentInstrument.color} style={{ marginTop: 20 }} />
            ) : channels.length === 0 ? (
              <View style={styles.emptyChannelsContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={currentInstrument.color} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyText}>該当するチャンネルがありません</Text>
                {selectedTags.length > 0 && (
                  <TouchableOpacity
                    style={[styles.resetButton, { borderColor: currentInstrument.color }]}
                    onPress={() => setSelectedTags([])}
                  >
                    <Text style={[styles.resetButtonText, { color: currentInstrument.color }]}>タグ選択をリセット</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.channelsList}>
                {channels.map((channel, index) => (
                  <ChannelCard
                    key={channel.id}
                    id={channel.id}
                    name={channel.name}
                    description={channel.description}
                    icon={channel.icon || 'chatbubbles'}
                    color={currentInstrument.color}
                    membersCount={channel.members}
                    threadsCount={channel.threads?.length || 0}
                    tags={channel.tags}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* 右下のFAB */}
        <MusicFAB />
      </SafeAreaView>
    </MusicGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  searchBar: {
    borderRadius: 12,
    backgroundColor: 'rgba(40, 40, 60, 0.6)',
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tagList: {
    paddingRight: 16,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(60, 60, 80, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  tagCount: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  tagCountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  createTagItem: {
    backgroundColor: 'rgba(100, 100, 120, 0.5)',
  },
  createTagText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  recommendedContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  channelsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  channelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontWeight: '600',
  },
  channelsList: {
    gap: 16,
  },
  emptyChannelsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 16,
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});