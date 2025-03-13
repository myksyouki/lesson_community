import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated as RNAnimated, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, Card, Chip, FAB, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import MusicFAB from '../../components/MusicFAB';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 画面サイズを取得
const { width } = Dimensions.get('window');

// チャンネルデータ
const CHANNELS = {
  'flute-beginners': { name: '初心者質問', category: 'flute', icon: 'help-circle', color: '#7F3DFF' },
  'flute-techniques': { name: '演奏テクニック', category: 'flute', icon: 'hand-left', color: '#7F3DFF' },
  'flute-repertoire': { name: 'レパートリー', category: 'flute', icon: 'musical-notes', color: '#7F3DFF' },
  'flute-gear': { name: '機材相談', category: 'flute', icon: 'hardware-chip', color: '#7F3DFF' },
  'clarinet-beginners': { name: '初心者質問', category: 'clarinet', icon: 'help-circle', color: '#FF3D77' },
  'clarinet-techniques': { name: '演奏テクニック', category: 'clarinet', icon: 'hand-left', color: '#FF3D77' },
  'clarinet-repertoire': { name: 'レパートリー', category: 'clarinet', icon: 'musical-notes', color: '#FF3D77' },
  'oboe-beginners': { name: '初心者質問', category: 'oboe', icon: 'help-circle', color: '#3D7FFF' },
  'oboe-techniques': { name: '演奏テクニック', category: 'oboe', icon: 'hand-left', color: '#3D7FFF' },
  'oboe-reeds': { name: 'リード作り', category: 'oboe', icon: 'construct', color: '#3D7FFF' },
  'saxophone-beginners': { name: '初心者質問', category: 'saxophone', icon: 'help-circle', color: '#3DFFCF' },
  'saxophone-techniques': { name: '演奏テクニック', category: 'saxophone', icon: 'hand-left', color: '#3DFFCF' },
  'saxophone-jazz': { name: 'ジャズ演奏', category: 'saxophone', icon: 'musical-notes', color: '#3DFFCF' },
  'trumpet-beginners': { name: '初心者質問', category: 'trumpet', icon: 'help-circle', color: '#FFD93D' },
  'trumpet-techniques': { name: '演奏テクニック', category: 'trumpet', icon: 'hand-left', color: '#FFD93D' },
  'trumpet-jazz': { name: 'ジャズ演奏', category: 'trumpet', icon: 'musical-notes', color: '#FFD93D' },
};

// スレッドデータ（チャンネルごと）
const THREADS_BY_CHANNEL = {
  'flute-beginners': [
    { id: '1', title: 'フルートの持ち方について', author: 'フルート初心者', createdAt: '2時間前', replies: 12, unread: true },
    { id: '2', title: '息の吹き込み方がわかりません', author: '練習中', createdAt: '5時間前', replies: 8, unread: false },
    { id: '3', title: '初めてのフルート選び', author: 'フルート購入検討中', createdAt: '1日前', replies: 24, unread: true },
    { id: '4', title: 'タンギングのコツを教えてください', author: 'タンギング苦手', createdAt: '2日前', replies: 15, unread: false },
    { id: '5', title: '音が出ません', author: '練習開始1週間', createdAt: '3日前', replies: 19, unread: false },
  ],
  'flute-techniques': [
    { id: '1', title: 'ビブラートのかけ方について', author: 'フルート愛好家', createdAt: '3時間前', replies: 7, unread: true },
    { id: '2', title: '高音域の出し方のコツ', author: '高音練習中', createdAt: '1日前', replies: 14, unread: false },
    { id: '3', title: 'ダブルタンギングのやり方', author: '速弾き練習中', createdAt: '2日前', replies: 9, unread: true },
  ],
  'clarinet-beginners': [
    { id: '1', title: 'リードの選び方について', author: 'クラリネット初心者', createdAt: '1時間前', replies: 9, unread: true },
    { id: '2', title: '音階の練習方法がわかりません', author: '練習初心者', createdAt: '6時間前', replies: 15, unread: false },
    { id: '3', title: '初めてのクラリネット選び', author: 'クラリネット購入検討中', createdAt: '2日前', replies: 20, unread: true },
  ],
  'saxophone-jazz': [
    { id: '1', title: 'ジャズサックスの即興演奏のコツ', author: 'ジャズサックス志望', createdAt: '5時間前', replies: 13, unread: true },
    { id: '2', title: 'ブルーノートの使い方について', author: 'ジャズ理論研究家', createdAt: '1日前', replies: 8, unread: false },
    { id: '3', title: 'ブルースの吹き方', author: 'ブルース好き', createdAt: '3日前', replies: 6, unread: false },
  ],
  'oboe-reeds': [
    { id: '1', title: 'リード作りの基本道具', author: 'オーボエ奏者', createdAt: '4時間前', replies: 11, unread: true },
    { id: '2', title: 'リードの調整方法について', author: 'リード調整中', createdAt: '1日前', replies: 7, unread: false },
    { id: '3', title: '良いケーンの選び方', author: 'リード作り初心者', createdAt: '3日前', replies: 9, unread: true },
  ],
  'trumpet-jazz': [
    { id: '1', title: 'ハイノートの出し方', author: 'トランペット奏者', createdAt: '2時間前', replies: 8, unread: true },
    { id: '2', title: 'マイルス・デイビスのようなミュートの使い方', author: 'ジャズ好き', createdAt: '1日前', replies: 12, unread: false },
    { id: '3', title: 'ジャズでのアドリブのコツ', author: 'アドリブ練習中', createdAt: '2日前', replies: 15, unread: true },
  ],
};

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

export default function ChannelScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams();
  const { userState } = useUser();
  const { getChannel } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // スワイプアニメーション用の値
  const translateX = new RNAnimated.Value(0);
  
  // チャンネル情報
  const channel = getChannel(channelId as string);
  
  // 現在の楽器カテゴリー情報
  const currentInstrument = INSTRUMENT_CATEGORIES.find(cat => cat.id === channel?.category);
  
  // チャンネルのスレッド一覧
  const threads = channel?.threads || [];
  
  // 検索フィルター
  const filteredThreads = searchQuery.trim() 
    ? threads.filter(thread => 
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads;

  // ローディング効果
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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
    router.push(`/threads/create?channelId=${channelId}`);
  };

  // スワイプジェスチャーのハンドラ
  const onGestureEvent = (event: any) => {
    // 右方向へのスワイプのみ処理
    if (event.nativeEvent.translationX > 0) {
      translateX.setValue(event.nativeEvent.translationX);
    }
  };

  // スワイプジェスチャー終了時の処理
  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === 4) {
      // スワイプが一定距離以上なら戻る
      if (event.nativeEvent.translationX > 100) {
        // アニメーションを完了させてから遷移
        RNAnimated.timing(translateX, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          router.back();
        });
      } else {
        // 元の位置に戻す
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // グローバルステートを使用してナビゲーション情報を共有
  // 注: 実際の実装では、専用のコンテキストを作成するか、状態管理ライブラリを使用することをお勧めします
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <RNAnimated.View style={{ flex: 1, transform: [{ translateX }], backgroundColor: '#121212' }}>
          <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            
            <View style={styles.header}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor="#FFFFFF"
                onPress={() => router.back()}
                style={styles.backButton}
              />
              
              <View style={styles.headerContent}>
                <View style={[styles.channelIconContainer, { backgroundColor: currentInstrument?.color + '33' }]}>
                  <Ionicons 
                    name={'chatbubbles'} 
                    size={20} 
                    color={currentInstrument?.color || '#7F3DFF'} 
                  />
                </View>
                
                <View>
                  <Text style={styles.channelName}>{channel.name}</Text>
                  <Text style={styles.categoryName}>{currentInstrument?.name}</Text>
                </View>
              </View>
            </View>

            <Searchbar
              placeholder="スレッドを検索"
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchBar}
              iconColor="#7F3DFF"
              onSubmitEditing={handleSearch}
              loading={isLoading}
            />

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentInstrument?.color || '#7F3DFF'} />
              </View>
            ) : (
              <FlatList
                data={filteredThreads}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.threadList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color="#666" />
                    <Text style={styles.emptyText}>スレッドがありません</Text>
                    <Text style={styles.emptySubtext}>新しいスレッドを作成しましょう</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => router.push(`/threads/${channelId}/${item.id}`)}
                  >
                    <Card style={styles.threadCard}>
                      <Card.Content>
                        <View style={styles.threadHeader}>
                          <Text style={styles.threadTitle}>{item.title}</Text>
                          {!item.isLiked && (
                            <View style={[styles.unreadDot, { backgroundColor: currentInstrument?.color || '#7F3DFF' }]} />
                          )}
                        </View>
                        
                        <View style={styles.threadMeta}>
                          <Text style={styles.threadAuthor}>{item.author.name}</Text>
                          <Text style={styles.threadTime}>{new Date(item.createdAt).toLocaleDateString('ja-JP')}</Text>
                        </View>
                        
                        <View style={styles.threadFooter}>
                          <Text style={styles.replyCount}>
                            <Ionicons name="chatbubble-outline" size={14} /> {item.replies}件の返信
                          </Text>
                          <Text style={styles.likeCount}>
                            <Ionicons name="heart-outline" size={14} /> {item.likes}
                          </Text>
                        </View>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                )}
              />
            )}
            
            <FAB
              style={[styles.fab, { backgroundColor: currentInstrument?.color || '#7F3DFF' }]}
              icon="plus"
              onPress={handleCreateThread}
            />
            
            <MusicFAB isChannelScreen={true} />
          </SafeAreaView>
        </RNAnimated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  backLink: {
    fontSize: 16,
    color: '#7F3DFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  channelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryName: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  searchBar: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    elevation: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadList: {
    paddingHorizontal: 16,
    paddingBottom: 80, // FABの分の余白
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 8,
  },
  threadCard: {
    marginBottom: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    elevation: 0,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  threadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  threadAuthor: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  threadTime: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  replyCount: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  likeCount: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 