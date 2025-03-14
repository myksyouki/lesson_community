import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Avatar, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// スレッドの型定義
export interface ThreadProps {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  channelId: string;
  likes: number;
  isLiked: boolean;
  image?: string;
  commentCount: number;
  tags?: string[];
}

interface ThreadDetailProps {
  thread: ThreadProps;
  onLike: () => void;
  onReply: () => void;
  onShare: () => void;
  accentColor: string;
}

// 日付をフォーマットする関数
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 月は0始まりなので+1
  const day = date.getDate();
  
  return `${year}年${month}月${day}日`;
};

// パンくずナビゲーションコンポーネント
export const BreadcrumbNavigation = ({ 
  channelName, 
  threadTitle, 
  onNavigateHome, 
  onNavigateChannel,
  onNavigateChannelList
}: { 
  channelName: string;
  threadTitle: string;
  onNavigateHome: () => void;
  onNavigateChannel: () => void;
  onNavigateChannelList: () => void;
}) => {
  return (
    <View style={styles.breadcrumbs}>
      <TouchableOpacity onPress={onNavigateHome}>
        <Text style={styles.breadcrumbLink}>HOME</Text>
      </TouchableOpacity>
      <Text style={styles.breadcrumbSeparator}>&gt;</Text>
      <TouchableOpacity onPress={onNavigateChannelList}>
        <Text style={styles.breadcrumbLink}>チャンネル一覧</Text>
      </TouchableOpacity>
      <Text style={styles.breadcrumbSeparator}>&gt;</Text>
      <TouchableOpacity onPress={onNavigateChannel}>
        <Text style={styles.breadcrumbLink}>{channelName}</Text>
      </TouchableOpacity>
      <Text style={styles.breadcrumbSeparator}>&gt;</Text>
      <Text style={styles.breadcrumbCurrent}>{threadTitle}</Text>
    </View>
  );
};

const ThreadDetail = ({
  thread,
  onLike,
  onReply,
  onShare,
  accentColor
}: ThreadDetailProps) => {
  // 日付をフォーマット
  const formattedDate = formatDate(new Date(thread.createdAt));

  return (
    <View style={styles.container}>
      <View style={styles.authorContainer}>
        <Avatar.Image 
          size={40} 
          source={{ uri: thread.author.avatar }} 
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{thread.author.name}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{thread.title}</Text>
      <Text style={styles.content}>{thread.content}</Text>
      
      {thread.image && (
        <Image 
          source={{ uri: thread.image }} 
          style={styles.image}
          resizeMode="cover"
        />
      )}
      
      {/* タグの表示 */}
      {thread.tags && thread.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {thread.tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: `${accentColor}30` }]}>
              <Text style={[styles.tagText, { color: accentColor }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onLike}
        >
          <Ionicons 
            name={thread.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={thread.isLiked ? accentColor : "#AAAAAA"} 
          />
          <Text 
            style={[
              styles.actionText, 
              thread.isLiked ? { color: accentColor } : {}
            ]}
          >
            {thread.likes || 0}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onReply}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#AAAAAA" />
          <Text style={styles.actionText}>返信</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onShare}
        >
          <Ionicons name="share-outline" size={20} color="#AAAAAA" />
          <Text style={styles.actionText}>共有</Text>
        </TouchableOpacity>
      </View>
      
      <Divider style={styles.divider} />
      
      <Text style={styles.repliesTitle}>返信 {thread.commentCount}件</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 6,
  },
  divider: {
    backgroundColor: '#333333',
    marginVertical: 16,
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 8,
    marginBottom: 12,
  },
  breadcrumbLink: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginHorizontal: 6,
  },
  breadcrumbCurrent: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ThreadDetail; 