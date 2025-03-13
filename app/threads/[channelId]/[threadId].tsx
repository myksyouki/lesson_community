import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Image, Animated as RNAnimated, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Avatar, Divider, Menu, Badge } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../../contexts/UserContext';
import { useData } from '../../../contexts/DataContext';
import MusicFAB from '../../../components/MusicFAB';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// 画面サイズを取得
const { width } = Dimensions.get('window');

// チャンネルデータ
const CHANNELS = {
  'flute-beginners': { name: '初心者質問', category: 'flute', icon: 'help-circle', color: '#7F3DFF' },
  'flute-techniques': { name: '演奏テクニック', category: 'flute', icon: 'hand-left', color: '#7F3DFF' },
  'flute-repertoire': { name: 'レパートリー', category: 'flute', icon: 'musical-notes', color: '#7F3DFF' },
  'clarinet-beginners': { name: '初心者質問', category: 'clarinet', icon: 'help-circle', color: '#FF3D77' },
  'oboe-reeds': { name: 'リード作り', category: 'oboe', icon: 'construct', color: '#3D7FFF' },
  'saxophone-jazz': { name: 'ジャズ演奏', category: 'saxophone', icon: 'musical-notes', color: '#3DFFCF' },
  'trumpet-jazz': { name: 'ジャズ演奏', category: 'trumpet', icon: 'musical-notes', color: '#FFD93D' },
};

// スレッドデータ
const THREADS = {
  'flute-beginners-1': {
    id: '1',
    title: 'フルートの持ち方について',
    author: 'フルート初心者',
    authorAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    createdAt: '2時間前',
    content: 'フルートを始めたばかりなのですが、正しい持ち方がわかりません。どのように持つのが正しいでしょうか？アドバイスをお願いします。',
    messages: [
      {
        id: '1',
        author: 'フルート講師',
        authorAvatar: 'https://randomuser.me/api/portraits/men/41.jpg',
        content: 'フルートは右手で本体を支え、左手で頭部管に近い部分を持ちます。両肘は体から離し、肩の力を抜いて自然な姿勢を保つことが大切です。また、フルートは水平ではなく、やや下向きに傾けて構えるのが基本です。',
        createdAt: '1時間前',
      },
      {
        id: '2',
        author: 'フルートマスター',
        authorAvatar: 'https://randomuser.me/api/portraits/women/65.jpg',
        content: '補足すると、初心者のうちは鏡を見ながら練習すると良いでしょう。また、長時間の練習では疲れて姿勢が崩れやすいので、短時間でも良いので正しい姿勢を意識して練習することをお勧めします。',
        createdAt: '45分前',
      },
      {
        id: '3',
        author: 'フルート初心者',
        authorAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        content: 'アドバイスありがとうございます！鏡を見ながら練習してみます。姿勢にも気をつけます。',
        createdAt: '30分前',
      },
    ],
  },
  'saxophone-jazz-1': {
    id: '1',
    title: 'ジャズサックスの即興演奏のコツ',
    author: 'ジャズサックス志望',
    authorAvatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    createdAt: '3時間前',
    content: 'ジャズスタンダードの「Autumn Leaves」の即興演奏を練習しています。特にⅡ-Ⅴ-Ⅰの動きがスムーズにできません。効果的な練習方法があれば教えてください。',
    messages: [
      {
        id: '1',
        author: 'ジャズサックス奏者',
        authorAvatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        content: 'Ⅱ-Ⅴ-Ⅰは全てのキーで練習することをお勧めします。まずはCメジャーキー（Dm7-G7-Cmaj7）から始めて、サークルオブフィフスで全てのキーを練習しましょう。ゆっくりとメトロノームを使って練習すると効果的です。',
        createdAt: '2時間前',
      },
      {
        id: '2',
        author: 'ジャズ理論家',
        authorAvatar: 'https://randomuser.me/api/portraits/women/45.jpg',
        content: 'コードトーンを意識することも大切です。各コードの構成音（1-3-5-7）を把握して、それらの音を中心にフレーズを作ると良いでしょう。また、ガイドトーン（3度と7度）の動きを追うと、スムーズなフレージングができるようになります。',
        createdAt: '1時間前',
      },
    ],
  },
  'oboe-reeds-1': {
    id: '1',
    title: 'リード作りの基本道具',
    author: 'オーボエ奏者',
    authorAvatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    createdAt: '5時間前',
    content: 'オーボエのリード作りを始めたいと思っています。必要な基本的な道具と、初心者におすすめのケーンがあれば教えてください。',
    messages: [
      {
        id: '1',
        author: 'リード職人',
        authorAvatar: 'https://randomuser.me/api/portraits/men/55.jpg',
        content: '基本的な道具としては、マンドレル、ナイフ（リードナイフ）、プラーク、糸、ワイヤー、定規、砥石などが必要です。初心者の方には、まず良質なケーンを選ぶことが重要です。Rigotti や Gonzalez のケーンは比較的安定していて初心者にもおすすめです。',
        createdAt: '4時間前',
      },
      {
        id: '2',
        author: 'オーボエ講師',
        authorAvatar: 'https://randomuser.me/api/portraits/women/28.jpg',
        content: '道具に加えて、リード作りの本やビデオチュートリアルも参考になります。また、最初は先生や経験者に直接指導してもらうのが一番効果的です。リード作りは根気のいる作業ですが、自分に合ったリードが作れるようになると演奏の幅が広がりますよ。',
        createdAt: '3時間前',
      },
      {
        id: '3',
        author: 'オーボエ奏者',
        authorAvatar: 'https://randomuser.me/api/portraits/women/32.jpg',
        content: 'アドバイスありがとうございます！まずは基本的な道具を揃えて、先生に指導してもらいながら始めてみます。Rigotti のケーンを探してみます。',
        createdAt: '2時間前',
      },
      {
        id: '4',
        author: 'リード職人',
        authorAvatar: 'https://randomuser.me/api/portraits/men/55.jpg',
        content: 'ぜひ頑張ってください。最初は難しく感じるかもしれませんが、コツをつかめば楽しくなりますよ。何か質問があればいつでも聞いてください。',
        createdAt: '1時間前',
      },
    ],
  },
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

// 型定義
interface Author {
  id: string;
  name: string;
  avatar: string;
}

interface Message {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
  image?: string;
  replies?: number;
  likes?: number;
  isLiked?: boolean;
  replyToId?: string; // 返信先メッセージのID
  replyToAuthor?: string; // 返信先の著者名
}

interface Thread {
  id: string;
  title: string;
  author: Author;
  content: string;
  createdAt: string;
  image?: string;
  messages: Message[];
  likes?: number;
  isLiked?: boolean;
}

interface Channel {
  id: string;
  name: string;
  category: string;
  color: string;
}

// ブレッドクラムナビゲーション
function BreadcrumbNavigation({ channelName, threadTitle, channelId }: { channelName: string, threadTitle: string, channelId: string }) {
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
        
        <TouchableOpacity 
          style={styles.breadcrumbItem}
          onPress={() => router.push(`/channels/${channelId}`)}
        >
          <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
          <Text style={styles.breadcrumbText}>{channelName}</Text>
        </TouchableOpacity>
        
        <View style={styles.breadcrumbSeparatorContainer}>
          <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
        </View>
        
        <View style={styles.breadcrumbActiveItem}>
          <Ionicons name="document-text" size={16} color="#FFFFFF" />
          <Text style={styles.breadcrumbActiveText}>{threadTitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// メッセージコンポーネント
const MessageItem = ({ 
  message, 
  onReply, 
  onLike, 
  currentInstrument, 
  isLastMessage,
  allMessages,
  isThreadAuthor,
  onShare
}: { 
  message: Message, 
  onReply: (messageId: string, authorName: string) => void, 
  onLike: (messageId: string) => void, 
  currentInstrument: any,
  isLastMessage: boolean,
  allMessages: Message[],
  isThreadAuthor: boolean,
  onShare: (messageId: string) => void
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  
  // 返信先のメッセージを取得
  const replyToMessage = message.replyToId 
    ? allMessages.find(m => m.id === message.replyToId) 
    : null;
  
  return (
    <View style={[
      styles.messageContainer,
      isLastMessage ? styles.lastMessage : null,
      isThreadAuthor ? styles.threadAuthorMessage : null
    ]}>
      <Avatar.Image 
        size={36} 
        source={{ uri: message.author.avatar }} 
      />
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <Text style={styles.messageSender}>{message.author.name}</Text>
            {isThreadAuthor && (
              <Badge style={[styles.authorBadge, { backgroundColor: currentInstrument?.color || '#7F3DFF' }]}>投稿者</Badge>
            )}
          </View>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Text style={styles.messageTime}>{new Date(message.createdAt).toLocaleDateString('ja-JP')}</Text>
              </TouchableOpacity>
            }
            contentStyle={styles.messageMenu}
          >
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                onReply(message.id, message.author.name);
              }} 
              title="返信" 
              leadingIcon="reply"
            />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                onShare(message.id);
              }} 
              title="共有" 
              leadingIcon="share-variant"
            />
            <Divider />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                // コピー機能などの実装
              }} 
              title="テキストをコピー" 
              leadingIcon="content-copy"
            />
          </Menu>
        </View>
        
        {/* 返信元メッセージ */}
        {replyToMessage && (
          <TouchableOpacity style={styles.replyToContainer}>
            <View style={[styles.replyToBar, { backgroundColor: currentInstrument?.color || '#7F3DFF' }]} />
            <View style={styles.replyToContent}>
              <Text style={styles.replyToAuthor}>{replyToMessage.author.name}</Text>
              <Text style={styles.replyToText} numberOfLines={1}>{replyToMessage.content}</Text>
            </View>
          </TouchableOpacity>
        )}
        
        <Text style={styles.messageText}>{message.content}</Text>
        
        {message.image && (
          <Image 
            source={{ uri: message.image }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.messageActions}>
          <TouchableOpacity 
            style={styles.messageActionBtn}
            onPress={() => onLike(message.id)}
          >
            <Ionicons 
              name={message.isLiked ? "heart" : "heart-outline"} 
              size={16} 
              color={message.isLiked ? (currentInstrument?.color || '#7F3DFF') : "#AAAAAA"} 
            />
            <Text 
              style={[
                styles.messageActionBtnText,
                message.isLiked ? { color: currentInstrument?.color || '#7F3DFF' } : {}
              ]}
            >
              {message.likes || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.messageActionBtn}
            onPress={() => onReply(message.id, message.author.name)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#AAAAAA" />
            <Text style={styles.messageActionBtnText}>返信</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.messageActionBtn}
            onPress={() => onShare(message.id)}
          >
            <Ionicons name="share-outline" size={16} color="#AAAAAA" />
            <Text style={styles.messageActionBtnText}>共有</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function ThreadScreen() {
  const router = useRouter();
  const { channelId, threadId } = useLocalSearchParams();
  const { userState } = useUser();
  const { getThread, getChannel, toggleLike } = useData();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string, author: string } | null>(null);
  const [messageList, setMessageList] = useState<Message[]>([]);
  
  // スワイプアニメーション用の値
  const translateX = new RNAnimated.Value(0);
  
  // チャンネル情報
  const channel = getChannel(channelId as string);
  
  // スレッド情報
  const thread = getThread(channelId as string, threadId as string);
  
  // 現在の楽器カテゴリーの色
  const categoryColor = channel?.color || '#7F3DFF';
  const currentInstrument = INSTRUMENT_CATEGORIES.find(cat => cat.id === channel?.category);
  
  // メッセージ一覧を更新
  useEffect(() => {
    if (thread?.messages) {
      setMessageList(thread.messages);
    }
  }, [thread]);
  
  // 初回レンダリング時に最下部にスクロール
  useEffect(() => {
    setTimeout(() => {
      if (flatListRef.current && messageList.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 500);
  }, []);
  
  // メッセージ送信処理
  const handleSendMessage = () => {
    if (message.trim() === '') return;
    
    // 新しいメッセージ
    const newMessage = {
      id: `msg-${Date.now()}`,
      author: {
        id: userState.username,
        name: userState.username,
        avatar: userState.avatarUrl,
      },
      content: message,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      // 返信情報
      replyToId: replyingTo?.id,
      replyToAuthor: replyingTo?.author,
    };
    
    // メッセージリストを更新
    setMessageList(prev => [...prev, newMessage]);
    
    // 入力欄をクリア
    setMessage('');
    setIsReplying(false);
    setReplyingTo(null);
    
    // キーボードを閉じる
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // 最下部にスクロール
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };
  
  // 返信ボタンを押した時の処理
  const handleReply = (messageId: string, authorName: string) => {
    setIsReplying(true);
    setReplyingTo({ id: messageId, author: authorName });
    
    // 入力欄にフォーカス
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // いいねボタンを押した時の処理
  const handleLike = (messageId: string) => {
    // メッセージのいいね状態を切り替え
    setMessageList(prev => 
      prev.map(msg => 
        msg.id === messageId
          ? { 
              ...msg, 
              isLiked: !msg.isLiked, 
              likes: msg.isLiked ? (msg.likes || 1) - 1 : (msg.likes || 0) + 1 
            }
          : msg
      )
    );
  };
  
  // スレッドの「いいね」処理
  const handleThreadLike = () => {
    if (thread) {
      toggleLike(channelId as string, threadId as string);
    }
  };
  
  // 共有機能
  const handleShare = (messageId: string) => {
    console.log('Share message:', messageId);
    // 共有機能の実装
  };
  
  // スワイプジェスチャーのハンドラ
  const onGestureEvent = (event: any) => {
    // 右方向へのスワイプのみ処理
    if (event.nativeEvent.translationX > 0) {
      translateX.setValue(event.nativeEvent.translationX);
    }
  };

  // スワイプジェスチャー終了時の処理
  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === 4) {
      // スワイプが一定距離以上なら戻る
      if (event.nativeEvent.translationX > 100) {
        // アニメーションを完了させてから遷移
        RNAnimated.timing(translateX, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          router.back();
        });
      } else {
        // 元の位置に戻す
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };
  
  // ナビゲーション情報を保存
  useEffect(() => {
    const saveNavInfo = async () => {
      if (thread && channel) {
        // スレッド情報を保存
        const navInfo = {
          channelId: channelId as string,
          channelName: channel.name,
          threadId: threadId as string,
          threadTitle: thread.title,
          type: 'thread'
        };
        
        try {
          await AsyncStorage.setItem('currentNavInfo', JSON.stringify(navInfo));
        } catch (e) {
          console.error('Navigation info could not be stored:', e);
        }
      }
    };
    
    saveNavInfo();
    
    return () => {
      // クリーンアップ
      const cleanupNavInfo = async () => {
        try {
          const storedInfo = await AsyncStorage.getItem('currentNavInfo');
          if (storedInfo) {
            const parsedInfo = JSON.parse(storedInfo);
            if (parsedInfo.type === 'thread') {
              await AsyncStorage.removeItem('currentNavInfo');
            }
          }
        } catch (e) {
          console.error('Navigation info could not be cleaned up:', e);
        }
      };
      
      cleanupNavInfo();
    };
  }, [thread, channel, channelId, threadId]);
  
  if (!thread || !channel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>スレッドが見つかりません</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <RNAnimated.View style={{ flex: 1, transform: [{ translateX }], backgroundColor: '#121212' }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <SafeAreaView style={styles.container}>
              <StatusBar style="light" />
              
              <View style={styles.header}>
                <IconButton
                  icon="arrow-left"
                  size={24}
                  iconColor="#FFFFFF"
                  onPress={() => router.back()}
                  style={styles.backButton}
                />
                
                <View style={styles.headerContent}>
                  <View style={[styles.iconContainer, { backgroundColor: `${currentInstrument?.color}30` || 'rgba(127, 61, 255, 0.2)' }]}>
                    <Ionicons 
                      name={'chatbubbles'} 
                      size={20} 
                      color={categoryColor} 
                    />
                  </View>
                  
                  <View>
                    <Text style={styles.threadTitle} numberOfLines={1}>{thread.title}</Text>
                    <Text style={styles.channelName}>{channel.name}</Text>
                  </View>
                </View>
              </View>
              
              {/* ブレッドクラムナビゲーション */}
              <BreadcrumbNavigation 
                channelName={channel.name} 
                threadTitle={thread.title} 
                channelId={channelId as string} 
              />
              
              {/* スレッド内容 */}
              <FlatList
                ref={flatListRef}
                data={messageList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                ListHeaderComponent={
                  <View style={styles.threadHeader}>
                    <View style={styles.authorContainer}>
                      <Avatar.Image 
                        size={40} 
                        source={{ uri: thread.author.avatar }} 
                      />
                      <View style={styles.authorInfo}>
                        <Text style={styles.authorName}>{thread.author.name}</Text>
                        <Text style={styles.threadTime}>{new Date(thread.createdAt).toLocaleDateString('ja-JP')}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.threadContent}>{thread.content}</Text>
                    
                    {thread.image && (
                      <Image 
                        source={{ uri: thread.image }} 
                        style={styles.threadImage}
                        resizeMode="cover"
                      />
                    )}
                    
                    <View style={styles.threadActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleThreadLike}
                      >
                        <Ionicons 
                          name={thread.isLiked ? "heart" : "heart-outline"} 
                          size={20} 
                          color={thread.isLiked ? categoryColor : "#AAAAAA"} 
                        />
                        <Text 
                          style={[
                            styles.actionText, 
                            thread.isLiked ? { color: categoryColor } : {}
                          ]}
                        >
                          {thread.likes || 0}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleReply(thread.id, thread.author.name)}
                      >
                        <Ionicons name="chatbubble-outline" size={20} color="#AAAAAA" />
                        <Text style={styles.actionText}>返信</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleShare(thread.id)}
                      >
                        <Ionicons name="share-outline" size={20} color="#AAAAAA" />
                        <Text style={styles.actionText}>共有</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <Text style={styles.repliesTitle}>返信 {messageList.length}件</Text>
                  </View>
                }
                renderItem={({ item, index }) => (
                  <MessageItem
                    message={item}
                    onReply={handleReply}
                    onLike={handleLike}
                    currentInstrument={currentInstrument}
                    isLastMessage={index === messageList.length - 1}
                    allMessages={messageList}
                    isThreadAuthor={item.author.name === thread.author.name}
                    onShare={handleShare}
                  />
                )}
              />
              
              {/* 返信中の表示 */}
              {isReplying && replyingTo && (
                <View style={styles.replyingContainer}>
                  <View style={styles.replyingContent}>
                    <Ionicons name="return-up-back" size={16} color={categoryColor} />
                    <Text style={styles.replyingText}>
                      <Text style={{ color: categoryColor }}>{replyingTo.author}</Text>さんに返信
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      setIsReplying(false);
                      setReplyingTo(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#AAAAAA" />
                  </TouchableOpacity>
                </View>
              )}
              
              {/* メッセージ入力欄 */}
              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="メッセージを入力..."
                  placeholderTextColor="#AAAAAA"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                />
                
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    { backgroundColor: message.trim() ? categoryColor : '#333333' }
                  ]}
                  onPress={handleSendMessage}
                  disabled={message.trim() === ''}
                >
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <MusicFAB isThreadScreen={true} />
            </SafeAreaView>
          </KeyboardAvoidingView>
        </RNAnimated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  backLink: {
    fontSize: 16,
    color: '#7F3DFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  channelName: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  threadHeader: {
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
    marginLeft: 16,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  threadTime: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  threadContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  threadImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  threadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 4,
  },
  divider: {
    backgroundColor: '#333333',
    marginVertical: 16,
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  lastMessage: {
    marginBottom: 40,
  },
  threadAuthorMessage: {
    opacity: 1, // 投稿者のメッセージはハイライト
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageSender: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  authorBadge: {
    fontSize: 10,
    marginLeft: 6,
    paddingHorizontal: 6,
    height: 18,
  },
  messageTime: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  messageText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  messageImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  messageActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  messageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  messageActionBtnText: {
    fontSize: 12,
    color: '#AAAAAA',
    marginLeft: 4,
  },
  replyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#2A2A2A',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  replyingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyingText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  replyToContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  replyToBar: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 8,
  },
  replyToContent: {
    flex: 1,
  },
  replyToAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  replyToText: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  messageMenu: {
    backgroundColor: '#2A2A2A',
  },
  breadcrumbContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  breadcrumbGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(60, 60, 80, 0.5)',
  },
  breadcrumbActiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(127, 61, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(127, 61, 255, 0.5)',
  },
  breadcrumbText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  breadcrumbActiveText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  breadcrumbSeparatorContainer: {
    paddingHorizontal: 4,
  },
}); 