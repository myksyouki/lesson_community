import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl, Dimensions, TextInput, Platform, PanResponder, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Card, Searchbar, Button, Chip, ActivityIndicator, FAB, IconButton, Menu, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import { useSideMenu } from '../../contexts/SideMenuContext';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import MusicWaveAnimation from '../../components/MusicWaveAnimation';
import FloatingActionButton from '../../components/FloatingActionButton';
import ThreadItem from '../../components/ThreadItem';

// Firebase関連
import { db } from '../../firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy
} from 'firebase/firestore';
// テーマ関連
import { getThemeForCategory } from '../../theme/musicThemes';

// スクリーンの寸法を取得
const { width, height } = Dimensions.get('window');

// チャンネルの型定義
interface Channel {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  memberCount?: number;
  tags?: string[];
  createdAt?: Date;
  createdBy?: string;
}

// スレッドの型定義
interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  commentCount: number;
  tags?: string[];
  isLiked?: boolean;
}

// 空のスレッドリスト表示用コンポーネント
const EmptyThreadList = ({ message, themeColor }: { message: string, themeColor: string }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="chatbubbles-outline" size={64} color="#fff" style={{ opacity: 0.5, marginBottom: 16 }} />
    <Text style={styles.emptyTitle}>スレッドがありません</Text>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

// タグリスト表示用コンポーネント
const TagList = ({ tags, selectedTags, onSelectTag, themeColor }: { 
  tags: string[], 
  selectedTags: string[], 
  onSelectTag: (tag: string) => void,
  themeColor: string
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.tagScrollView}
    contentContainerStyle={styles.tagContainer}
  >
    {tags.map((tag, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.tagButton,
          selectedTags.includes(tag) && { backgroundColor: themeColor }
        ]}
        onPress={() => onSelectTag(tag)}
      >
        <Text
          style={[
            styles.tagText,
            selectedTags.includes(tag) && styles.selectedTagText
          ]}
        >
          {tag}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// パンくずリスト表示用コンポーネント
const BreadcrumbNavigation = ({ channelName, router }: { channelName: string, router: any }) => (
  <View style={styles.breadcrumbContainer}>
    <TouchableOpacity 
      style={styles.breadcrumbItem} 
      onPress={() => router.push('/')}
    >
      <Ionicons name="home-outline" size={16} color="#fff" />
      <Text style={styles.breadcrumbText}>HOME</Text>
    </TouchableOpacity>
    <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
    <TouchableOpacity style={styles.breadcrumbItem} onPress={() => router.push('/channels')}>
      <Text style={styles.breadcrumbText}>チャンネル一覧</Text>
    </TouchableOpacity>
    <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
    <View style={[styles.breadcrumbItem, styles.breadcrumbActive]}>
      <Text style={[styles.breadcrumbText, styles.breadcrumbActiveText]}>{channelName}</Text>
    </View>
  </View>
);

// チャンネル詳細画面
export default function ChannelDetailScreen() {
  const params = useLocalSearchParams();
  const channelId = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { userState, getCategoryThemeColor } = useUser();
  const dataContext = useData();
  const { openMenu } = useSideMenu();
  
  // スクロール位置の監視
  const scrollY = useSharedValue(0);
  
  // 状態管理
  const [channel, setChannel] = useState<Channel | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // 初回ロード時にデータを取得
  useEffect(() => {
    console.log(`ページ遷移 => app/channels/[id].tsx [チャンネル詳細画面]: ID = ${channelId}`);
    fetchChannelData();
  }, [channelId]);
  
  // 選択されたタグまたは検索クエリが変更されたときにフィルタリング
  useEffect(() => {
    filterThreads();
  }, [selectedTags, searchQuery, threads]);
  
  // テーマカラーの取得
  const theme = channel ? getThemeForCategory(channel.category) : 'default';
  const themeColor = channel?.category ? 
    getCategoryThemeColor() : 
    '#7F3DFF'; // デフォルトカラー
  
  return (
    <MusicGradientBackground 
      theme={theme}
      opacity={0.98}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* ヘッダー */}
        <View style={styles.header}>
          <IconButton
            icon="menu"
            iconColor="#fff"
            size={24}
            onPress={openMenu}
          />
          <Text style={styles.headerTitle}>{channel?.name || 'チャンネル詳細'}</Text>
          <IconButton
            icon="notifications-outline"
            iconColor="#fff"
            size={24}
            onPress={() => {}}
          />
        </View>
        
        {/* パンくずリスト */}
        {channel && (
          <BreadcrumbNavigation 
            channelName={channel.name}
            router={router}
          />
        )}
        
        {/* 読み込み中の表示 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColor} />
            <Text style={styles.loadingText}>チャンネル情報を読み込み中...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredThreads}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            ListHeaderComponent={
              channel ? (
                <View style={styles.channelHeader}>
                  {/* カテゴリーエラー警告 */}
                  {categoryError && (
                    <View style={[styles.warningBox, { borderColor: '#FF3B30' }]}>
                      <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
                      <Text style={styles.warningText}>
                        このチャンネルは、あなたが選択していないカテゴリーです。参照のみ可能です。
                      </Text>
                    </View>
                  )}
                  
                  {/* チャンネル情報 */}
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>{channel.name}</Text>
                    {channel.description && (
                      <Text style={styles.channelDescription}>{channel.description}</Text>
                    )}
                    <View style={styles.channelMeta}>
                      {channel.category && (
                        <View style={[styles.categoryBadge, { backgroundColor: themeColor }]}>
                          <Text style={styles.categoryText}>{channel.category}</Text>
                        </View>
                      )}
                      <View style={styles.channelStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="people-outline" size={14} color="#fff" />
                          <Text style={styles.statText}>{channel.memberCount || 0} メンバー</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="chatbubble-outline" size={14} color="#fff" />
                          <Text style={styles.statText}>{threads.length} スレッド</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {/* 検索バー */}
                  <View style={styles.searchContainer}>
                    <Searchbar
                      placeholder="スレッドを検索"
                      onChangeText={setSearchQuery}
                      value={searchQuery}
                      style={styles.searchBar}
                      iconColor="#666"
                      placeholderTextColor="#666"
                      onSubmitEditing={() => filterThreads()}
                    />
                  </View>
                  
                  {/* タグリスト */}
                  {channel.tags && channel.tags.length > 0 && (
                    <TagList 
                      tags={channel.tags} 
                      selectedTags={selectedTags} 
                      onSelectTag={toggleTagSelection}
                      themeColor={themeColor}
                    />
                  )}
                  
                  {/* スレッド一覧のヘッダー */}
                  <View style={styles.threadListHeader}>
                    <Text style={styles.threadListTitle}>スレッド一覧</Text>
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !isLoading && (
                <EmptyThreadList 
                  message={
                    searchQuery || selectedTags.length > 0
                      ? "検索条件に一致するスレッドが見つかりませんでした。"
                      : "このチャンネルにはまだスレッドがありません。\n最初のスレッドを作成しましょう！"
                  }
                  themeColor={themeColor}
                />
              )
            }
            renderItem={({ item }) => (
              <ThreadItem
                thread={item}
                onPress={() => navigateToThreadDetail(item.id)}
                likes={item.likeCount}
                replies={item.commentCount}
                isLiked={item.isLiked || false}
                color={themeColor}
              />
            )}
            onScroll={(e) => {
              scrollY.value = e.nativeEvent.contentOffset.y;
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={themeColor}
              />
            }
          />
        )}
        
        {/* 新規スレッド作成ボタン */}
        {!isLoading && !isReadOnly && (
          <FloatingActionButton
            icon="add"
            onPress={navigateToCreateThread}
            backgroundColor={themeColor}
            position={{ bottom: 20, right: 20 }}
          />
        )}
      </SafeAreaView>
    </MusicGradientBackground>
  );
  
  // チャンネルデータの取得
  async function fetchChannelData() {
    setIsLoading(true);
    try {
      const docRef = doc(db, 'channels', channelId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const channelData: Channel = {
          id: docSnap.id,
          name: data.name,
          description: data.description,
          category: data.category,
          imageUrl: data.imageUrl,
          memberCount: data.memberCount || 0,
          tags: data.tags || [],
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : undefined,
          createdBy: data.createdBy,
        };
        
        setChannel(channelData);
        
        // カテゴリーをチェック
        if (userState?.selectedCategories?.length > 0) {
          const isValidCategory = userState.selectedCategories.includes(data.category);
          setCategoryError(!isValidCategory);
          setIsReadOnly(!isValidCategory);
        }
        
        // スレッドを取得
        fetchThreads(channelId);
      } else {
        console.log('チャンネルが見つかりません');
        fallbackToMockChannelData();
      }
    } catch (error) {
      console.error('チャンネルデータの取得に失敗しました', error);
      fallbackToMockChannelData();
    }
  }
  
  // モックデータに切り替え
  function fallbackToMockChannelData() {
    const mockChannel: Channel = {
      id: channelId,
      name: 'サンプルチャンネル',
      description: 'これはサンプルチャンネルです。APIからデータを取得できなかったため、ダミーデータを表示しています。',
      category: 'flute',
      imageUrl: 'https://example.com/sample.jpg',
      memberCount: 123,
      tags: ['初心者向け', '楽器選び', '練習方法', '音楽理論', '演奏テクニック'],
      createdAt: new Date(),
      createdBy: 'user123',
    };
    
    setChannel(mockChannel);
    
    // モックスレッドを作成
    const mockThreads: Thread[] = Array(5).fill(0).map((_, i) => ({
      id: `thread-${i}`,
      title: `サンプルスレッド ${i + 1}`,
      content: 'これはサンプルスレッドの内容です。APIからデータを取得できなかったため、ダミーデータを表示しています。',
      authorId: 'user123',
      authorName: 'サンプルユーザー',
      authorAvatar: 'https://example.com/avatar.jpg',
      channelId: channelId,
      createdAt: new Date(),
      updatedAt: new Date(),
      likeCount: Math.floor(Math.random() * 50),
      commentCount: Math.floor(Math.random() * 20),
      tags: ['サンプル', 'テスト'],
    }));
    
    setThreads(mockThreads);
    setFilteredThreads(mockThreads);
    setIsLoading(false);
  }
  
  // スレッドデータの取得
  async function fetchThreads(channelId: string) {
    try {
      const threadsRef = collection(db, 'threads');
      const q = query(
        threadsRef,
        where('channelId', '==', channelId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setThreads([]);
        setFilteredThreads([]);
        setIsLoading(false);
        return;
      }
      
      const threadsData: Thread[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        threadsData.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          authorAvatar: data.authorAvatar,
          channelId: data.channelId,
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date(),
          likeCount: data.likeCount || 0,
          commentCount: data.commentCount || 0,
          tags: data.tags || [],
          isLiked: false, // TODO: ユーザーがいいねしているかどうかを取得
        });
      });
      
      setThreads(threadsData);
      setFilteredThreads(threadsData);
    } catch (error) {
      console.error('スレッドの取得に失敗しました', error);
      // エラー時はモックデータを使用
      const mockThreads: Thread[] = Array(3).fill(0).map((_, i) => ({
        id: `thread-${i}`,
        title: `エラー時サンプルスレッド ${i + 1}`,
        content: 'スレッドの取得に失敗しました。サンプルデータを表示しています。',
        authorId: 'user123',
        authorName: 'サンプルユーザー',
        authorAvatar: 'https://example.com/avatar.jpg',
        channelId: channelId,
        createdAt: new Date(),
        updatedAt: new Date(),
        likeCount: Math.floor(Math.random() * 50),
        commentCount: Math.floor(Math.random() * 20),
        tags: ['サンプル', 'テスト'],
      }));
      
      setThreads(mockThreads);
      setFilteredThreads(mockThreads);
    } finally {
      setIsLoading(false);
    }
  }
  
  // スレッドのフィルタリング
  function filterThreads() {
    if (!threads.length) return;
    
    let filtered = [...threads];
    
    // 検索クエリによるフィルタリング
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        thread => thread.title.toLowerCase().includes(query) || 
                 thread.content.toLowerCase().includes(query)
      );
    }
    
    // 選択されたタグによるフィルタリング
    if (selectedTags.length > 0) {
      filtered = filtered.filter(thread => 
        thread.tags && thread.tags.some(tag => selectedTags.includes(tag))
      );
    }
    
    setFilteredThreads(filtered);
  }
  
  // 検索処理
  function handleSearch(query: string) {
    setSearchQuery(query);
  }
  
  // タグの選択/解除を処理
  function toggleTagSelection(tag: string) {
    setSelectedTags(prevTags => {
      if (prevTags.includes(tag)) {
        return prevTags.filter(t => t !== tag);
      } else {
        return [...prevTags, tag];
      }
    });
  }
  
  // リフレッシュ処理
  function handleRefresh() {
    setIsRefreshing(true);
    fetchChannelData().then(() => {
      setIsRefreshing(false);
    });
  }
  
  // スレッド詳細画面への遷移
  function navigateToThreadDetail(threadId: string) {
    router.push({
      pathname: "/threads/[id]",
      params: { id: threadId }
    });
  }
  
  // スレッド作成画面への遷移
  function navigateToCreateThread() {
    if (isReadOnly) {
      Alert.alert(
        'カテゴリーエラー',
        'このカテゴリーのチャンネルには投稿できません。設定で選択したカテゴリーのみ投稿できます。'
      );
      return;
    }
    
    router.push({
      pathname: "/threads/create",
      params: { channelId }
    });
  }
  
  // ホーム画面への遷移
  function navigateToHome() {
    router.push('/');
  }
  
  // チャンネル一覧画面への遷移
  function navigateToChannelList() {
    router.push('/channels');
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  breadcrumbText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginLeft: 4,
  },
  breadcrumbActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  breadcrumbActiveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  channelHeader: {
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  channelInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  channelName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  channelDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    lineHeight: 20,
  },
  channelMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  channelStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 4,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    elevation: 0,
  },
  tagScrollView: {
    marginBottom: 16,
  },
  tagContainer: {
    paddingRight: 8,
  },
  tagButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  selectedTagText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  threadListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  threadListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 