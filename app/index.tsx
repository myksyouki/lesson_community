import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, PanResponder } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useSideMenu } from '../contexts/SideMenuContext';
import MusicGradientBackground from '../components/MusicGradientBackground';
import MusicWaveAnimation from '../components/MusicWaveAnimation';
import { INSTRUMENT_CATEGORIES, getThemeForCategory } from '../theme/musicThemes';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { userState, getCategoryThemeColor } = useUser();
  const { isMenuOpen, openMenu, closeMenu } = useSideMenu();
  
  // 選択されているカテゴリーとテーマカラーを取得
  const selectedCategory = userState.selectedCategories[0] || 'flute';
  const themeColor = getCategoryThemeColor();
  
  // 最近のアクティビティ（サンプルデータ）
  const recentActivities = [
    { id: '1', type: 'thread', title: 'ジャズピアノの練習法', channel: 'ピアノ', time: '2時間前', category: 'piano' },
    { id: '2', type: 'comment', title: 'サックスのリード選び', channel: 'サックス', time: '昨日', category: 'saxophone' },
    { id: '3', type: 'like', title: 'ベースの弾き方講座', channel: 'ベース', time: '3日前', category: 'bass' },
    { id: '4', type: 'thread', title: 'フルートの吹き方の基本', channel: 'フルート', time: '1日前', category: 'flute' },
    { id: '5', type: 'like', title: 'クラリネットのメンテナンス', channel: 'クラリネット', time: '4日前', category: 'clarinet' },
  ];
  
  // おすすめチャンネル（サンプルデータ）
  const recommendedChannels = [
    { id: '1', name: 'ジャズ', members: 1240, icon: '🎷', category: 'saxophone' },
    { id: '2', name: 'クラシック', members: 890, icon: '🎻', category: 'violin' },
    { id: '3', name: 'ロック', members: 1560, icon: '🎸', category: 'guitar' },
    { id: '4', name: 'ヒップホップ', members: 1120, icon: '🎤', category: 'vocals' },
    { id: '5', name: 'フルート', members: 750, icon: '🎵', category: 'flute' },
    { id: '6', name: 'クラリネット', members: 680, icon: '🎵', category: 'clarinet' },
    { id: '7', name: 'トランペット', members: 920, icon: '🎺', category: 'trumpet' },
  ];
  
  // 人気のスレッド（サンプルデータ）
  const popularThreads = [
    { id: '1', title: '初心者におすすめの楽器は？', channel: '音楽全般', comments: 42, likes: 78, category: 'general' },
    { id: '2', title: 'ジャズセッションの参加方法', channel: 'ジャズ', comments: 23, likes: 56, category: 'saxophone' },
    { id: '3', title: 'DTMソフトの選び方', channel: '音楽制作', comments: 35, likes: 62, category: 'production' },
    { id: '4', title: 'フルートの練習方法について', channel: 'フルート', comments: 28, likes: 45, category: 'flute' },
    { id: '5', title: 'クラリネットのリードの選び方', channel: 'クラリネット', comments: 19, likes: 38, category: 'clarinet' },
  ];
  
  // ユーザーが選択したカテゴリーに基づいてコンテンツをフィルタリング
  const filteredActivities = recentActivities.filter(activity => 
    activity.category === selectedCategory || activity.category === 'general'
  );
  
  const filteredChannels = recommendedChannels.filter(channel => 
    channel.category === selectedCategory || channel.category === 'general'
  );
  
  const filteredThreads = popularThreads.filter(thread => 
    thread.category === selectedCategory || thread.category === 'general'
  );
  
  // チャンネル一覧へ移動
  const navigateToChannels = () => {
    router.push('/channels');
  };
  
  // プロフィールへ移動
  const navigateToProfile = () => {
    router.push('/profile');
  };
  
  // 設定へ移動
  const navigateToSettings = () => {
    router.push('/settings');
  };
  
  // 右スワイプでサイドメニューを開くための処理
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          // 右スワイプでサイドメニューを開く
          openMenu();
        }
      },
    })
  ).current;
  
  return (
    <View {...panResponder.panHandlers} style={styles.container}>
      <MusicGradientBackground theme={getThemeForCategory(selectedCategory)} opacity={0.98}>
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
            <Text style={styles.headerTitle}>Music Community</Text>
            <IconButton
              icon="bell-outline"
              iconColor="#fff"
              size={24}
              onPress={() => console.log('通知ボタンが押されました')}
            />
          </View>
          
          {/* メインコンテンツ */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* ユーザーウェルカム */}
            <View style={styles.welcomeSection}>
              <MusicWaveAnimation color="#fff" count={3} height={60} position="top" opacity={0.3} />
              <Text style={styles.welcomeText}>
                こんにちは、{userState?.username || 'ゲスト'}さん
              </Text>
              <Text style={styles.welcomeSubText}>
                音楽コミュニティへようこそ！
              </Text>
              <View style={[styles.selectedCategoryBadge, { backgroundColor: `${themeColor}50` }]}>
                <Text style={styles.selectedCategoryText}>
                  選択カテゴリー：{INSTRUMENT_CATEGORIES.find(cat => cat.id === selectedCategory)?.name || 'なし'}
                </Text>
              </View>
            </View>
            
            {/* クイックアクセス */}
            <View style={styles.quickAccessSection}>
              <Text style={styles.sectionTitle}>クイックアクセス</Text>
              <View style={styles.quickAccessButtons}>
                <TouchableOpacity 
                  style={[styles.quickAccessButton, { borderColor: themeColor }]}
                  onPress={navigateToChannels}
                >
                  <Ionicons name="list" size={24} color={themeColor} />
                  <Text style={[styles.quickAccessText, { color: themeColor }]}>チャンネル一覧</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickAccessButton, { borderColor: themeColor }]}
                  onPress={navigateToProfile}
                >
                  <Ionicons name="person" size={24} color={themeColor} />
                  <Text style={[styles.quickAccessText, { color: themeColor }]}>プロフィール</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickAccessButton, { borderColor: themeColor }]}
                  onPress={navigateToSettings}
                >
                  <Ionicons name="settings" size={24} color={themeColor} />
                  <Text style={[styles.quickAccessText, { color: themeColor }]}>設定</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* おすすめチャンネル */}
            <View style={styles.recommendedSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>おすすめチャンネル</Text>
                <TouchableOpacity onPress={navigateToChannels}>
                  <Text style={[styles.seeAllText, { color: themeColor }]}>すべて見る</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedChannelsContainer}
              >
                {filteredChannels.length > 0 ? (
                  filteredChannels.map(channel => (
                    <TouchableOpacity 
                      key={channel.id} 
                      style={[styles.channelCard, { borderColor: `${themeColor}50` }]}
                      onPress={() => router.push(`/channels/${channel.id}`)}
                    >
                      <Text style={styles.channelIcon}>{channel.icon}</Text>
                      <Text style={styles.channelName}>{channel.name}</Text>
                      <Text style={styles.channelMembers}>{channel.members}人</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyContentContainer}>
                    <Text style={styles.emptyContentText}>
                      現在表示できるチャンネルはありません。
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
            
            {/* 人気のスレッド */}
            <View style={styles.popularSection}>
              <Text style={styles.sectionTitle}>人気のスレッド</Text>
              {filteredThreads.length > 0 ? (
                filteredThreads.map(thread => (
                  <TouchableOpacity 
                    key={thread.id} 
                    style={[styles.threadCard, { borderColor: `${themeColor}30` }]}
                    onPress={() => console.log(`スレッド ${thread.id} が選択されました`)}
                  >
                    <Text style={styles.threadTitle}>{thread.title}</Text>
                    <Text style={styles.threadChannel}>{thread.channel}</Text>
                    <View style={styles.threadStats}>
                      <View style={styles.threadStat}>
                        <Ionicons name="chatbubble-outline" size={16} color={themeColor} />
                        <Text style={styles.threadStatText}>{thread.comments}</Text>
                      </View>
                      <View style={styles.threadStat}>
                        <Ionicons name="heart-outline" size={16} color={themeColor} />
                        <Text style={styles.threadStatText}>{thread.likes}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContentContainer}>
                  <Text style={styles.emptyContentText}>
                    現在表示できるスレッドはありません。
                  </Text>
                </View>
              )}
            </View>
            
            {/* 最近のアクティビティ */}
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>最近のアクティビティ</Text>
              {filteredActivities.length > 0 ? (
                filteredActivities.map(activity => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={[styles.activityIconContainer, { backgroundColor: `${themeColor}40` }]}>
                      <Ionicons 
                        name={
                          activity.type === 'thread' ? 'create-outline' : 
                          activity.type === 'comment' ? 'chatbubble-outline' : 'heart-outline'
                        } 
                        size={20} 
                        color={themeColor} 
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityMeta}>
                        {activity.type === 'thread' ? 'スレッドを作成' : 
                         activity.type === 'comment' ? 'コメントしました' : 'いいねしました'}
                        • {activity.channel} • {activity.time}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContentContainer}>
                  <Text style={styles.emptyContentText}>
                    最近のアクティビティはありません。
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
          
          {/* サイドメニューはlayout.tsxで共通化 */}
        </SafeAreaView>
      </MusicGradientBackground>
    </View>
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
    paddingHorizontal: 8,
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  quickAccessSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAccessButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickAccessText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
  },
  recommendedSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  recommendedChannelsContainer: {
    paddingRight: 20,
  },
  channelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  channelIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  channelName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  channelMembers: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  popularSection: {
    padding: 20,
  },
  threadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  threadTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  threadChannel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 8,
  },
  threadStats: {
    flexDirection: 'row',
  },
  threadStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  threadStatText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginLeft: 4,
  },
  activitySection: {
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityMeta: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  selectedCategoryBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedCategoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContentContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyContentText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 