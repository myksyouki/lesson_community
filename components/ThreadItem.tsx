import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';

interface Thread {
  id: string;
  title: string;
  content: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt?: Date;
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
}

interface ThreadItemProps {
  thread: Thread;
  onPress: () => void;
  likes?: number;
  replies?: number;
  isLiked?: boolean;
  color?: string;
}

const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  onPress,
  likes = 0,
  replies = 0,
  isLiked = false,
  color = '#6C72CB',
}) => {
  // 内容の短縮表示
  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 日付フォーマット
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60); // 分単位の差

    if (diff < 60) return `${diff}分前`;
    if (diff < 60 * 24) return `${Math.floor(diff / 60)}時間前`;
    if (diff < 60 * 24 * 7) return `${Math.floor(diff / 60 / 24)}日前`;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month}/${day}`;
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image 
            source={{ uri: thread.authorAvatar || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View style={styles.headerInfo}>
            <Text style={styles.authorName}>{thread.authorName || '匿名ユーザー'}</Text>
            <Text style={styles.date}>{formatDate(thread.createdAt)}</Text>
          </View>
        </View>
        
        <Text style={styles.title}>{thread.title}</Text>
        <Text style={styles.contentText}>{truncateContent(thread.content)}</Text>
        
        {thread.tags && thread.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {thread.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: `${color}30` }]}>
                <Text style={[styles.tagText, { color }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.footer}>
          <View style={styles.actionItem}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={16} 
              color={isLiked ? color : "#666"} 
            />
            <Text style={styles.actionText}>{likes}</Text>
          </View>
          
          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.actionText}>{replies}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
});

export default ThreadItem; 