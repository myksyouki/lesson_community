// app/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Card, Searchbar, Button, Chip, useTheme, ActivityIndicator, FAB } from 'react-native-paper';
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

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const { userState } = useUser();
  const { channels, getChannelsByCategory } = useData();
  const { selectedCategories } = userState;
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 選択されている楽器カテゴリー（最初の1つを使用）
  const activeCategory = selectedCategories.length > 0 ? selectedCategories[0] : 'flute';
  
  // 現在の楽器カテゴリー情報
  const currentInstrument = INSTRUMENT_CATEGORIES.find(cat => cat.id === activeCategory);
  
  // 現在のカテゴリーのチャンネル一覧
  const categoryChannels = getChannelsByCategory(activeCategory);
  
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 楽器バッジとタイトル */}
      <View style={styles.subHeader}>
        <View style={styles.instrumentBadge}>
          <Ionicons 
            name={(currentInstrument?.icon || 'musical-notes') as any} 
            size={24} 
            color={currentInstrument?.color || '#7F3DFF'} 
          />
          <Text style={styles.instrumentName}>{currentInstrument?.name || '楽器'}</Text>
        </View>
        
        <Text style={styles.title}>チャンネル一覧</Text>
      </View>

      <Searchbar
        placeholder="チャンネルを検索"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={currentInstrument?.color || '#7F3DFF'}
        onSubmitEditing={handleSearch}
        loading={isLoading}
        inputStyle={{ color: '#FFFFFF' }}
        placeholderTextColor="#888888"
      />

      <FlatList
        data={filteredChannels}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.channelList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/channels/${item.id}`)}
            style={styles.channelCardContainer}
          >
            <Card style={styles.channelCard}>
              <Card.Content style={styles.channelContent}>
                <View 
                  style={[
                    styles.channelIconContainer,
                    { backgroundColor: `${currentInstrument?.color}20` || '#7F3DFF20' }
                  ]}
                >
                  <Ionicons 
                    name={(item.icon || 'chatbubbles') as any} 
                    size={28} 
                    color={currentInstrument?.color || '#7F3DFF'} 
                  />
                </View>
                
                <View style={styles.channelInfo}>
                  <View style={styles.channelHeader}>
                    <Text style={styles.channelName}>{item.name}</Text>
                    {item.threads && item.threads.length > 0 && (
                      <Chip 
                        mode="flat" 
                        style={[styles.unreadChip, { backgroundColor: currentInstrument?.color || '#7F3DFF' }]}
                      >
                        {item.threads.length}
                      </Chip>
                    )}
                  </View>
                  
                  <Text style={styles.channelDescription}>{item.description}</Text>
                  
                  <View style={styles.channelFooter}>
                    <View style={styles.channelStat}>
                      <Ionicons name="people" size={14} color="#AAAAAA" />
                      <Text style={styles.channelMembers}>{item.members}人</Text>
                    </View>
                    
                    {item.unreadCount > 0 && (
                      <View style={styles.channelStat}>
                        <Ionicons name="chatbubble-ellipses" size={14} color="#AAAAAA" />
                        <Text style={styles.channelMembers}>{item.unreadCount}件の未読</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
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
  subHeader: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  instrumentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  instrumentName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  searchBar: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    elevation: 2,
    height: 50,
  },
  channelList: {
    paddingHorizontal: 16,
    paddingBottom: 80, // FABのスペースを確保
  },
  channelCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  channelCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
  },
  channelContent: {
    flexDirection: 'row',
    padding: 16,
  },
  channelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  channelInfo: {
    flex: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  channelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unreadChip: {
    height: 24,
    borderRadius: 12,
  },
  channelDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  channelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  channelMembers: {
    fontSize: 12,
    color: '#AAAAAA',
    marginLeft: 4,
  },
});