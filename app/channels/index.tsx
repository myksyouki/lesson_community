import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Searchbar, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import MusicFAB from '../../components/MusicFAB';
import { LinearGradient } from 'expo-linear-gradient';
import { FAB } from 'react-native-paper';

// 画面サイズを取得
const { width } = Dimensions.get('window');

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

// ブレッドクラムナビゲーション
function BreadcrumbNavigation({ categoryName }: { categoryName: string }) {
  const router = useRouter();
  
  return (
    <View style={styles.breadcrumbContainer}>
      <LinearGradient
        colors={['rgba(30, 30, 46, 0.8)', 'rgba(20, 20, 30, 0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.breadcrumbGradient}
      >
        <TouchableOpacity 
          style={styles.breadcrumbItem}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={16} color="#FFFFFF" />
          <Text style={styles.breadcrumbText}>ホーム</Text>
        </TouchableOpacity>
        
        <View style={styles.breadcrumbSeparatorContainer}>
          <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
        </View>
        
        <View style={styles.breadcrumbActiveItem}>
          <Ionicons name="list" size={16} color="#FFFFFF" />
          <Text style={styles.breadcrumbActiveText}>{categoryName}チャンネル</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// チャンネルアイテムコンポーネント
const ChannelItem = ({ channel, router, currentInstrument }: any) => (
  <TouchableOpacity
    style={styles.channelCardContainer}
    onPress={() => router.push(`/channels/${channel.id}`)}
  >
    <Card style={styles.channelCard}>
      <Card.Content style={styles.channelContent}>
        <View 
          style={[
            styles.channelIconContainer,
            { backgroundColor: `${currentInstrument?.color}30` || '#7F3DFF30' }
          ]}
        >
          <Ionicons 
            name={(channel.icon || 'chatbubbles') as any} 
            size={24} 
            color={currentInstrument?.color || '#7F3DFF'} 
          />
        </View>
        
        <View style={styles.channelInfo}>
          <Text style={styles.channelName}>{channel.name}</Text>
          <Text style={styles.channelDescription} numberOfLines={2}>
            {channel.description}
          </Text>
          <View style={styles.channelFooter}>
            <View style={styles.channelStat}>
              <Ionicons name="people-outline" size={12} color="#AAAAAA" />
              <Text style={styles.channelMembers}>{channel.members}人</Text>
            </View>
            <View style={styles.channelStat}>
              <Ionicons name="chatbubbles-outline" size={12} color="#AAAAAA" />
              <Text style={styles.channelMembers}>
                {channel.threads?.length || 0}スレッド
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  </TouchableOpacity>
);

export default function ChannelsScreen() {
  const router = useRouter();
  const { userState, canCreateChannel } = useUser();
  const { channels, getChannelsByCategory } = useData();
  const { selectedCategories } = userState;
  const [searchQuery, setSearchQuery] = useState('');
  // 作成制限のメッセージ表示の状態
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  
  // 選択されている楽器カテゴリー（最初の1つを使用）
  const activeCategory = selectedCategories.length > 0 ? selectedCategories[0] : 'flute';
  
  // 現在の楽器カテゴリー情報
  const currentInstrument = INSTRUMENT_CATEGORIES.find(cat => cat.id === activeCategory);
  
  // 現在のカテゴリーのチャンネル一覧
  const categoryChannels = getChannelsByCategory(activeCategory) || [];
  
  const onChangeSearch = (query: string) => setSearchQuery(query);

  // チャンネル作成ページへ移動
  const handleCreateChannel = () => {
    if (canCreateChannel()) {
      router.push('/channels/create');
    } else {
      // 作成上限に達している場合はメッセージを表示
      setShowLimitMessage(true);
      
      // 3秒後にメッセージを非表示に
      setTimeout(() => {
        setShowLimitMessage(false);
      }, 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* ブレッドクラムナビゲーション */}
      <BreadcrumbNavigation 
        categoryName={currentInstrument?.name || 'フルート'} 
      />
      
      {/* 検索バーとチャンネル作成ボタン */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="チャンネルを検索"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#7F3DFF"
          inputStyle={{ color: '#FFFFFF', fontSize: 14 }}
          placeholderTextColor="#888888"
        />
        
        <TouchableOpacity 
          style={[styles.createChannelButton, { backgroundColor: currentInstrument?.color || '#7F3DFF' }]}
          onPress={handleCreateChannel}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* チャンネル作成制限メッセージ */}
      {showLimitMessage && (
        <View style={styles.limitMessageContainer}>
          <Text style={styles.limitMessageText}>
            作成できるチャンネルは3つまでです
          </Text>
        </View>
      )}
      
      {/* チャンネル一覧 */}
      <FlatList
        data={categoryChannels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChannelItem 
            channel={item} 
            router={router} 
            currentInstrument={currentInstrument}
          />
        )}
        contentContainerStyle={styles.channelsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#444444" />
            <Text style={styles.emptyText}>チャンネルが見つかりません</Text>
          </View>
        }
      />
      
      {/* チャンネル作成FAB */}
      <FAB
        style={[styles.fab, { backgroundColor: currentInstrument?.color || '#7F3DFF' }]}
        icon="plus"
        onPress={handleCreateChannel}
      />
      
      {/* 五度圏メニューのFAB */}
      <MusicFAB />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  breadcrumbContainer: {
    marginBottom: 10,
  },
  breadcrumbGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
  },
  breadcrumbSeparatorContainer: {
    marginHorizontal: 8,
  },
  breadcrumbActiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbActiveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    elevation: 0,
    height: 40,
    flex: 1,
  },
  createChannelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  channelsList: {
    paddingHorizontal: 16,
  },
  channelCardContainer: {
    marginBottom: 10,
  },
  channelCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 1,
  },
  channelContent: {
    padding: 14,
  },
  channelIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelInfo: {
    width: '100%',
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 18,
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
    fontSize: 12,
    color: '#AAAAAA',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#AAAAAA',
    marginTop: 16,
    fontSize: 16,
  },
  limitMessageContainer: {
    backgroundColor: 'rgba(255, 87, 87, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
  },
  limitMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    borderRadius: 28,
  },
}); 