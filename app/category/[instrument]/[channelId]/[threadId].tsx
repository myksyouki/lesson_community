import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Keyboard,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Avatar, Divider, Menu, Snackbar } from 'react-native-paper';
import { messageService, threadService } from '../../../../firebase/services';
import { Message } from '../../../../firebase/models';
import { auth } from '../../../../firebase/config';

export default function ThreadScreen() {
  const { instrument, channelId, threadId } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // スレッドのメッセージを取得
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        if (typeof threadId === 'string') {
          // スレッドの情報を取得
          const threadsData = await threadService.getThreadsByChannel(
            typeof channelId === 'string' ? channelId : ''
          );
          const currentThread = threadsData.find(thread => thread.id === threadId);
          if (currentThread) {
            setThreadTitle(currentThread.title);
          }
          
          // メッセージを取得
          const messagesData = await messageService.getMessagesByThread(threadId);
          setMessages(messagesData);
        }
      } catch (error) {
        console.error('メッセージ取得エラー:', error);
        showSnackbar('メッセージの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [threadId, channelId]);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && !sending) {
      try {
        setSending(true);
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          showSnackbar('ログインが必要です');
          return;
        }
        
        if (typeof threadId !== 'string') {
          showSnackbar('スレッドIDが無効です');
          return;
        }
        
        const messageData: Omit<Message, 'id' | 'timestamp'> = {
          threadId: threadId,
          content: newMessage.trim(),
          userId: currentUser.uid,
          userName: currentUser.displayName || 'ユーザー',
          userAvatar: currentUser.photoURL || undefined,
          attachments: [],
          reactions: []
        };
        
        const sentMessage = await messageService.sendMessage(messageData);
        
        // 送信したメッセージを追加（Firestoreのリアルタイムリスナーがない場合）
        setMessages(prevMessages => [...prevMessages, sentMessage]);
        setNewMessage('');
        Keyboard.dismiss();
      } catch (error) {
        console.error('メッセージ送信エラー:', error);
        showSnackbar('メッセージの送信に失敗しました');
      } finally {
        setSending(false);
      }
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: Date) => {
    return timestamp.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // メッセージをグループ化して日付ごとに区切る
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // 現在のユーザーIDを取得
  const currentUserId = auth.currentUser?.uid || '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {threadTitle || `${threadId}番スレッド`}
          </Text>
          <Text style={styles.headerSubtitle}>
            {instrument} / {channelId}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          style={styles.menu}
        >
          <Menu.Item onPress={() => {
            setMenuVisible(false);
            showSnackbar('スレッドをブックマークしました');
            // スレッドをブックマークする処理
          }} title="ブックマークする" />
          <Menu.Item onPress={() => {
            setMenuVisible(false);
            showSnackbar('通知をミュートしました');
            // 通知をミュートする処理
          }} title="通知をミュート" />
          <Divider />
          <Menu.Item onPress={() => {
            setMenuVisible(false);
            Alert.alert(
              '問題を報告',
              'このスレッドについて問題を報告しますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                { text: '報告する', style: 'destructive', onPress: () => showSnackbar('問題を報告しました') }
              ]
            );
            // 問題を報告する処理
          }} title="問題を報告" titleStyle={{ color: '#FF5252' }} />
        </Menu>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7F3DFF" />
            <Text style={styles.loadingText}>メッセージを読み込み中...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#AAAAAA" />
            <Text style={styles.emptyText}>メッセージはまだありません</Text>
            <Text style={styles.emptySubText}>最初のメッセージを送信しましょう</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {Object.keys(groupedMessages).map(date => (
              <View key={date}>
                <View style={styles.dateContainer}>
                  <Divider style={styles.dateDivider} />
                  <Text style={styles.dateText}>{date}</Text>
                  <Divider style={styles.dateDivider} />
                </View>
                {groupedMessages[date].map((message: Message) => {
                  const isCurrentUser = message.userId === currentUserId;
                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageContainer,
                        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
                      ]}
                    >
                      {!isCurrentUser && (
                        <Avatar.Text
                          size={36}
                          label={message.userName.substring(0, 2)}
                          style={styles.avatar}
                        />
                      )}
                      <View
                        style={[
                          styles.messageBubble,
                          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
                        ]}
                      >
                        {!isCurrentUser && (
                          <Text style={styles.messageUser}>{message.userName}</Text>
                        )}
                        <Text style={styles.messageContent}>{message.content}</Text>
                        <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="メッセージを入力..."
            placeholderTextColor="#AAAAAA"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={24} color={newMessage.trim() ? "#FFFFFF" : "#AAAAAA"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  menuButton: {
    padding: 4,
  },
  menu: {
    backgroundColor: '#1E1E2E',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#AAAAAA',
    marginHorizontal: 8,
  },
  dateDivider: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: 8,
    backgroundColor: '#2A2A2A',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: '#7F3DFF',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 4,
  },
  messageUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#CCCCCC',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7F3DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 8,
  },
  snackbar: {
    backgroundColor: '#1E1E2E',
  },
});