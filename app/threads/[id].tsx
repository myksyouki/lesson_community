import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import MusicWaveAnimation from '../../components/MusicWaveAnimation';
import { useUser } from '../../contexts/UserContext';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import { getThemeForCategory } from '../../theme/musicThemes';

// スレッドとコメントの型定義
interface ThreadAuthor {
  id: string;
  username: string;
  avatarUrl: string;
}

interface ThreadData {
  id: string;
  title: string;
  content: string;
  author: ThreadAuthor;
  channelId: string;
  channelName: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
}

interface CommentData {
  id: string;
  content: string;
  author: ThreadAuthor;
  createdAt: string;
  likesCount: number;
}

// スレッドの詳細画面
export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userState } = useUser();
  const scrollY = useSharedValue(0);
  const flatListRef = useRef<FlatList | null>(null);
  
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // スレッドデータを取得（サンプルデータ）
  useEffect(() => {
    // APIからデータを取得する代わりに、サンプルデータを使用
    setTimeout(() => {
      setThread({
        id: typeof id === 'string' ? id : 'default-id',
        title: 'フルート初心者のための練習方法',
        content: 'フルートを始めたばかりですが、効果的な練習方法について教えてください。特に音色を良くするためのコツや、初心者が陥りがちな間違いなどがあれば教えていただきたいです。また、おすすめの練習曲なども知りたいです。',
        author: {
          id: 'user123',
          username: 'MusicLover',
          avatarUrl: 'https://random.imagecdn.app/150/150',
        },
        channelId: 'channel123',
        channelName: 'フルート',
        category: 'flute',
        createdAt: '2023-05-15T10:30:00Z',
        updatedAt: '2023-05-15T10:30:00Z',
        likesCount: 24,
        commentsCount: 8,
        tags: ['初心者', '練習方法', 'アドバイス'],
      });
      
      setComments([
        {
          id: 'comment1',
          content: '初心者の頃は、まず正しい姿勢と呼吸法を身につけることが大切です。毎日10〜15分程度のロングトーン練習をおすすめします。これにより、安定した音色が出せるようになります。',
          author: {
            id: 'user456',
            username: 'FluteMaster',
            avatarUrl: 'https://random.imagecdn.app/151/151',
          },
          createdAt: '2023-05-15T11:15:00Z',
          likesCount: 12,
        },
        {
          id: 'comment2',
          content: '初心者向けの練習曲としては、モイーズの「フルートのための24の小練習曲」がおすすめです。簡単なメロディから始まり、徐々に難易度が上がっていきます。',
          author: {
            id: 'user789',
            username: 'ClassicalFan',
            avatarUrl: 'https://random.imagecdn.app/152/152',
          },
          createdAt: '2023-05-15T12:45:00Z',
          likesCount: 8,
        },
        {
          id: 'comment3',
          content: '初心者がよく陥る間違いとして、息を十分に吹き込まないことがあります。フルートは他の管楽器と比べて息の消費が多いので、深い呼吸を意識してください。また、リッププレートの位置も重要です。正しい位置を見つけるために、鏡を見ながら練習するといいでしょう。',
          author: {
            id: 'user101',
            username: 'MusicTeacher',
            avatarUrl: 'https://random.imagecdn.app/153/153',
          },
          createdAt: '2023-05-15T14:20:00Z',
          likesCount: 15,
        },
        {
          id: 'comment4',
          content: '音色を良くするためには、口の形（アンブシュア）の練習が欠かせません。「ウー」と言うような形で息を吹き込んでみてください。また、ハーモニクス（倍音）の練習も効果的です。',
          author: {
            id: 'user202',
            username: 'OrchestraPlayer',
            avatarUrl: 'https://random.imagecdn.app/154/154',
          },
          createdAt: '2023-05-16T09:10:00Z',
          likesCount: 10,
        },
        {
          id: 'comment5',
          content: 'YouTubeで「The Flute Channel」というチャンネルがあり、初心者向けのレッスン動画が多数公開されています。実際の演奏を見ながら学べるので、とても参考になると思います。',
          author: {
            id: 'user303',
            username: 'OnlineLearner',
            avatarUrl: 'https://random.imagecdn.app/155/155',
          },
          createdAt: '2023-05-16T15:30:00Z',
          likesCount: 6,
        },
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, [id]);
  
  // スレッドカテゴリーに基づいてテーマを取得
  const theme = thread ? getThemeForCategory(thread.category) : 'default';
  const themeColor = thread?.category ? 
    getThemeColor(thread.category) : 
    '#7F3DFF'; // デフォルトカラー
  
  // カテゴリーに基づいてカラーを取得するヘルパー関数
  function getThemeColor(category: string): string {
    switch (category) {
      case 'flute': return '#7F3DFF';
      case 'clarinet': return '#FF3D77';
      case 'oboe': return '#3D7FFF';
      case 'saxophone': return '#3DFFCF';
      case 'trumpet': return '#FFD93D';
      case 'violin': return '#FF9F3D';
      default: return '#7F3DFF';
    }
  }
  
  // ヘッダーのアニメーションスタイル
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
    };
  });
  
  // タイトルのアニメーションスタイル
  const titleAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -50],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollY.value,
      [0, 60, 100],
      [1, 0.8, 0],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ translateY }],
      opacity,
    };
  });
  
  // コメントを送信
  const handleSendComment = () => {
    if (!newComment.trim()) return;
    
    setIsSending(true);
    
    // 実際のAPIリクエストの代わりに、ローカルでコメントを追加
    setTimeout(() => {
      const newCommentObj: CommentData = {
        id: `comment${comments.length + 1}`,
        content: newComment,
        author: {
          id: 'guest',
          username: userState?.username || 'ゲスト',
          avatarUrl: userState?.avatarUrl || 'https://random.imagecdn.app/156/156',
        },
        createdAt: new Date().toISOString(),
        likesCount: 0,
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
      setIsSending(false);
      
      // 新しいコメントに自動スクロール
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 500);
  };
  
  // 戻るボタン
  const handleGoBack = () => {
    router.back();
  };
  
  // 読み込み中の表示
  if (isLoading) {
    return (
      <MusicGradientBackground theme="default">
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        </View>
      </MusicGradientBackground>
    );
  }
  
  // コメントアイテムをレンダリング
  const renderCommentItem = ({ item }: { item: CommentData }) => (
    <View style={[styles.commentItem, { borderColor: `${themeColor}30` }]}>
      <View style={styles.commentHeader}>
        <Image source={{ uri: item.author.avatarUrl }} style={styles.commentAvatar} />
        <View>
          <Text style={styles.commentAuthor}>{item.author.username}</Text>
          <Text style={styles.commentTime}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      <View style={styles.commentFooter}>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="heart-outline" size={16} color={themeColor} />
          <Text style={styles.commentActionText}>{item.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="chatbubble-outline" size={16} color={themeColor} />
          <Text style={styles.commentActionText}>返信</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // 日付フォーマット
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return '今';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    }
  };
  
  // スレッドが存在しない場合のフォールバック
  if (!thread) {
    return (
      <MusicGradientBackground theme="default">
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>スレッドが見つかりませんでした</Text>
          </View>
        </View>
      </MusicGradientBackground>
    );
  }
  
  return (
    <MusicGradientBackground theme={theme}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <StatusBar style="light" />
        
        {/* ヘッダー */}
        <Animated.View style={[styles.header, { paddingTop: insets.top }, headerAnimatedStyle]}>
          <IconButton
            icon="arrow-left"
            iconColor="#fff"
            size={24}
            onPress={handleGoBack}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {thread.title}
          </Text>
          <IconButton
            icon="dots-vertical"
            iconColor="#fff"
            size={24}
            onPress={() => console.log('メニューを開く')}
          />
        </Animated.View>
        
        {/* コンテンツ */}
        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={item => item.id}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100, paddingTop: insets.top + 60 }
          ]}
          ListHeaderComponent={
            <View style={styles.threadContainer}>
              {/* スレッドのヘッダー情報 */}
              <Animated.View style={[styles.threadHeader, titleAnimatedStyle]}>
                <MusicWaveAnimation color="#fff" count={3} height={80} position="top" opacity={0.2} />
                <Text style={styles.threadCategory}>
                  <Ionicons name="folder-outline" size={16} color="#fff" /> {thread.channelName}
                </Text>
                <Text style={styles.threadTitle}>{thread.title}</Text>
                <View style={styles.threadAuthorContainer}>
                  <Image source={{ uri: thread.author.avatarUrl }} style={styles.threadAvatar} />
                  <Text style={styles.threadAuthor}>{thread.author.username}</Text>
                  <Text style={styles.threadDate}>{formatDate(thread.createdAt)}</Text>
                </View>
                <View style={styles.threadTags}>
                  {thread.tags.map((tag, index) => (
                    <View key={index} style={[styles.tagBadge, { backgroundColor: `${themeColor}40` }]}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
              
              {/* スレッドの内容 */}
              <View style={[styles.threadContent, { borderColor: `${themeColor}30` }]}>
                <Text style={styles.threadContentText}>{thread.content}</Text>
                <View style={styles.threadActions}>
                  <TouchableOpacity style={styles.threadAction}>
                    <Ionicons name="heart-outline" size={20} color={themeColor} />
                    <Text style={styles.threadActionText}>{thread.likesCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.threadAction}>
                    <Ionicons name="chatbubble-outline" size={20} color={themeColor} />
                    <Text style={styles.threadActionText}>{thread.commentsCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.threadAction}>
                    <Ionicons name="share-social-outline" size={20} color={themeColor} />
                    <Text style={styles.threadActionText}>共有</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.threadAction}>
                    <Ionicons name="bookmark-outline" size={20} color={themeColor} />
                    <Text style={styles.threadActionText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* コメント数表示 */}
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>
                  コメント（{comments.length}）
                </Text>
                <TouchableOpacity style={styles.sortButton}>
                  <Ionicons name="filter-outline" size={16} color="#fff" />
                  <Text style={styles.sortButtonText}>新着順</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
        
        {/* コメント入力エリア */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <Image 
            source={{ uri: userState?.avatarUrl || 'https://random.imagecdn.app/156/156' }} 
            style={styles.inputAvatar} 
          />
          <TextInput
            style={[styles.input, { borderColor: `${themeColor}40` }]}
            placeholder="コメントを入力..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { 
                backgroundColor: newComment.trim() ? themeColor : 'rgba(255, 255, 255, 0.2)',
                opacity: newComment.trim() ? 1 : 0.5 
              }
            ]}
            onPress={handleSendComment}
            disabled={!newComment.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </MusicGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 60,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  threadContainer: {
    marginBottom: 20,
  },
  threadHeader: {
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 20,
  },
  threadCategory: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  threadTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  threadAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  threadAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  threadAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  threadDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  threadTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
  },
  threadContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  threadContentText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  threadActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  threadAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threadActionText: {
    marginLeft: 5,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  commentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  commentTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  commentContent: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 10,
  },
  commentFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  commentActionText: {
    marginLeft: 5,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
}); 