import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl, Dimensions, PanResponder } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, IconButton, ActivityIndicator, FAB, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import { DrawerActions } from '@react-navigation/native';
import MusicWaveAnimation from '../../components/MusicWaveAnimation';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import { useSideMenu } from '../../contexts/SideMenuContext';
import { useSharedValue } from 'react-native-reanimated';
// テーマとカテゴリーを一元管理されたファイルからインポート
import { 
  MUSIC_THEMES, 
  INSTRUMENT_CATEGORIES,
  getThemeForCategory, 
  MusicTheme 
} from '../../theme/musicThemes';
// Firebase imports
import { db } from '../../firebase/config';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// 画面の幅を取得
const { width } = Dimensions.get('window');

// 楽器タグの定義
const INSTRUMENT_TAGS = [
  'ピアノ', 'ギター', 'ドラム', 'ベース', 'バイオリン', 
  'サックス', '管楽器', '打楽器', 'ボーカル', 'その他'
];

// チャンネルの型定義
interface Channel {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  memberCount?: number;
  tags?: string[];
}

// 型定義
interface Tag {
  id: string;
  name: string;
  color?: string;
}

// Channel型を拡張
interface ExtendedChannel extends Channel {
  threadCount?: number;
  lastActivity?: Date;
  createdAt?: Date;
  createdBy?: string;
  creatorName?: string;
  creatorAvatar?: string;
  isFavorite?: boolean;
}

// チャンネルカードコンポーネント
const ChannelItemCard = ({ channel, onPress }: { channel: ExtendedChannel, onPress: () => void }) => {
  const theme = getThemeForCategory(channel.category);
  
  return (
    <Card style={styles.channelCard} onPress={onPress}>
      <Card.Content style={styles.channelCardContent}>
        <View style={styles.channelInfo}>
          {channel.imageUrl ? (
            <Image source={{ uri: channel.imageUrl }} style={styles.channelImage} />
          ) : (
            <View style={[styles.channelImagePlaceholder, { backgroundColor: MUSIC_THEMES[theme].primary[0] }]}>
              <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.channelTextInfo}>
            <Text style={styles.channelName}>{channel.name}</Text>
            {channel.description && (
              <Text numberOfLines={2} style={styles.channelDescription}>
                {channel.description}
              </Text>
            )}
            <View style={styles.channelMeta}>
              <View style={styles.channelMetaItem}>
                <Ionicons name="people" size={14} color="#FFFFFF" />
                <Text style={styles.channelMetaText}>{channel.memberCount || 0} メンバー</Text>
              </View>
              {channel.category && (
                <View style={styles.channelMetaItem}>
                  <Ionicons name="musical-note" size={14} color="#FFFFFF" />
                  <Text style={styles.channelMetaText}>{channel.category}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

// パンくずリスト用コンポーネント
const Breadcrumb = ({ navigateHome, router }: { navigateHome: () => void, router: any }) => (
  <View style={styles.breadcrumbContainer}>
    <TouchableOpacity 
      style={[styles.breadcrumbItem, styles.breadcrumbActive]} 
      onPress={() => router.push('/(drawer)')}
    >
      <Ionicons name="home-outline" size={16} color="#fff" />
      <Text style={[styles.breadcrumbText, styles.breadcrumbActiveText]}>HOME</Text>
    </TouchableOpacity>
    <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
    <View style={styles.breadcrumbItem}>
      <Text style={styles.breadcrumbText}>チャンネル一覧</Text>
    </View>
  </View>
);

// チャンネル一覧画面
export default function ChannelListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { userState, toggleCategory, getCategoryThemeColor } = useUser();
  const { isMenuOpen, openMenu } = useSideMenu();
  const dataContext = useData(); // DataContextを取得
  
  // 状態管理
  const [channels, setChannels] = useState<ExtendedChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<ExtendedChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>(userState.selectedCategories[0] || 'flute');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // アニメーション用のスクロール値
  const scrollY = useSharedValue(0);

  // 現在のテーマカラーを取得
  const themeColor = getCategoryThemeColor();
  
  // 右スワイプで戻るための処理を追加
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 右スワイプを検出（x方向の移動が20以上、y方向の移動が20未満）
        return gestureState.dx > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        // 右へのスワイプが50px以上なら前の画面に戻る
        if (gestureState.dx > 50) {
          router.back();
        }
      },
    })
  ).current;
  
  // 初回ロード時にデータを取得
  useEffect(() => {
    console.log(`ページ遷移 => app/channels/index.tsx [チャンネル一覧画面]`);
    loadInitialData();
    loadTags();
  }, []);
  
  // カテゴリー変更時にチャンネルをフィルタリング
  useEffect(() => {
    filterChannelsByCategory();
  }, [currentCategory, channels]);
  
  // 選択されたタグまたは検索クエリが変更されたときにフィルタリング
  useEffect(() => {
    if (channels.length > 0) {
      const filtered = filterChannelsByTagsAndSearch(channels, selectedTags, searchQuery);
      setFilteredChannels(filtered);
    }
  }, [selectedTags, searchQuery, channels]);

  // カテゴリーが変更されたときに現在のカテゴリーを更新
  useEffect(() => {
    if (userState.selectedCategories[0] !== currentCategory) {
      setCurrentCategory(userState.selectedCategories[0]);
    }
  }, [userState.selectedCategories]);
  
  // 初期データの読み込み
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Firebaseからチャンネル一覧を取得
      const channelsRef = collection(db, 'channels');
      const q = query(
        channelsRef,
        orderBy('lastActivity', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('チャンネルが見つかりません');
        fallbackToMockData();
        return;
      }
      
      const channelsData: ExtendedChannel[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // FirestoreのタイムスタンプをDateオブジェクトに変換
        const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000) : undefined;
        const lastActivity = data.lastActivity ? new Date(data.lastActivity.seconds * 1000) : undefined;
        
        channelsData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          imageUrl: data.imageUrl,
          memberCount: data.memberCount || 0,
          threadCount: data.threadCount || 0,
          tags: data.tags || [],
          createdAt,
          lastActivity,
          createdBy: data.createdBy,
          creatorName: data.creatorName,
          creatorAvatar: data.creatorAvatar,
          isFavorite: false, // お気に入り状態は別途管理
        });
      });
      
      setChannels(channelsData);
      filterChannelsByCategory();
    } catch (error) {
      console.error('チャンネル一覧の取得に失敗しました', error);
      fallbackToMockData();
    } finally {
      setIsLoading(false);
    }
  };
  
  // カテゴリーによるフィルタリング
  const filterChannelsByCategory = () => {
    if (!channels.length) return;
    
    // 現在のカテゴリーに基づいてチャンネルをフィルタリング
    const filtered = channels.filter(channel => 
      channel.category === currentCategory || channel.category === 'general'
    );
    
    // フィルタリングしたチャンネルをさらにタグと検索クエリでフィルタリング
    const finalFiltered = filterChannelsByTagsAndSearch(filtered, selectedTags, searchQuery);
    setFilteredChannels(finalFiltered);
  };
  
  // タグとテキスト検索によるフィルタリング
  const filterChannelsByTagsAndSearch = (channels: ExtendedChannel[], tags: string[], query: string) => {
    let filtered = [...channels];
    
    // タグによるフィルタリング
    if (tags.length > 0) {
      filtered = filtered.filter(channel => 
        channel.tags && channel.tags.some((tag: string) => tags.includes(tag))
      );
    }
    
    // 検索クエリによるフィルタリング
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        channel => 
          channel.name.toLowerCase().includes(lowerQuery) || 
          (channel.description && channel.description.toLowerCase().includes(lowerQuery))
      );
    }
    
    return filtered;
  };

  // モックデータにフォールバック
  const fallbackToMockData = (category = currentCategory) => {
    // ... existing code ...
  };

  // タグのロード
  const loadTags = async () => {
    // ... existing code ...
  };

  // タグ選択の切り替え
  const toggleTagSelection = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    const filtered = filterChannelsByTagsAndSearch(
      channels.filter(channel => channel.category === currentCategory), 
      newSelectedTags, 
      searchQuery
    );
    setFilteredChannels(filtered);
  };

  // 検索クエリの更新
  const onChangeSearch = (query: string) => setSearchQuery(query);

  // 検索の実行
  const handleSearch = () => {
    const filtered = filterChannelsByTagsAndSearch(
      channels.filter(channel => channel.category === currentCategory), 
      selectedTags, 
      searchQuery
    );
    setFilteredChannels(filtered);
  };

  // カテゴリー選択の切り替え
  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
    setShowCategoryDropdown(false);
    // ユーザーの選択カテゴリーも更新
    toggleCategory(category);
  };
  
  // カテゴリー選択のトグル
  const toggleCategoryDropdown = () => {
    setShowCategoryDropdown(!showCategoryDropdown);
  };

  // リフレッシュ処理
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadInitialData().then(() => setIsRefreshing(false));
  }, []);

  // チャンネル詳細画面への遷移
  const navigateToChannelDetail = (channelId: string) => {
    console.log(`ページ遷移 => チャンネル詳細/スレッド一覧: ${channelId}`);
    // 型エラーを避けるため、string型に変換
    router.push({
      pathname: "/channels/[id]" as any,
      params: { id: channelId }
    });
  };

  // チャンネル作成画面への遷移
  const navigateToChannelCreate = () => {
    console.log('チャンネル作成ページへ遷移');
    // 型エラーを避けるため、any型にキャスト
    router.push("/channels/create" as any);
  };

  return (
    <MusicGradientBackground 
      theme={getThemeForCategory(currentCategory)}
      opacity={0.98}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* ヘッダー */}
        <View style={styles.header}>
          <IconButton
            icon="menu"
            size={24}
            iconColor="#fff"
            onPress={openMenu}
          />
          <Text style={styles.headerTitle}>チャンネル一覧</Text>
          <IconButton
            icon="notifications-outline"
            size={24}
            iconColor="#fff"
            onPress={() => {}}
          />
        </View>
        
        {/* パンくずリスト */}
        <Breadcrumb navigateHome={() => router.push('/')} router={router} />
        
        {/* 検索バー */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="チャンネルを検索"
            onChangeText={onChangeSearch}
            onSubmitEditing={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#666"
            placeholderTextColor="#666"
          />
        </View>
        
        {/* カテゴリー選択 */}
        <View style={styles.categorySelector}>
          <TouchableOpacity
            style={styles.categoryDropdownButton}
            onPress={toggleCategoryDropdown}
          >
            <Text style={styles.categoryButtonText}>
              {INSTRUMENT_CATEGORIES.find(cat => cat.id === currentCategory)?.name || 'カテゴリー選択'}
            </Text>
            <Ionicons
              name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
          
          {showCategoryDropdown && (
            <View style={styles.categoryDropdown}>
              {INSTRUMENT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryDropdownItem,
                    currentCategory === category.id && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleCategoryChange(category.id)}
                >
                  <Ionicons
                    name="musical-notes"
                    size={18}
                    color={currentCategory === category.id ? themeColor : "#fff"}
                  />
                  <Text style={[
                    styles.categoryDropdownItemText,
                    currentCategory === category.id && { color: themeColor }
                  ]}>
                    {category.name}
                  </Text>
                  {currentCategory === category.id && (
                    <Ionicons name="checkmark" size={18} color={themeColor} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* チャンネル一覧 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColor} />
            <Text style={styles.loadingText}>チャンネル情報を読み込み中...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={themeColor} />
            }
            {...panResponder.panHandlers} // ScrollViewにPanResponderを適用
          >
            {/* タグフィルター */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
              {INSTRUMENT_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    selectedTags.includes(tag) && { backgroundColor: themeColor }
                  ]}
                  onPress={() => toggleTagSelection(tag)}
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
            
            {/* チャンネル一覧 */}
            {filteredChannels.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={80} color="#fff" style={{opacity: 0.7, marginBottom: 16}} />
                <Text style={styles.emptyTitle}>チャンネルがありません</Text>
                <Text style={styles.emptyText}>
                  新しいチャンネルを作成するか、検索条件を変更してください。
                </Text>
              </View>
            ) : (
              <View style={styles.channelsContainer}>
                {filteredChannels.map(channel => (
                  <ChannelItemCard 
                    key={channel.id}
                    channel={channel}
                    onPress={() => navigateToChannelDetail(channel.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
        
        {/* チャンネル作成FAB */}
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: themeColor }]}
          onPress={navigateToChannelCreate}
          label="新規チャンネル"
          color="#fff"
        />

        {/* 音楽波形アニメーション */}
        <MusicWaveAnimation />
      </SafeAreaView>
    </MusicGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  tagsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginRight: 8,
  },
  selectedTagButton: {
    backgroundColor: '#6200ee',
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedTagText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  channelsContainer: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#fff',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
  channelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  channelCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  channelImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelTextInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  channelMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelMetaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
  },
  breadcrumbActive: {
    opacity: 0.8,
  },
  breadcrumbActiveText: {
    fontWeight: 'bold',
  },
  categorySelector: {
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
    zIndex: 10,
  },
  categoryDropdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 4,
    maxHeight: 300,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  categoryDropdownItemText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  selectedCategoryItemText: {
    color: '#6200ee',
    fontWeight: '600',
  },
}); 