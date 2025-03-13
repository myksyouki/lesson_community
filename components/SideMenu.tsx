import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  FlatList,
  Platform,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { useData } from '../contexts/DataContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// 最近訪れたスレッドの型定義
interface RecentThread {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
  timestamp: number;
}

// お気に入りスレッドの型定義
interface FavoriteThread {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
}

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

const MINI_MENU_WIDTH = 70; // 最小表示時の幅
const FULL_MENU_WIDTH = 280; // 展開表示時の幅

export default function SideMenu({ isOpen, onClose, isExpanded: propIsExpanded, onExpandChange }: SideMenuProps) {
  const router = useRouter();
  const { userState } = useUser();
  const { channels, getChannelsByCategory } = useData();
  
  // 状態管理
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChannels, setExpandedChannels] = useState<string[]>([]);
  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [favoriteThreads, setFavoriteThreads] = useState<FavoriteThread[]>([]);
  
  // 外部からのisExpandedプロパティの変更を監視
  useEffect(() => {
    if (propIsExpanded !== undefined) {
      setIsExpanded(propIsExpanded);
    }
  }, [propIsExpanded]);
  
  // アニメーション用の値
  const menuWidth = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  
  // スワイプ検出用のPanResponder
  const menuPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // ミニメニューが表示されている時のみ、右へのスワイプを検出
        return isOpen && !isExpanded && gestureState.dx > 20 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderGrant: () => {
        // スワイプ開始
      },
      onPanResponderMove: (_, gestureState) => {
        // スワイプ中
        if (gestureState.dx > 50) {
          setIsExpanded(true);
        }
      },
      onPanResponderRelease: () => {
        // スワイプ終了
      },
    })
  ).current;
  
  // サンプルデータ（実際の実装では、AsyncStorageなどから取得）
  useEffect(() => {
    // 最近訪れたスレッドのサンプルデータ
    setRecentThreads([
      { id: '1', title: 'フルートの持ち方について', channelId: 'flute-beginners', channelName: '初心者質問', timestamp: Date.now() - 3600000 },
      { id: '2', title: 'ビブラートのかけ方について', channelId: 'flute-techniques', channelName: '演奏テクニック', timestamp: Date.now() - 7200000 },
      { id: '3', title: 'リードの選び方について', channelId: 'clarinet-beginners', channelName: '初心者質問', timestamp: Date.now() - 86400000 },
      { id: '4', title: 'ジャズサックスの即興演奏のコツ', channelId: 'saxophone-jazz', channelName: 'ジャズ演奏', timestamp: Date.now() - 172800000 },
      { id: '5', title: 'ハイノートの出し方', channelId: 'trumpet-jazz', channelName: 'ジャズ演奏', timestamp: Date.now() - 259200000 },
    ]);
    
    // お気に入りスレッドのサンプルデータ
    setFavoriteThreads([
      { id: '101', title: 'フルートの音色を改善するには', channelId: 'flute-beginners', channelName: '初心者質問' },
      { id: '102', title: 'ビブラートの付け方がわかりません', channelId: 'flute-techniques', channelName: '演奏テクニック' },
      { id: '103', title: 'リード作りの基本道具', channelId: 'oboe-reeds', channelName: 'リード作り' },
    ]);
  }, []);
  
  // メニューの開閉状態が変わったときの処理
  useEffect(() => {
    if (isOpen) {
      // メニューを開く
      Animated.parallel([
        Animated.timing(menuWidth, {
          toValue: isExpanded ? FULL_MENU_WIDTH : MINI_MENU_WIDTH,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(menuOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // メニューを閉じる
      Animated.parallel([
        Animated.timing(menuWidth, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(menuOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsExpanded(false);
      });
    }
  }, [isOpen, isExpanded]);
  
  // メニューの展開状態が変わったときの処理
  useEffect(() => {
    if (isOpen) {
      Animated.timing(menuWidth, {
        toValue: isExpanded ? FULL_MENU_WIDTH : MINI_MENU_WIDTH,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isExpanded]);
  
  // メニューの展開/折りたたみを切り替える
  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // 親コンポーネントに展開状態の変更を通知
    if (onExpandChange) {
      onExpandChange(newExpandedState);
    }
  };
  
  // チャンネルの展開/折りたたみを切り替える
  const toggleChannel = (channelId: string) => {
    setExpandedChannels(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      } else {
        return [...prev, channelId];
      }
    });
  };
  
  // スレッドをタップしたときの処理
  const handleThreadPress = (channelId: string, threadId: string) => {
    // 最近訪れたスレッドに追加（実際の実装では、AsyncStorageなどに保存）
    const newRecentThread = {
      id: threadId,
      title: 'タップしたスレッド', // 実際には、スレッドのタイトルを取得
      channelId,
      channelName: 'チャンネル名', // 実際には、チャンネル名を取得
      timestamp: Date.now(),
    };
    
    setRecentThreads(prev => {
      // 既に存在する場合は削除
      const filtered = prev.filter(thread => thread.id !== threadId);
      // 先頭に追加
      return [newRecentThread, ...filtered].slice(0, 5);
    });
    
    // スレッド画面に遷移
    router.push(`/threads/${channelId}/${threadId}`);
    
    // メニューを閉じる
    onClose();
  };
  
  // お気に入りスレッドをタップしたときの処理
  const handleFavoritePress = (channelId: string, threadId: string) => {
    // スレッド画面に遷移
    router.push(`/threads/${channelId}/${threadId}`);
    
    // メニューを閉じる
    onClose();
  };
  
  // チャンネルをタップしたときの処理
  const handleChannelPress = (channelId: string) => {
    // チャンネル画面に遷移
    router.push(`/channels/${channelId}`);
    
    // メニューを閉じる
    onClose();
  };
  
  // 検索処理
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 検索処理（実際の実装では、検索結果画面に遷移など）
      console.log('検索:', searchQuery);
    }
  };
  
  // 設定画面に遷移
  const goToSettings = () => {
    router.push('/settings');
    onClose();
  };
  
  // プロフィール画面に遷移
  const goToProfile = () => {
    router.push('/profile');
    onClose();
  };
  
  // ホーム画面に遷移
  const goToHome = () => {
    router.push('/');
    onClose();
  };
  
  // 楽器カテゴリー画面に遷移
  const goToCategory = () => {
    router.push('/category');
    onClose();
  };
  
  // 最小表示時のメニュー
  const renderMiniMenu = () => (
    <View style={styles.miniMenuContainer}>
      {/* 展開ボタン */}
      <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* よく使う機能 */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={goToHome}>
        <Ionicons name="home" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* 最近訪れたスレッド（最大3件） */}
      {recentThreads.slice(0, 3).map((thread, index) => (
        <TouchableOpacity
          key={`mini-recent-${index}`}
          style={styles.miniMenuItem}
          onPress={() => handleThreadPress(thread.channelId, thread.id)}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#CCCCCC" />
        </TouchableOpacity>
      ))}
      
      {/* 検索アイコン */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={toggleExpand}>
        <Ionicons name="search" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* プロフィールアイコン */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={goToProfile}>
        <Ionicons name="person" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* 設定 / プロフィール */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={goToSettings}>
        <Ionicons name="settings" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
  
  // 展開時のメニュー
  const renderFullMenu = () => (
    <View style={styles.fullMenuContainer}>
      {/* ヘッダー */}
      <View style={styles.menuHeader}>
        <TouchableOpacity style={styles.collapseButton} onPress={toggleExpand}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.menuTitle}>メニュー</Text>
      </View>
      
      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#AAAAAA" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="チャンネル & スレッド検索"
          placeholderTextColor="#888888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
      </View>
      
      {/* スクロール可能なコンテンツ */}
      <ScrollView style={styles.menuScrollContent}>
        {/* ナビゲーションリンク */}
        <View style={styles.navLinks}>
          <TouchableOpacity style={styles.navLink} onPress={goToHome}>
            <Ionicons name="home" size={22} color="#FFFFFF" />
            <Text style={styles.navLinkText}>ホーム</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navLink} onPress={goToCategory}>
            <Ionicons name="musical-notes" size={22} color="#FFFFFF" />
            <Text style={styles.navLinkText}>楽器カテゴリー</Text>
          </TouchableOpacity>
        </View>
        
        {/* お気に入りスレッド */}
        {favoriteThreads.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.sectionTitle}>お気に入りスレッド</Text>
            </View>
            
            {favoriteThreads.map((thread, index) => (
              <TouchableOpacity
                key={`favorite-${index}`}
                style={styles.threadItem}
                onPress={() => handleFavoritePress(thread.channelId, thread.id)}
              >
                <Ionicons name="bookmark" size={16} color="#FFD700" style={styles.threadIcon} />
                <View style={styles.threadInfo}>
                  <Text style={styles.threadTitle} numberOfLines={1}>{thread.title}</Text>
                  <Text style={styles.channelName}>{thread.channelName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* 最近訪れたスレッド */}
        {recentThreads.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={18} color="#7F3DFF" />
              <Text style={styles.sectionTitle}>最近訪れたスレッド</Text>
            </View>
            
            {recentThreads.slice(0, 5).map((thread, index) => (
              <TouchableOpacity
                key={`recent-${index}`}
                style={styles.threadItem}
                onPress={() => handleThreadPress(thread.channelId, thread.id)}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color="#7F3DFF" style={styles.threadIcon} />
                <View style={styles.threadInfo}>
                  <Text style={styles.threadTitle} numberOfLines={1}>{thread.title}</Text>
                  <Text style={styles.channelName}>{thread.channelName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* チャンネルリスト */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={18} color="#3DB0FF" />
            <Text style={styles.sectionTitle}>チャンネル</Text>
          </View>
          
          {channels.map((channel, index) => (
            <View key={`channel-${index}`}>
              <TouchableOpacity
                style={styles.channelItem}
                onPress={() => toggleChannel(channel.id)}
              >
                <Ionicons
                  name={expandedChannels.includes(channel.id) ? "chevron-down" : "chevron-forward"}
                  size={18}
                  color="#CCCCCC"
                  style={styles.channelIcon}
                />
                <Text style={styles.channelTitle}>{channel.name}</Text>
                <TouchableOpacity
                  style={styles.channelGoButton}
                  onPress={() => handleChannelPress(channel.id)}
                >
                  <Ionicons name="arrow-forward-circle" size={20} color="#3DB0FF" />
                </TouchableOpacity>
              </TouchableOpacity>
              
              {/* チャンネルが展開されている場合、スレッドを表示 */}
              {expandedChannels.includes(channel.id) && channel.threads && (
                <View style={styles.threadList}>
                  {channel.threads.slice(0, 5).map((thread, threadIndex) => (
                    <TouchableOpacity
                      key={`thread-${threadIndex}`}
                      style={styles.threadItem}
                      onPress={() => handleThreadPress(channel.id, thread.id)}
                    >
                      <Ionicons name="chatbubble-outline" size={14} color="#AAAAAA" style={styles.threadIcon} />
                      <Text style={styles.threadTitle} numberOfLines={1}>{thread.title}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* スレッドが5件以上ある場合、「さらに見る」ボタンを表示 */}
                  {channel.threads.length > 5 && (
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => handleChannelPress(channel.id)}
                    >
                      <Text style={styles.moreButtonText}>さらに見る...</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* 新規スレッド作成ボタン */}
                  <TouchableOpacity
                    style={styles.newThreadButton}
                    onPress={() => {
                      router.push(`/channels/${channel.id}?newThread=true`);
                      onClose();
                    }}
                  >
                    <Ionicons name="add-circle" size={14} color="#3DB0FF" style={styles.threadIcon} />
                    <Text style={styles.newThreadText}>新規スレッド作成</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* フッター */}
      <View style={styles.menuFooter}>
        <TouchableOpacity style={styles.footerButton} onPress={goToProfile}>
          <Ionicons name="person" size={22} color="#FFFFFF" />
          <Text style={styles.footerButtonText}>プロフィール</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerButton} onPress={goToSettings}>
          <Ionicons name="settings" size={22} color="#FFFFFF" />
          <Text style={styles.footerButtonText}>設定</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <>
      {/* メニュー外側のオーバーレイ - メニューが開いている時のみ表示 */}
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
      )}
      
      <Animated.View
        style={[
          styles.container,
          {
            width: menuWidth,
            opacity: menuOpacity,
          },
        ]}
        {...menuPanResponder.panHandlers}
      >
        <LinearGradient
          colors={['#1E1E2E', '#121218']}
          style={styles.background}
        />
        
        {isExpanded ? renderFullMenu() : renderMiniMenu()}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    zIndex: 1000,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  miniMenuContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(127, 61, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  miniMenuItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(40, 40, 60, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  fullMenuContainer: {
    flex: 1,
    width: FULL_MENU_WIDTH,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  collapseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(127, 61, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#FFFFFF',
    fontSize: 16,
  },
  menuScrollContent: {
    flex: 1,
  },
  navLinks: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navLinkText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  threadIcon: {
    marginRight: 8,
  },
  threadInfo: {
    flex: 1,
  },
  threadTitle: {
    fontSize: 14,
    color: '#EEEEEE',
  },
  channelName: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 2,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  channelIcon: {
    marginRight: 8,
  },
  channelTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  channelGoButton: {
    padding: 4,
  },
  threadList: {
    paddingLeft: 24,
    backgroundColor: 'rgba(20, 20, 30, 0.5)',
  },
  moreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 13,
    color: '#7F3DFF',
  },
  newThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  newThreadText: {
    fontSize: 14,
    color: '#3DB0FF',
  },
  menuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 