import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { threadService } from '../firebase/services';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolateColor, Easing } from 'react-native-reanimated';

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
  
  // アニメーション用の値
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const likeScale = useSharedValue(1);
  const likeRotation = useSharedValue(0);
  
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
    try {
      // 日付が "○時間前", "○分前" などの形式の場合はそのまま返す
      if (dateString.match(/[0-9]+[時分日]前/) || dateString.includes('前')) {
        return dateString;
      }
      
      const date = new Date(dateString);
      
      // 無効な日付かどうかチェック
      if (isNaN(date.getTime())) {
        return '不明な日付';
      }
      
      return new Intl.DateTimeFormat('ja-JP', { 
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('日付フォーマットエラー:', error, dateString);
      return '不明な日付';
    }
  };
  
  // いいねのハンドリング
  const handleLike = async () => {
    // アニメーションを実行
    likeScale.value = withSpring(1.5, { damping: 2 }, () => {
      likeScale.value = withSpring(1);
    });
    likeRotation.value = withTiming(liked ? 0 : 1, { duration: 300, easing: Easing.elastic(1) });
    
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
  
  // タップしたときのアニメーション
  const handlePressIn = () => {
    scale.value = withSpring(0.97);
    opacity.value = withTiming(0.9, { duration: 100 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 150 });
  };
  
  // アニメーションスタイル
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  const animatedLikeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: likeScale.value },
        { rotate: `${likeRotation.value * 30}deg` }
      ],
    };
  });
  
  return (
    <Animated.View style={animatedCardStyle}>
      <TouchableOpacity 
        style={styles.container}
        onPress={() => {
          console.log(`ページ遷移 => app/threads/${channelId}/${id} [スレッド詳細画面]`);
          router.push(`/threads/${channelId}/${id}`);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
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
              <Animated.View style={animatedLikeStyle}>
                <Ionicons 
                  name={liked ? "heart" : "heart-outline"} 
                  size={16} 
                  color={liked ? color : "#999999"} 
                />
              </Animated.View>
              <Text style={[styles.statText, liked ? {color: color} : {}]}>{likeCount}</Text>
            </TouchableOpacity>
            
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#999999" />
              <Text style={styles.statText}>{replyCount}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
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