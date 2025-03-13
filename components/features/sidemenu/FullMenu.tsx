import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../../../contexts/user';
import { useChannels } from '../../../contexts/data';
import { LinearGradient } from 'expo-linear-gradient';
import { LAYOUT } from '../../../constants/theme';
import { Channel, RecentThread, FavoriteThread } from '../../../types';

interface FullMenuProps {
  onCollapsePress: () => void;
  onHomePress: () => void;
  onCategoryPress: () => void;
  onSettingsPress: () => void;
  onProfilePress: () => void;
  onChannelPress: (channelId: string) => void;
  onThreadPress: (channelId: string, threadId: string) => void;
  onFavoritePress: (channelId: string, threadId: string) => void;
  onSearch: () => void;
  menuWidth: Animated.Value;
  menuOpacity: Animated.Value;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  expandedChannels: string[];
  toggleChannel: (channelId: string) => void;
  recentThreads: RecentThread[];
  favoriteThreads: FavoriteThread[];
}

export default function FullMenu({
  onCollapsePress,
  onHomePress,
  onCategoryPress,
  onSettingsPress,
  onProfilePress,
  onChannelPress,
  onThreadPress,
  onFavoritePress,
  onSearch,
  menuWidth,
  menuOpacity,
  searchQuery,
  setSearchQuery,
  expandedChannels,
  toggleChannel,
  recentThreads,
  favoriteThreads,
}: FullMenuProps) {
  const { userState } = useUser();
  const { channels, getChannelsByCategory } = useChannels();
  const router = useRouter();
  
  // ユーザーが選択したカテゴリーのチャンネルを取得
  const userChannels = userState?.selectedCategories?.length
    ? userState.selectedCategories.flatMap(category => getChannelsByCategory(category))
    : channels;

  return (
    <Animated.View 
      style={[
        styles.fullMenu, 
        { 
          width: menuWidth,
          opacity: menuOpacity,
        }
      ]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCollapsePress} style={styles.collapseButton}>
          <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>メニュー</Text>
      </View>
      
      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="検索..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={onSearch}
        />
        <TouchableOpacity onPress={onSearch} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* メニュー内容 */}
      <ScrollView style={styles.menuContent}>
        {/* ナビゲーションリンク */}
        <View style={styles.navLinks}>
          <TouchableOpacity style={styles.navLink} onPress={onHomePress}>
            <Ionicons name="home-outline" size={24} color="#FFFFFF" />
            <Text style={styles.navLinkText}>ホーム</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navLink} onPress={onCategoryPress}>
            <Ionicons name="grid-outline" size={24} color="#FFFFFF" />
            <Text style={styles.navLinkText}>カテゴリー</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navLink} onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            <Text style={styles.navLinkText}>設定</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navLink} onPress={onProfilePress}>
            <Ionicons name="person-outline" size={24} color="#FFFFFF" />
            <Text style={styles.navLinkText}>プロフィール</Text>
          </TouchableOpacity>
        </View>
        
        {/* 最近訪れたスレッド */}
        {recentThreads.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近訪れたスレッド</Text>
            {recentThreads.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                style={styles.threadItem}
                onPress={() => onThreadPress(thread.channelId, thread.id)}
              >
                <Text style={styles.threadTitle} numberOfLines={1}>{thread.title}</Text>
                <Text style={styles.threadChannel}>{thread.channelName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* お気に入りスレッド */}
        {favoriteThreads.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>お気に入り</Text>
            {favoriteThreads.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                style={styles.threadItem}
                onPress={() => onThreadPress(thread.channelId, thread.id)}
              >
                <View style={styles.threadTitleRow}>
                  <Text style={styles.threadTitle} numberOfLines={1}>{thread.title}</Text>
                  <TouchableOpacity
                    onPress={() => onFavoritePress(thread.channelId, thread.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="star" size={16} color="#FFD700" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.threadChannel}>{thread.channelName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* チャンネル一覧 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>チャンネル</Text>
          {userChannels?.map((channel: Channel) => (
            <View key={channel.id}>
              <TouchableOpacity
                style={styles.channelItem}
                onPress={() => toggleChannel(channel.id)}
              >
                <Text style={styles.channelName}>{channel.name}</Text>
                <Ionicons
                  name={expandedChannels.includes(channel.id) ? "chevron-down" : "chevron-forward"}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              
              {/* 展開されたチャンネルのスレッド一覧 */}
              {expandedChannels.includes(channel.id) && channel.threads.map((thread) => (
                <TouchableOpacity
                  key={thread.id}
                  style={styles.threadSubItem}
                  onPress={() => onThreadPress(channel.id, thread.id)}
                >
                  <Text style={styles.threadSubTitle} numberOfLines={1}>{thread.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* フッター */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.userInfo} onPress={onProfilePress}>
          <View style={styles.avatar}>
            {userState?.avatar ? (
              <Text style={styles.avatarText}>{userState.name.charAt(0)}</Text>
            ) : (
              <Ionicons name="person" size={24} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{userState?.name || 'ゲスト'}</Text>
            <Text style={styles.userStatus}>オンライン</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#1E1E1E',
    borderRightWidth: 1,
    borderRightColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  collapseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#333333',
    borderRadius: 18,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  searchButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuContent: {
    flex: 1,
  },
  navLinks: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navLinkText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sectionTitle: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 12,
  },
  threadItem: {
    paddingVertical: 8,
  },
  threadTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  threadChannel: {
    color: '#999999',
    fontSize: 12,
    marginTop: 2,
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  threadSubItem: {
    paddingVertical: 8,
    paddingLeft: 16,
  },
  threadSubTitle: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7F3DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userTextContainer: {
    marginLeft: 12,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userStatus: {
    color: '#4CAF50',
 