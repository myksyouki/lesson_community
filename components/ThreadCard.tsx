import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { threadService } from '../firebase/services';

interface ThreadCardProps {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  channelId: string;
  likes: number;
  replies: number;
  isLiked: boolean;
  color?: string;
  onLikeToggle?: (threadId: string) => void;
}

export default function ThreadCard({ 
  id, 
  title, 
  content, 
  author, 
  createdAt, 
  channelId, 
  likes = 0,
  replies = 0,
  isLiked = false,
  color = '#7F3DFF',
  onLikeToggle
}: ThreadCardProps) {
  const [likeCount, setLikeCount] = useState(likes);
  const [replyCount, setReplyCount] = useState(replies);
  const [liked, setLiked] = useState(isLiked);
  
  // リアルタイム更新：いいね数とコメント数を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // いいね数を取得
        const count = await threadService.getThreadLikeCount(id);
        setLikeCount(count);
        
        // ユーザーのいいね状態を取得
        const auth = getAuth();
        if (auth.currentUser) {
          const userLiked = await threadService.isThreadLikedByUser(id, auth.currentUser.uid);
          setLiked(userLiked);
        }
        
        // スレッドの詳細情報を取得（メッセージ数など）
        const threadInfo = await threadService.getThreadById(id);
        if (threadInfo) {
          setReplyCount(threadInfo.messageCount);
        }
      } catch (error) {
        console.error('スレッド情報取得エラー:', error);
      }
    };
    
    fetchData();
  }, [id]);
  
  // いいねが props から更新されたら状態を更新
  useEffect(() => {
    setLikeCount(likes);
    setLiked(isLiked);
  }, [likes, isLiked]);
  
  // 返信数が props から更新されたら状態を更新
  useEffect(() => {
    setReplyCount(replies);
  }, [replies]);
  
  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', { 
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  };
  
  // いいねのハンドリング
  const handleLike = async () => {
    if (onLikeToggle) {
      onLikeToggle(id);
      return;
    }
    
    // 親からのonLikeToggleがない場合は直接Firebaseと通信
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;
      
      const result = await threadService.toggleLikeThread(id, auth.currentUser.uid);
      setLiked(result.isLiked);
      setLikeCount(result.likeCount);
    } catch (error) {
      console.error('いいねエラー:', error);
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push(`/threads/${channelId}/${id}`)}
    >
      <LinearGradient 
        colors={['rgba(40, 40, 60, 0.8)', 'rgba(20, 20, 30, 0.8)']} 
        style={styles.gradient}
      >
        <View style={styles.headerContainer}>
          <View style={styles.authorContainer}>
            <Image 
              source={{ uri: author.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.avatar} 
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{author.name}</Text>
              <Text style={styles.date}>{formatDate(createdAt)}</Text>
            </View>
          </View>
          
          <View style={[styles.indicator, { backgroundColor: color }]} />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.content} numberOfLines={2}>{content}</Text>
        
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={handleLike}
          >
            <Ionicons 
              name={liked ? "heart" : "heart-outline"} 
              size={16} 
              color={liked ? color : "#999999"} 
            />
            <Text style={[styles.statText, liked ? {color: color} : {}]}>{likeCount}</Text>
          </TouchableOpacity>
          
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#999999" />
            <Text style={styles.statText}>{replyCount}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  indicator: {
    width: 6,
    height: 36,
    borderRadius: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: '#999999',
    fontSize: 14,
    marginLeft: 4,
  },
}); 