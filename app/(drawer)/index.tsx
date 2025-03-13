// app/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl, Animated, Easing, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Card, Searchbar, Button, Chip, useTheme, ActivityIndicator, FAB, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import { StatusBar } from 'expo-status-bar';
import MusicFAB from '../../components/MusicFAB';
import { DrawerActions, useNavigation } from '@react-navigation/native';

// チャンネルデータ（楽器カテゴリーごと）
const CHANNELS_BY_CATEGORY = {
  flute: [
    { id: 'flute-beginners', name: '初心者質問', icon: 'help-circle', description: 'フルート初心者のための質問コーナー', members: 1250, unreadCount: 5 },
    { id: 'flute-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'フルートテクニックの共有と議論', members: 980, unreadCount: 0 },
    { id: 'flute-repertoire', name: 'レパートリー', icon: 'musical-notes', description: 'フルート曲の演奏と解釈について', members: 890, unreadCount: 3 },
    { id: 'flute-gear', name: '機材相談', icon: 'hardware-chip', description: 'フルートや関連機材について', members: 760, unreadCount: 2 },
  ],
  clarinet: [
    { id: 'clarinet-beginners', name: '初心者質問', icon: 'help-circle', description: 'クラリネット初心者のための質問コーナー', members: 850, unreadCount: 2 },
    { id: 'clarinet-techniques', name: '演奏テクニック', icon: 'hand-left', description: 'クラリネットテクニックの共有と議論', members: 720, unreadCount: 0 },
    { id: 'clarinet-repertoire', name: 'レパートリー', icon: 'musical-notes', description: 'クラリネット曲の演奏と解釈について', members: 680, unreadCount: 1 },
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
}

// アニメーション付きのアイテムコンポーネント
const AnimatedChannelItem = React.memo(({ item, index, currentInstrument, router }: any) => {
  const itemFade = useRef(new Animated.Value(0)).current;
  const itemSlide = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(itemFade, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(itemSlide, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, itemFade, itemSlide]);
  
  return (
    <Animated.View
      style={{
        opacity: itemFade,
        transform: [{ translateY: itemSlide }],
      }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/channels/${item.id}`)}
        style={styles.recommendedCardContainer}
      >
        <Card style={styles.recommendedCard}>
          <Card.Content style={styles.recommendedContent}>
            <View 
              style={[
                styles.channelIconContainer,
                { backgroundColor: `${currentInstrument?.color}20` || '#7F3DFF20' }
              ]}
            >
              <Ionicons 
                name={(item.icon || 'chatbubbles') as any} 
                size={24} 
                color={currentInstrument?.color || '#7F3DFF'} 
              />
            </View>
            
            <Text style={styles.recommendedName} numberOfLines={1}>{item.name}</Text>
            
            <View style={styles.channelStat}>
              <Ionicons name="people" size={12} color="#AAAAAA" />
              <Text style={styles.channelMembers}>{item.members}人</Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
});

// アニメーション付きのスレッドアイテムコンポーネント
const AnimatedThreadItem = React.memo(({ thread, index, currentInstrument, router }: any) => {
  const itemFade = useRef(new Animated.Value(0)).current;
  const itemSlide = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    const delay = 300 + index * 100; // おすすめチャンネルの後に表示
    Animated.parallel([
      Animated.timing(itemFade, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(itemSlide, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, itemFade, itemSlide]);
  
  return (
    <Animated.View
      style={{
        opacity: itemFade,
        transform: [{ translateY: itemSlide }],
        marginBottom: 12,
      }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/threads/${thread.channelId}/${thread.id}`)}
        style={styles.threadCardContainer}
      >
        <Card style={styles.threadCard}>
          <Card.Content style={styles.threadContent}>
            <View style={styles.threadHeader}>
              <Text style={styles.threadTitle} numberOfLines={2}>{thread.title}</Text>
              <View style={styles.likesContainer}>
                <Ionicons name="heart" size={14} color={currentInstrument?.color || '#7F3DFF'} />
                <Text style={styles.likesCount}>{thread.likes}</Text>
              </View>
            </View>
            
            <Text style={styles.threadContentText} numberOfLines={2}>{thread.content}</Text>
            
            <View style={styles.threadFooter}>
              <Text style={styles.channelLabel}>{thread.channelName}</Text>
              <View style={styles.threadStats}>
                <View style={styles.threadStat}>
                  <Ionicons name="chatbubble-outline" size={12} color="#AAAAAA" />
                  <Text style={styles.statText}>{thread.replies}</Text>
                </View>
                <Text style={styles.threadDate}>{thread.createdAt}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const { userState } = useUser();
  const { channels, getChannelsByCategory, subscribeToHotThreads: dataSubscribeToHotThreads } = useData();
  const { selectedCategories } = userState;
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // アニメーション用の値
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // 選択されている楽器カテゴリー（最初の1つを使用）
  const activeCategory = selectedCategories.length > 0 ? selectedCategories[0] : 'flute';
  
  // 現在の楽器カテゴリー情報
  const currentInstrument = INSTRUMENT_CATEGORIES.find(cat => cat.id === activeCategory);
  
  // 現在のカテゴリーのチャンネル一覧
  const categoryChannels = getChannelsByCategory(activeCategory) as ExtendedChannel[];
  
  // おすすめチャンネルを取得（メンバー数が多い順に3つ）
  const recommendedChannels = [...categoryChannels]
    .sort((a, b) => b.members - a.members)
    .slice(0, 3);
  
  // HOTスレッドを取得する部分を更新
  const [hotThreads, setHotThreads] = useState<any[]>([]);

  // リアルタイムリスナーを使用してHOTスレッドを取得
  useEffect(() => {
    if (!currentInstrument) return;
    
    const unsubscribe = subscribeToHotThreads(currentInstrument.id, 5);
    return () => {
      unsubscribe();
    };
  }, [currentInstrument]);

  // HOTスレッドを購読する関数
  const subscribeToHotThreads = (instrument: string, limit: number) => {
    return dataSubscribeToHotThreads(instrument, limit, (threads) => {
      // チャンネル名を付加
      const threadsWithChannelName = threads.map(thread => {
        const channel = categoryChannels.find(c => c.id === thread.channelId);
        return {
          ...thread,
          channelName: channel?.name || '不明なチャンネル'
        };
      });
      
      setHotThreads(threadsWithChannelName);
    });
  };
  
  // 検索フィルター
  const filteredChannels = searchQuery.trim() 
    ? categoryChannels.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryChannels;

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
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // リフレッシュ処理
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  
  // 画面表示時のアニメーション
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // FlatListのrenderItemコールバック
  const renderChannelItem = useCallback(({ item, index }: { item: ExtendedChannel; index: number }) => (
    <AnimatedChannelItem 
      item={item} 
      index={index} 
      currentInstrument={currentInstrument} 
      router={router} 
    />
  ), [currentInstrument, router]);

  // チャンネル一覧画面に遷移
  const navigateToChannelList = () => {
    router.push('/channels');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 検索バーとチャンネル一覧ボタン */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="チャンネルを検索"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={currentInstrument?.color || '#7F3DFF'}
          onSubmitEditing={handleSearch}
          loading={isLoading}
          inputStyle={{ color: '#FFFFFF', fontSize: 14 }}
          placeholderTextColor="#888888"
        />
        
        <TouchableOpacity 
          style={[styles.channelListButton, { backgroundColor: currentInstrument?.color || '#7F3DFF' }]}
          onPress={navigateToChannelList}
        >
          <Ionicons name="list" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* おすすめチャンネル */}
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ] 
            }
          ]}
        >
          <Text style={styles.sectionTitle}>おすすめチャンネル</Text>
          <FlatList
            data={recommendedChannels}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedList}
            renderItem={renderChannelItem}
          />
        </Animated.View>
        
        {/* HOTスレッド */}
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ] 
            }
          ]}
        >
          <Text style={styles.sectionTitle}>HOTスレッド</Text>
          {hotThreads.map((thread, index) => (
            <AnimatedThreadItem
              key={`${thread.channelId}-${thread.id}`}
              thread={thread}
              index={index}
              currentInstrument={currentInstrument}
              router={router}
            />
          ))}
        </Animated.View>
      </ScrollView>
      
      {/* 五度圏メニューのFAB */}
      <MusicFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    elevation: 2,
    height: 40,
    fontSize: 14,
  },
  channelListButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 80, // FABのスペースを確保
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  recommendedList: {
    paddingRight: 16,
  },
  recommendedCardContainer: {
    width: 140,
    marginRight: 12,
  },
  recommendedCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
  },
  recommendedContent: {
    alignItems: 'center',
    padding: 12,
  },
  recommendedName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  threadCardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  threadCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
  },
  threadContent: {
    padding: 14,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  likesCount: {
    color: '#FFFFFF',
    marginLeft: 3,
    fontSize: 12,
    fontWeight: 'bold',
  },
  threadContentText: {
    fontSize: 13,
    color: '#CCCCCC',
    marginBottom: 10,
    lineHeight: 18,
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelLabel: {
    fontSize: 11,
    color: '#AAAAAA',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  threadStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threadStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  statText: {
    fontSize: 11,
    color: '#AAAAAA',
    marginLeft: 3,
  },
  threadDate: {
    fontSize: 11,
    color: '#AAAAAA',
  },
  channelCardContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  channelCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
  },
  channelContent: {
    flexDirection: 'row',
    padding: 14,
  },
  channelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unreadChip: {
    height: 20,
    borderRadius: 10,
  },
  channelDescription: {
    fontSize: 13,
    color: '#CCCCCC',
    marginBottom: 6,
  },
  channelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  channelMembers: {
    fontSize: 11,
    color: '#AAAAAA',
    marginLeft: 3,
  },
});