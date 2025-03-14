import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Searchbar, Button, Menu, Divider, FAB, Card, Chip, Snackbar, Dialog, TextInput, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { threadService, channelService } from '../../../../firebase/services';
import { Thread, Channel } from '../../../../firebase/models';
import { auth } from '../../../../firebase/config';

export default function ThreadListScreen() {
  const { instrument, channelId } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('最新の投稿');
  const [loading, setLoading] = useState(true);
  const [channelInfo, setChannelInfo] = useState<Channel | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);

  // スレッドとチャンネル情報を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // チャンネル情報を取得
        if (typeof channelId === 'string') {
          const channelsData = await channelService.getChannelsByInstrument(
            typeof instrument === 'string' ? instrument : ''
          );
          const currentChannel = channelsData.find(channel => channel.id === channelId);
          if (currentChannel) {
            setChannelInfo(currentChannel);
          }
          
          // スレッド一覧を取得 - instrument パラメータを追加
          const threadsData = await threadService.getThreadsByChannel(
            channelId, 
            sortBy,
            typeof instrument === 'string' ? instrument : undefined
          );
          setThreads(threadsData);
          setFilteredThreads(threadsData);
          
          // 初期ソート
          sortThreads(threadsData, sortBy);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        showSnackbar('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [channelId, instrument, sortBy]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = threads.filter(thread => 
        thread.title.toLowerCase().includes(query.toLowerCase()) ||
        thread.authorName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredThreads(filtered);
    } else {
      setFilteredThreads(threads);
    }
  };

  const sortThreads = (threadsToSort: Thread[], sortOption: string) => {
    let sortedThreads = [...threadsToSort];
    switch (sortOption) {
      case '最新の投稿':
        sortedThreads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case '最近の活動':
        sortedThreads.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        break;
      case '返信数':
        sortedThreads.sort((a, b) => b.messageCount - a.messageCount);
        break;
      default:
        break;
    }
    return sortedThreads;
  };

  const handleSort = (sortOption: string) => {
    setSortBy(sortOption);
    setMenuVisible(false);
    const sorted = sortThreads(filteredThreads, sortOption);
    setFilteredThreads(sorted);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleCreateThread = async () => {
    if (newThreadTitle.trim() && !creatingThread) {
      try {
        setCreatingThread(true);
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          showSnackbar('ログインが必要です');
          return;
        }
        
        if (typeof channelId !== 'string' || typeof instrument !== 'string') {
          showSnackbar('チャンネルIDまたは楽器カテゴリが無効です');
          return;
        }
        
        const threadData: Omit<Thread, 'id' | 'createdAt' | 'lastActivity'> = {
          channelId: channelId,
          instrument: instrument,
          title: newThreadTitle.trim(),
          authorId: currentUser.uid,
          authorName: currentUser.displayName || 'ユーザー',
          messageCount: 1, // 最初のメッセージを含む
          isPinned: false
        };
        
        const newThread = await threadService.createThread(threadData, newThreadContent.trim());
        
        // 新しいスレッドを追加
        setThreads(prevThreads => [newThread, ...prevThreads]);
        setFilteredThreads(prevThreads => [newThread, ...prevThreads]);
        
        // フォームをリセット
        setNewThreadTitle('');
        setNewThreadContent('');
        setDialogVisible(false);
        
        // 新しいスレッドに移動
        router.push(`/category/${instrument}/${channelId}/${newThread.id}`);
      } catch (error) {
        console.error('スレッド作成エラー:', error);
        showSnackbar('スレッドの作成に失敗しました');
      } finally {
        setCreatingThread(false);
      }
    }
  };

  const renderThreadItem = ({ item }: { item: Thread }) => (
    <TouchableOpacity onPress={() => router.push(`/category/${instrument}/${channelId}/${item.id}`)}>
      <Card style={styles.threadCard}>
        <Card.Content>
          <Text style={styles.threadTitle}>{item.title}</Text>
          <View style={styles.threadInfo}>
            <Text style={styles.threadAuthor}>{item.authorName}</Text>
            <Text style={styles.threadDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.threadFooter}>
            <Chip icon="message-reply" style={styles.replyChip}>
              {item.messageCount}
            </Chip>
            <Text style={styles.lastActivity}>最終更新: {formatDate(item.lastActivity)}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{channelInfo?.name || channelId} チャンネル</Text>
          <Text style={styles.subtitle}>{channelInfo?.description || `${instrument}に関する${channelId}の話題`}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="スレッドを検索"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#7F3DFF"
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.sortButton}
              labelStyle={styles.sortButtonLabel}
              icon="sort"
            >
              {sortBy}
            </Button>
          }
        >
          <Menu.Item onPress={() => handleSort('最新の投稿')} title="最新の投稿" />
          <Menu.Item onPress={() => handleSort('最近の活動')} title="最近の活動" />
          <Menu.Item onPress={() => handleSort('返信数')} title="返信数" />
        </Menu>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7F3DFF" />
          <Text style={styles.loadingText}>スレッドを読み込み中...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredThreads}
          renderItem={renderThreadItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#AAAAAA" />
              <Text style={styles.emptyText}>スレッドが見つかりませんでした</Text>
              <Text style={styles.emptySubText}>新しいスレッドを作成してみましょう</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={() => setDialogVisible(true)}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>新しいスレッドを作成</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="タイトル"
              value={newThreadTitle}
              onChangeText={setNewThreadTitle}
              style={styles.dialogInput}
              mode="outlined"
              outlineColor="#2A2A2A"
              activeOutlineColor="#7F3DFF"
              theme={{ colors: { text: '#FFFFFF', placeholder: '#AAAAAA', background: '#1E1E2E' } }}
            />
            <TextInput
              label="最初のメッセージ"
              value={newThreadContent}
              onChangeText={setNewThreadContent}
              style={[styles.dialogInput, styles.messageInput]}
              mode="outlined"
              multiline
              numberOfLines={4}
              outlineColor="#2A2A2A"
              activeOutlineColor="#7F3DFF"
              theme={{ colors: { text: '#FFFFFF', placeholder: '#AAAAAA', background: '#1E1E2E' } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} textColor="#AAAAAA">キャンセル</Button>
            <Button 
              onPress={handleCreateThread} 
              loading={creatingThread}
              disabled={!newThreadTitle.trim() || !newThreadContent.trim() || creatingThread}
              textColor="#7F3DFF"
            >
              作成
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    elevation: 0,
  },
  sortButton: {
    borderColor: '#7F3DFF',
    borderRadius: 12,
  },
  sortButtonLabel: {
    color: '#7F3DFF',
  },
  listContainer: {
    padding: 16,
  },
  threadCard: {
    marginBottom: 12,
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    elevation: 2,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  threadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  threadAuthor: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  threadDate: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replyChip: {
    backgroundColor: '#2A2A2A',
    height: 28,
  },
  lastActivity: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  emptyContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 16,
    marginTop: 16,
  },
  emptySubText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#7F3DFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 16,
    marginTop: 16,
  },
  dialog: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
  },
  dialogTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dialogInput: {
    backgroundColor: '#2A2A2A',
    marginBottom: 16,
  },
  messageInput: {
    height: 120,
  },
  snackbar: {
    backgroundColor: '#2A2A2A',
  },
});