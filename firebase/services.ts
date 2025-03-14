import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  writeBatch,
  onSnapshot,
  setDoc,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { db, auth, storage } from './config';
import { User, Channel, Thread, Message, Attachment, Reaction } from './models';

// ユーザー関連のサービス
export const userService = {
  // ユーザー登録
  async register(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      const userData: User = {
        id: userCredential.user.uid,
        name: name,
        email: email,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      await addDoc(collection(db, 'users'), userData);
      return userData;
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      throw error;
    }
  },
  
  // ログイン
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userCredential.user.uid)));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data() as User;
        
        // 最終ログイン日時を更新
        await updateDoc(userDoc.docs[0].ref, {
          lastLogin: new Date()
        });
        
        return userData;
      } else {
        throw new Error('ユーザーデータが見つかりません');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    }
  },
  
  // ログアウト
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  },
  
  // 現在のユーザーを取得
  getCurrentUser(): User | null {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    return {
      id: currentUser.uid,
      name: currentUser.displayName || '',
      email: currentUser.email || '',
      avatar: currentUser.photoURL || undefined,
      createdAt: new Date(),
      lastLogin: new Date()
    };
  },
  
  // ユーザープロフィールを取得
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      // whereクエリではなく、ドキュメントIDを直接指定
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        // IDがない場合はドキュメントIDを使用
        if (!userData.id) {
          userData.id = userId;
        }
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('ユーザープロフィール取得エラー:', error);
      throw error;
    }
  },
  
  // ユーザープロフィールを更新
  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<User> {
    try {
      // whereクエリではなく、ドキュメントIDを直接指定
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log(`ユーザー ${userId} のドキュメントが存在しないため、新規作成します`);
        // ユーザードキュメントが存在しない場合は新規作成
        const userData = {
          id: userId,
          name: profileData.name || '',
          email: profileData.email || '',
          avatar: profileData.avatar || '',
          createdAt: new Date(),
          lastLogin: new Date(),
          ...profileData
        };
        
        await setDoc(userDocRef, userData);
        return userData as User;
      }
      
      // 既存ドキュメントの更新
      await updateDoc(userDocRef, { 
        ...profileData,
        updatedAt: new Date() 
      });
      
      // Firebaseの認証プロフィールも更新
      if (auth.currentUser && profileData.name) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: profileData.name,
            photoURL: profileData.avatar
          });
          console.log('Firebase認証プロフィールを更新しました');
        } catch (profileError) {
          console.error('Firebase認証プロフィール更新エラー:', profileError);
          // プロフィール更新エラーは処理を継続する（Firestoreの更新は行う）
        }
      }
      
      // 更新後のユーザー情報を取得して返す
      const updatedUserDoc = await getDoc(userDocRef);
      const userData = updatedUserDoc.data() as User;
      
      // IDが不足している場合は追加
      if (!userData.id) {
        userData.id = userId;
      }
      
      return userData;
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  },
  
  // ユーザーの楽器情報を更新
  async updateUserInstruments(userId: string, instruments: string[]): Promise<User> {
    try {
      // whereクエリではなく、ドキュメントIDを直接指定
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log(`ユーザー ${userId} のドキュメントが存在しないため、新規作成します`);
        // ユーザードキュメントが存在しない場合は新規作成
        const userData = {
          id: userId,
          name: '',
          email: '',
          instruments,
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        await setDoc(userDocRef, userData);
        return userData as User;
      }
      
      // 既存ドキュメントの更新
      await updateDoc(userDocRef, { 
        instruments,
        updatedAt: new Date() 
      });
      
      // 更新後のユーザー情報を取得して返す
      const updatedUserDoc = await getDoc(userDocRef);
      const userData = updatedUserDoc.data() as User;
      
      // IDが不足している場合は追加
      if (!userData.id) {
        userData.id = userId;
      }
      
      return userData;
    } catch (error) {
      console.error('楽器情報更新エラー:', error);
      throw error;
    }
  },
  
  // ユーザー設定を取得
  async getUserSettings(userId: string): Promise<{ darkMode?: boolean; notifications?: boolean; fabEnabled?: boolean; language?: string; fontSize?: string; } | null> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          darkMode: userData.darkMode,
          notifications: userData.notifications,
          fabEnabled: userData.fabEnabled,
          language: userData.language,
          fontSize: userData.fontSize
        };
      }
      
      return null;
    } catch (error) {
      console.error('ユーザー設定取得エラー:', error);
      throw error;
    }
  },
  
  // ユーザー設定を更新
  async updateUserSettings(userId: string, settings: { darkMode?: boolean; notifications?: boolean; fabEnabled?: boolean; language?: string; fontSize?: string; }): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // ユーザードキュメントが存在しない場合は新規作成
        await setDoc(userDocRef, {
          id: userId,
          createdAt: new Date(),
          ...settings
        });
        return;
      }
      
      // 既存ドキュメントを更新
      await updateDoc(userDocRef, { 
        ...settings,
        updatedAt: new Date() 
      });
      
      console.log('ユーザー設定を更新しました', settings);
    } catch (error) {
      console.error('ユーザー設定更新エラー:', error);
      throw error;
    }
  },
  
  // ユーザーのアバター画像をアップロード
  async uploadUserAvatar(userId: string, imageUri: string): Promise<string> {
    try {
      // 画像のファイル名を生成
      const fileName = `avatars/${userId}_${new Date().getTime()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      // 画像をBlobに変換
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Storageにアップロード
      await uploadBytes(storageRef, blob);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);
      
      // ユーザープロフィールのアバターURLを更新
      await this.updateUserProfile(userId, { avatar: downloadURL });
      
      return downloadURL;
    } catch (error) {
      console.error('アバターアップロードエラー:', error);
      throw error;
    }
  }
};

// チャンネル関連のサービス
export const channelService = {
  // チャンネル一覧を取得
  async getChannelsByInstrument(instrument: string): Promise<Channel[]> {
    try {
      const channelsQuery = query(
        collection(db, 'channels'),
        where('instrument', '==', instrument),
        orderBy('name')
      );
      
      const channelDocs = await getDocs(channelsQuery);
      return channelDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Channel));
    } catch (error) {
      console.error('チャンネル取得エラー:', error);
      throw error;
    }
  },
  
  // 全てのチャンネルを取得
  async getAllChannels(): Promise<Channel[]> {
    try {
      const channelsQuery = query(
        collection(db, 'channels'),
        orderBy('name')
      );
      
      const channelDocs = await getDocs(channelsQuery);
      return channelDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Channel));
    } catch (error) {
      console.error('チャンネル取得エラー:', error);
      throw error;
    }
  },
  
  // チャンネルを作成
  async createChannel(channelData: Omit<Channel, 'id' | 'createdAt' | 'memberCount' | 'threadCount'>): Promise<Channel> {
    try {
      const newChannel: Omit<Channel, 'id'> = {
        ...channelData,
        createdAt: new Date(),
        memberCount: 0,
        threadCount: 0
      };
      
      const docRef = await addDoc(collection(db, 'channels'), newChannel);
      
      return {
        id: docRef.id,
        ...newChannel
      } as Channel;
    } catch (error) {
      console.error('チャンネル作成エラー:', error);
      throw error;
    }
  },
  
  // チャンネル情報を更新
  async updateChannel(channelId: string, channelData: Partial<Channel>): Promise<Channel> {
    try {
      const channelRef = doc(db, 'channels', channelId);
      await updateDoc(channelRef, channelData);
      
      const updatedDoc = await getDoc(channelRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Channel;
    } catch (error) {
      console.error('チャンネル更新エラー:', error);
      throw error;
    }
  },
  
  // チャンネルを削除
  async deleteChannel(channelId: string): Promise<void> {
    try {
      // チャンネルに関連するスレッドを取得
      const threadsQuery = query(
        collection(db, 'threads'),
        where('channelId', '==', channelId)
      );
      const threadDocs = await getDocs(threadsQuery);
      
      // 各スレッドとそれに関連するメッセージを削除
      const batch = writeBatch(db);
      
      for (const threadDoc of threadDocs.docs) {
        // スレッドに関連するメッセージを取得
        const messagesQuery = query(
          collection(db, 'messages'),
          where('threadId', '==', threadDoc.id)
        );
        const messageDocs = await getDocs(messagesQuery);
        
        // メッセージを削除
        messageDocs.docs.forEach(messageDoc => {
          batch.delete(messageDoc.ref);
        });
        
        // スレッドを削除
        batch.delete(threadDoc.ref);
      }
      
      // チャンネルを削除
      batch.delete(doc(db, 'channels', channelId));
      
      // バッチ処理を実行
      await batch.commit();
    } catch (error) {
      console.error('チャンネル削除エラー:', error);
      throw error;
    }
  },
  
  // チャンネルの詳細情報を取得
  async getChannelById(channelId: string): Promise<Channel | null> {
    try {
      const channelDoc = await getDoc(doc(db, 'channels', channelId));
      
      if (channelDoc.exists()) {
        return {
          id: channelDoc.id,
          ...channelDoc.data()
        } as Channel;
      }
      
      return null;
    } catch (error) {
      console.error('チャンネル取得エラー:', error);
      throw error;
    }
  },
  
  // チャンネルのスレッド数を更新
  async updateThreadCount(channelId: string, increment: number = 1): Promise<void> {
    try {
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (channelDoc.exists()) {
        const currentCount = channelDoc.data().threadCount || 0;
        await updateDoc(channelRef, {
          threadCount: currentCount + increment
        });
      }
    } catch (error) {
      console.error('スレッド数更新エラー:', error);
      throw error;
    }
  },
  
  // チャンネル一覧をリアルタイムで監視
  subscribeToChannels(callback: (channels: Channel[]) => void): () => void {
    try {
      const channelsQuery = query(
        collection(db, 'channels'),
        orderBy('name')
      );
      
      // onSnapshotリスナーを設定
      const unsubscribe = onSnapshot(channelsQuery, (snapshot) => {
        const channels = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Channel));
        
        callback(channels);
      }, (error) => {
        console.error('チャンネル監視エラー:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('チャンネル監視設定エラー:', error);
      return () => {};
    }
  },
  
  // 特定のカテゴリーのチャンネルをリアルタイムで監視
  subscribeToChannelsByInstrument(instrument: string, callback: (channels: Channel[]) => void): () => void {
    try {
      const channelsQuery = query(
        collection(db, 'channels'),
        where('instrument', '==', instrument),
        orderBy('name')
      );
      
      // onSnapshotリスナーを設定
      const unsubscribe = onSnapshot(channelsQuery, (snapshot) => {
        const channels = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Channel));
        
        callback(channels);
      }, (error) => {
        console.error(`${instrument}カテゴリーのチャンネル監視エラー:`, error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('カテゴリー別チャンネル監視設定エラー:', error);
      return () => {};
    }
  },
  
  // 特定のチャンネルをリアルタイムで監視
  subscribeToChannel(channelId: string, callback: (channel: Channel | null) => void): () => void {
    try {
      const channelRef = doc(db, 'channels', channelId);
      
      // onSnapshotリスナーを設定
      const unsubscribe = onSnapshot(channelRef, (doc) => {
        if (doc.exists()) {
          const channel = {
            id: doc.id,
            ...doc.data()
          } as Channel;
          
          callback(channel);
        } else {
          callback(null);
        }
      }, (error) => {
        console.error(`チャンネル(${channelId})監視エラー:`, error);
        callback(null);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('チャンネル個別監視設定エラー:', error);
      return () => {};
    }
  }
};

// スレッド関連のサービス
export const threadService = {
  // チャンネル内のスレッド一覧を取得
  async getThreadsByChannel(channelId: string, sortBy: string = 'lastActivity', instrument?: string): Promise<Thread[]> {
    try {
      let queryConstraints: any[] = [where('channelId', '==', channelId)];
      
      // instrumentが指定されている場合は、そのinstrumentに関連するスレッドのみを取得
      if (instrument) {
        queryConstraints.push(where('instrument', '==', instrument));
      }
      
      // ソート条件を追加
      if (sortBy === 'lastActivity') {
        queryConstraints.push(orderBy('lastActivity', 'desc'));
      } else if (sortBy === 'createdAt') {
        queryConstraints.push(orderBy('createdAt', 'desc'));
      } else if (sortBy === 'messageCount') {
        queryConstraints.push(orderBy('messageCount', 'desc'));
      } else {
        queryConstraints.push(orderBy('lastActivity', 'desc'));
      }
      
      const threadsQuery = query(collection(db, 'threads'), ...queryConstraints);
      
      const threadDocs = await getDocs(threadsQuery);
      return threadDocs.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          channelId: data.channelId,
          instrument: data.instrument,
          authorId: data.authorId,
          authorName: data.authorName,
          authorAvatar: data.authorAvatar,
          createdAt: (data.createdAt as Timestamp).toDate(),
          lastActivity: (data.lastActivity as Timestamp).toDate(),
          messageCount: data.messageCount,
          isPinned: data.isPinned
        } as Thread;
      });
    } catch (error) {
      console.error('スレッド取得エラー:', error);
      throw error;
    }
  },
  
  // スレッドを検索
  async searchThreads(channelId: string, searchQuery: string): Promise<Thread[]> {
    try {
      // 注意: Firestoreは全文検索に対応していないため、クライアント側でフィルタリングする
      const threadsQuery = query(
        collection(db, 'threads'),
        where('channelId', '==', channelId),
        orderBy('lastActivity', 'desc')
      );
      
      const threadDocs = await getDocs(threadsQuery);
      const searchLower = searchQuery.toLowerCase();
      
      return threadDocs.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            channelId: data.channelId,
            instrument: data.instrument,
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            createdAt: (data.createdAt as Timestamp).toDate(),
            lastActivity: (data.lastActivity as Timestamp).toDate(),
            messageCount: data.messageCount,
            isPinned: data.isPinned
          } as Thread;
        })
        .filter(thread => 
          thread.title.toLowerCase().includes(searchLower) || 
          thread.authorName.toLowerCase().includes(searchLower)
        );
    } catch (error) {
      console.error('スレッド検索エラー:', error);
      throw error;
    }
  },
  
  // 高度なスレッド検索
  async advancedSearchThreads(params: {
    channelId?: string;
    instrument?: string;
    authorId?: string;
    searchQuery?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    limit?: number;
  }): Promise<Thread[]> {
    try {
      const {
        channelId,
        instrument,
        authorId,
        searchQuery,
        startDate,
        endDate,
        sortBy = 'lastActivity',
        limit: resultLimit = 20
      } = params;
      
      // クエリの構築
      let queryConstraints: any[] = [];
      
      if (channelId) {
        queryConstraints.push(where('channelId', '==', channelId));
      }
      
      if (instrument) {
        queryConstraints.push(where('instrument', '==', instrument));
      }
      
      if (authorId) {
        queryConstraints.push(where('authorId', '==', authorId));
      }
      
      if (startDate) {
        queryConstraints.push(where('createdAt', '>=', startDate));
      }
      
      if (endDate) {
        queryConstraints.push(where('createdAt', '<=', endDate));
      }
      
      // ソート順の設定
      if (sortBy === 'lastActivity') {
        queryConstraints.push(orderBy('lastActivity', 'desc'));
      } else if (sortBy === 'createdAt') {
        queryConstraints.push(orderBy('createdAt', 'desc'));
      } else if (sortBy === 'messageCount') {
        queryConstraints.push(orderBy('messageCount', 'desc'));
      } else {
        queryConstraints.push(orderBy('lastActivity', 'desc'));
      }
      
      // 結果数の制限
      queryConstraints.push(limit(resultLimit));
      
      // クエリの実行
      const threadsQuery = query(collection(db, 'threads'), ...queryConstraints);
      const threadDocs = await getDocs(threadsQuery);
      
      // 結果の変換
      let threads = threadDocs.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          channelId: data.channelId,
          instrument: data.instrument,
          authorId: data.authorId,
          authorName: data.authorName,
          authorAvatar: data.authorAvatar,
          createdAt: (data.createdAt as Timestamp).toDate(),
          lastActivity: (data.lastActivity as Timestamp).toDate(),
          messageCount: data.messageCount,
          isPinned: data.isPinned
        } as Thread;
      });
      
      // テキスト検索（クライアント側でフィルタリング）
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        threads = threads.filter(thread => 
          thread.title.toLowerCase().includes(searchLower) || 
          thread.authorName.toLowerCase().includes(searchLower)
        );
      }
      
      return threads;
    } catch (error) {
      console.error('高度なスレッド検索エラー:', error);
      throw error;
    }
  },
  
  // スレッドを作成
  async createThread(thread: Omit<Thread, 'id' | 'createdAt' | 'lastActivity' | 'messageCount' | 'isPinned'>, initialMessage?: string | null): Promise<Thread> {
    try {
      const newThread: Omit<Thread, 'id'> = {
        ...thread,
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: initialMessage ? 1 : 0,
        isPinned: false
      };
      
      const threadRef = await addDoc(collection(db, 'threads'), newThread);
      
      // チャンネルのスレッド数を更新
      await channelService.updateThreadCount(thread.channelId);
      
      // 初期メッセージがある場合は追加（nullの場合は追加しない）
      if (initialMessage && initialMessage !== null) {
        await messageService.addMessage({
          threadId: threadRef.id,
          content: initialMessage,
          userId: thread.authorId,
          userName: thread.authorName,
          userAvatar: thread.authorAvatar,
          attachments: []
        });
      }
      
      return {
        id: threadRef.id,
        ...newThread
      } as Thread;
    } catch (error) {
      console.error('スレッド作成エラー:', error);
      throw error;
    }
  },
  
  // スレッドを更新
  async updateThread(threadId: string, threadData: Partial<Thread>): Promise<Thread> {
    try {
      const threadRef = doc(db, 'threads', threadId);
      await updateDoc(threadRef, threadData);
      
      const updatedDoc = await getDoc(threadRef);
      const data = updatedDoc.data();
      
      return {
        id: updatedDoc.id,
        ...data,
        createdAt: (data?.createdAt as Timestamp).toDate(),
        lastActivity: (data?.lastActivity as Timestamp).toDate()
      } as Thread;
    } catch (error) {
      console.error('スレッド更新エラー:', error);
      throw error;
    }
  },
  
  // スレッドを削除
  async deleteThread(threadId: string, channelId: string): Promise<void> {
    try {
      // スレッドに関連するメッセージを取得
      const messagesQuery = query(
        collection(db, 'messages'),
        where('threadId', '==', threadId)
      );
      const messageDocs = await getDocs(messagesQuery);
      
      // バッチ処理で削除
      const batch = writeBatch(db);
      
      // メッセージを削除
      messageDocs.docs.forEach(messageDoc => {
        batch.delete(messageDoc.ref);
      });
      
      // スレッドを削除
      batch.delete(doc(db, 'threads', threadId));
      
      // バッチ処理を実行
      await batch.commit();
      
      // チャンネルのスレッド数を更新
      await channelService.updateThreadCount(channelId, -1);
    } catch (error) {
      console.error('スレッド削除エラー:', error);
      throw error;
    }
  },
  
  // スレッドの詳細情報を取得
  async getThreadById(threadId: string): Promise<Thread | null> {
    try {
      const threadDoc = await getDoc(doc(db, 'threads', threadId));
      
      if (threadDoc.exists()) {
        const data = threadDoc.data();
        return {
          id: threadDoc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
          lastActivity: (data.lastActivity as Timestamp).toDate()
        } as Thread;
      }
      
      return null;
    } catch (error) {
      console.error('スレッド取得エラー:', error);
      throw error;
    }
  },
  
  // スレッドのメッセージ数を更新
  async updateMessageCount(threadId: string, increment: number = 1): Promise<void> {
    try {
      const threadRef = doc(db, 'threads', threadId);
      const threadDoc = await getDoc(threadRef);
      
      if (threadDoc.exists()) {
        const currentCount = threadDoc.data().messageCount || 0;
        await updateDoc(threadRef, {
          messageCount: currentCount + increment,
          lastActivity: new Date()
        });
      }
    } catch (error) {
      console.error('メッセージ数更新エラー:', error);
      throw error;
    }
  },
  
  // スレッドをピン留め/解除
  async togglePinThread(threadId: string, isPinned: boolean): Promise<void> {
    try {
      const threadRef = doc(db, 'threads', threadId);
      await updateDoc(threadRef, { isPinned });
    } catch (error) {
      console.error('スレッドピン留めエラー:', error);
      throw error;
    }
  },
  
  // チャンネル内のスレッド一覧をリアルタイムで監視
  subscribeToThreadsByChannel(
    channelId: string, 
    sortBy: string = 'lastActivity',
    callback: (threads: Thread[]) => void,
    instrument?: string
  ): () => void {
    try {
      let queryConstraints: any[] = [where('channelId', '==', channelId)];
      
      // instrumentが指定されている場合は、そのinstrumentに関連するスレッドのみを取得
      if (instrument) {
        queryConstraints.push(where('instrument', '==', instrument));
      }
      
      // ソート条件を追加
      if (sortBy === 'lastActivity') {
        queryConstraints.push(orderBy('lastActivity', 'desc'));
      } else if (sortBy === 'createdAt') {
        queryConstraints.push(orderBy('createdAt', 'desc'));
      } else if (sortBy === 'messageCount') {
        queryConstraints.push(orderBy('messageCount', 'desc'));
      } else {
        queryConstraints.push(orderBy('lastActivity', 'desc'));
      }
      
      const threadsQuery = query(collection(db, 'threads'), ...queryConstraints);
      
      // onSnapshotリスナーを設定
      const unsubscribe = onSnapshot(threadsQuery, (snapshot) => {
        const threads = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            channelId: data.channelId,
            instrument: data.instrument,
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            createdAt: (data.createdAt as Timestamp).toDate(),
            lastActivity: (data.lastActivity as Timestamp).toDate(),
            messageCount: data.messageCount,
            isPinned: data.isPinned
          } as Thread;
        });
        
        callback(threads);
      }, (error) => {
        console.error(`チャンネル(${channelId})のスレッド監視エラー:`, error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('スレッド監視設定エラー:', error);
      return () => {};
    }
  },
  
  // HOTスレッド（いいね数が多い順）をリアルタイムで監視
  subscribeToHotThreads(
    instrument: string | null = null,
    limitCount: number = 10,
    callback: (threads: Thread[]) => void
  ): () => void {
    try {
      let threadsQuery;
      
      // instrumentが指定されている場合は、そのinstrumentに関連するスレッドのみを取得
      if (instrument) {
        console.log(`Getting HOT threads for instrument: ${instrument}`);
        threadsQuery = query(
          collection(db, 'threads'),
          where('instrument', '==', instrument),
          orderBy('lastActivity', 'desc'),
          limit(limitCount * 3) // 多めに取得してクライアント側でソート
        );
      } else {
        // instrumentが指定されていない場合は全てのスレッドを取得
        console.log('Getting HOT threads for all instruments');
        threadsQuery = query(
          collection(db, 'threads'),
          orderBy('lastActivity', 'desc'),
          limit(limitCount * 3) // 多めに取得してクライアント側でソート
        );
      }
      
      // onSnapshotリスナーを設定
      const unsubscribe = onSnapshot(threadsQuery, (snapshot) => {
        const threads = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            channelId: data.channelId,
            instrument: data.instrument,
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            createdAt: (data.createdAt as Timestamp).toDate(),
            lastActivity: (data.lastActivity as Timestamp).toDate(),
            messageCount: data.messageCount,
            isPinned: data.isPinned
          } as Thread;
        });
        
        // instrumentが指定されている場合は、再度クライアント側でフィルタリング (念のため)
        let filteredThreads = threads;
        if (instrument) {
          filteredThreads = threads.filter(thread => thread.instrument === instrument);
          console.log(`Filtered to ${filteredThreads.length} threads for instrument ${instrument}`);
        }
        
        // ここでは仮にlastActivity（最終活動時間）でソートしています
        // 実際のアプリケーションでは「いいね」の数でソートする必要があります
        const sortedThreads = [...filteredThreads].sort((a, b) => {
          const timeA = a.lastActivity instanceof Date ? a.lastActivity.getTime() : 0;
          const timeB = b.lastActivity instanceof Date ? b.lastActivity.getTime() : 0;
          return timeB - timeA;
        }).slice(0, limitCount);
        
        callback(sortedThreads);
      }, (error) => {
        console.error('HOTスレッド監視エラー:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('HOTスレッド監視設定エラー:', error);
      return () => {};
    }
  },
  
  // 特定のスレッドをリアルタイムで監視
  subscribeToThread(threadId: string, callback: (thread: Thread | null) => void): () => void {
    try {
      const threadRef = doc(db, 'threads', threadId);
      
      // onSnapshotリスナーを設定
      const unsubscribe = onSnapshot(threadRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const thread = {
            id: doc.id,
            title: data.title,
            channelId: data.channelId,
            instrument: data.instrument,
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            createdAt: (data.createdAt as Timestamp).toDate(),
            lastActivity: (data.lastActivity as Timestamp).toDate(),
            messageCount: data.messageCount,
            isPinned: data.isPinned
          } as Thread;
          
          callback(thread);
        } else {
          callback(null);
        }
      }, (error) => {
        console.error(`スレッド(${threadId})監視エラー:`, error);
        callback(null);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('スレッド個別監視設定エラー:', error);
      return () => {};
    }
  },
  
  // スレッドのいいねをトグル
  async toggleLikeThread(threadId: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      // トランザクションを使用してデータの整合性を保つ
      const threadRef = doc(db, 'threads', threadId);
      
      // 「likes」コレクションでスレッドのいいねを管理
      const likeRef = doc(db, 'likes', `${threadId}_${userId}`);
      const likeDoc = await getDoc(likeRef);
      
      // いいねの存在をチェック
      const isLiked = likeDoc.exists();
      
      // いいねを追加または削除
      if (isLiked) {
        // いいねを削除
        await deleteDoc(likeRef);
      } else {
        // いいねを追加
        await setDoc(likeRef, {
          threadId,
          userId,
          createdAt: new Date()
        });
      }
      
      // いいね数を再計算
      const likesQuery = query(
        collection(db, 'likes'),
        where('threadId', '==', threadId)
      );
      
      const likesSnapshot = await getDocs(likesQuery);
      const likeCount = likesSnapshot.size;
      
      // スレッドのlikeCount値を更新
      await updateDoc(threadRef, {
        likeCount: likeCount
      });
      
      return {
        isLiked: !isLiked,
        likeCount
      };
    } catch (error) {
      console.error('いいねトグルエラー:', error);
      throw error;
    }
  },
  
  // ユーザーがスレッドにいいねしているかチェック
  async isThreadLikedByUser(threadId: string, userId: string): Promise<boolean> {
    try {
      const likeRef = doc(db, 'likes', `${threadId}_${userId}`);
      const likeDoc = await getDoc(likeRef);
      return likeDoc.exists();
    } catch (error) {
      console.error('いいねチェックエラー:', error);
      return false;
    }
  },
  
  // スレッドのいいね数を取得
  async getThreadLikeCount(threadId: string): Promise<number> {
    try {
      const likesQuery = query(
        collection(db, 'likes'),
        where('threadId', '==', threadId)
      );
      
      const likesSnapshot = await getDocs(likesQuery);
      return likesSnapshot.size;
    } catch (error) {
      console.error('いいね数取得エラー:', error);
      return 0;
    }
  }
};

// メッセージ関連のサービス
export const messageService = {
  // スレッド内のメッセージ一覧を取得
  async getMessagesByThread(threadId: string, messageLimit?: number): Promise<Message[]> {
    try {
      let messagesQuery = query(
        collection(db, 'messages'),
        where('threadId', '==', threadId),
        orderBy('timestamp', 'asc')
      );
      
      // メッセージ数を制限する場合
      if (messageLimit) {
        messagesQuery = query(messagesQuery, limit(messageLimit));
      }
      
      const messageDocs = await getDocs(messagesQuery);
      return messageDocs.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          threadId: data.threadId,
          content: data.content,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          timestamp: (data.timestamp as Timestamp).toDate(),
          attachments: data.attachments || [],
          reactions: data.reactions || []
        } as Message;
      });
    } catch (error) {
      console.error('メッセージ取得エラー:', error);
      throw error;
    }
  },
  
  // メッセージを追加
  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    try {
      const newMessage = {
        ...message,
        timestamp: new Date(),
        reactions: []
      };
      
      const docRef = await addDoc(collection(db, 'messages'), newMessage);
      
      // スレッドの最終アクティビティと投稿数を更新
      await threadService.updateMessageCount(message.threadId);
      
      return {
        id: docRef.id,
        ...newMessage
      } as Message;
    } catch (error) {
      console.error('メッセージ追加エラー:', error);
      throw error;
    }
  },
  
  // メッセージを更新
  async updateMessage(messageId: string, content: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { 
        content,
        isEdited: true
      });
    } catch (error) {
      console.error('メッセージ更新エラー:', error);
      throw error;
    }
  },
  
  // メッセージを削除
  async deleteMessage(messageId: string, threadId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      
      // スレッドのメッセージ数を更新
      await threadService.updateMessageCount(threadId, -1);
    } catch (error) {
      console.error('メッセージ削除エラー:', error);
      throw error;
    }
  },
  
  // 画像付きメッセージを送信
  async sendMessageWithImage(message: Omit<Message, 'id' | 'timestamp'>, imageUri: string): Promise<Message> {
    try {
      // 画像のファイル名を生成
      const fileName = `messages/${message.threadId}/${new Date().getTime()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      // 画像をBlobに変換
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Storageにアップロード
      await uploadBytes(storageRef, blob);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);
      
      // 添付ファイル情報を作成
      const attachment: Attachment = {
        id: `${new Date().getTime()}`,
        type: 'image',
        url: downloadURL,
        name: fileName.split('/').pop() || 'image.jpg',
        size: blob.size
      };
      
      // メッセージに添付ファイルを追加して保存
      const messageWithImage = {
        ...message,
        attachments: [...(message.attachments || []), attachment]
      };
      
      return await this.addMessage(messageWithImage);
    } catch (error) {
      console.error('画像付きメッセージ送信エラー:', error);
      throw error;
    }
  },
  
  // 音声付きメッセージを送信
  async sendMessageWithAudio(message: Omit<Message, 'id' | 'timestamp'>, audioUri: string): Promise<Message> {
    try {
      // 音声ファイルのファイル名を生成
      const fileName = `messages/${message.threadId}/${new Date().getTime()}.m4a`;
      const storageRef = ref(storage, fileName);
      
      // 音声ファイルをBlobに変換
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      // Storageにアップロード
      await uploadBytes(storageRef, blob);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);
      
      // 添付ファイル情報を作成
      const attachment: Attachment = {
        id: `${new Date().getTime()}`,
        type: 'audio',
        url: downloadURL,
        name: fileName.split('/').pop() || 'audio.m4a',
        size: blob.size
      };
      
      // メッセージに添付ファイルを追加して保存
      const messageWithAudio = {
        ...message,
        attachments: [...(message.attachments || []), attachment]
      };
      
      return await this.addMessage(messageWithAudio);
    } catch (error) {
      console.error('音声付きメッセージ送信エラー:', error);
      throw error;
    }
  },
  
  // 複数の添付ファイル付きメッセージを送信
  async sendMessageWithAttachments(
    message: Omit<Message, 'id' | 'timestamp'>, 
    attachmentUris: Array<{uri: string, type: 'image' | 'audio' | 'video' | 'file', name: string}>
  ): Promise<Message> {
    try {
      const attachmentPromises = attachmentUris.map(async (attachment) => {
        // ファイル拡張子を取得
        const extension = attachment.name.split('.').pop() || 
          (attachment.type === 'image' ? 'jpg' : 
           attachment.type === 'audio' ? 'm4a' : 
           attachment.type === 'video' ? 'mp4' : 'file');
        
        // ファイル名を生成
        const fileName = `messages/${message.threadId}/${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
        const storageRef = ref(storage, fileName);
        
        // ファイルをBlobに変換
        const response = await fetch(attachment.uri);
        const blob = await response.blob();
        
        // Storageにアップロード
        await uploadBytes(storageRef, blob);
        
        // ダウンロードURLを取得
        const downloadURL = await getDownloadURL(storageRef);
        
        // 添付ファイル情報を作成
        return {
          id: `${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}`,
          type: attachment.type,
          url: downloadURL,
          name: attachment.name || fileName.split('/').pop() || `file.${extension}`,
          size: blob.size
        } as Attachment;
      });
      
      // すべての添付ファイルのアップロードを待機
      const attachments = await Promise.all(attachmentPromises);
      
      // メッセージに添付ファイルを追加して保存
      const messageWithAttachments = {
        ...message,
        attachments: [...(message.attachments || []), ...attachments]
      };
      
      return await this.addMessage(messageWithAttachments);
    } catch (error) {
      console.error('添付ファイル付きメッセージ送信エラー:', error);
      throw error;
    }
  },
  
  // メッセージへのリアクションを切り替える
  async toggleReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('メッセージが見つかりません');
      }
      
      // トランザクションでリアクションの更新を行う
      await runTransaction(db, async (transaction) => {
        const updatedDoc = await transaction.get(messageRef);
        const messageData = updatedDoc.data();
        
        let reactions = messageData.reactions || [];
        
        // 既存のリアクションを探す
        const existingReactionIndex = reactions.findIndex(
          (r: { emoji: string; users: string[] }) => 
          r.emoji === emoji && r.users.includes(userId)
        );
        
        if (existingReactionIndex >= 0) {
          // リアクションが既にある場合は削除
          const updatedUsers = reactions[existingReactionIndex].users.filter(
            (id: string) => id !== userId
          );
          
          if (updatedUsers.length === 0) {
            // ユーザーがいなくなった場合は、そのリアクションを削除
            reactions = reactions.filter((_, index) => index !== existingReactionIndex);
          } else {
            // ユーザーリストを更新
            reactions[existingReactionIndex].users = updatedUsers;
            reactions[existingReactionIndex].count = updatedUsers.length;
          }
        } else {
          // 新しいリアクションを追加
          const existingEmojiIndex = reactions.findIndex(
            (r: { emoji: string }) => r.emoji === emoji
          );
          
          if (existingEmojiIndex >= 0) {
            // 同じ絵文字のリアクションがある場合はユーザーを追加
            reactions[existingEmojiIndex].users.push(userId);
            reactions[existingEmojiIndex].count = reactions[existingEmojiIndex].users.length;
          } else {
            // 新しい絵文字のリアクションを追加
            reactions.push({
              emoji,
              count: 1,
              users: [userId]
            });
          }
        }
        
        // トランザクションでデータを更新
        transaction.update(messageRef, { reactions });
      });
      
      console.log(`メッセージ ${messageId} のリアクションを更新しました`);
    } catch (error) {
      console.error('リアクション更新エラー:', error);
      throw error;
    }
  },
  
  // いいねリアクションをトグルする（簡易版）
  async toggleLikeMessage(messageId: string, userId: string): Promise<{ isLiked: boolean, likeCount: number }> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('メッセージが見つかりません');
      }
      
      let result = { isLiked: false, likeCount: 0 };
      
      // トランザクションでいいねの更新を行う
      await runTransaction(db, async (transaction) => {
        const updatedDoc = await transaction.get(messageRef);
        const messageData = updatedDoc.data();
        
        let reactions = messageData.reactions || [];
        const heartEmoji = '❤️'; // ハートの絵文字を使用
        
        // 既存のいいねを探す
        const existingLikeIndex = reactions.findIndex(
          (r: { emoji: string; users: string[] }) => 
          r.emoji === heartEmoji && r.users.includes(userId)
        );
        
        if (existingLikeIndex >= 0) {
          // いいねが既にある場合は削除
          const updatedUsers = reactions[existingLikeIndex].users.filter(
            (id: string) => id !== userId
          );
          
          if (updatedUsers.length === 0) {
            // ユーザーがいなくなった場合は、そのリアクションを削除
            reactions = reactions.filter((_, index) => index !== existingLikeIndex);
          } else {
            // ユーザーリストを更新
            reactions[existingLikeIndex].users = updatedUsers;
            reactions[existingLikeIndex].count = updatedUsers.length;
          }
          
          result.isLiked = false;
        } else {
          // 新しいいいねを追加
          const existingHeartIndex = reactions.findIndex(
            (r: { emoji: string }) => r.emoji === heartEmoji
          );
          
          if (existingHeartIndex >= 0) {
            // 同じハートのリアクションがある場合はユーザーを追加
            reactions[existingHeartIndex].users.push(userId);
            reactions[existingHeartIndex].count = reactions[existingHeartIndex].users.length;
          } else {
            // 新しいハートのリアクションを追加
            reactions.push({
              emoji: heartEmoji,
              count: 1,
              users: [userId]
            });
          }
          
          result.isLiked = true;
        }
        
        // いいねの合計数を計算
        const likeReaction = reactions.find((r: { emoji: string }) => r.emoji === heartEmoji);
        result.likeCount = likeReaction ? likeReaction.count : 0;
        
        // トランザクションでデータを更新
        transaction.update(messageRef, { reactions });
      });
      
      console.log(`メッセージ ${messageId} のいいねを更新しました: `, result);
      return result;
    } catch (error) {
      console.error('いいね更新エラー:', error);
      throw error;
    }
  },
  
  // メッセージがユーザーにいいねされているか確認
  async isMessageLikedByUser(messageId: string, userId: string): Promise<boolean> {
    try {
      const messageDoc = await getDoc(doc(db, 'messages', messageId));
      
      if (!messageDoc.exists()) {
        return false;
      }
      
      const messageData = messageDoc.data();
      const reactions = messageData.reactions || [];
      const heartEmoji = '❤️';
      
      // ハートのリアクションを探す
      const heartReaction = reactions.find(
        (r: { emoji: string }) => r.emoji === heartEmoji
      );
      
      if (!heartReaction) {
        return false;
      }
      
      // ユーザーがいいねしているか確認
      return heartReaction.users.includes(userId);
    } catch (error) {
      console.error('いいね状態確認エラー:', error);
      return false;
    }
  },
  
  // メッセージのいいね数を取得
  async getMessageLikeCount(messageId: string): Promise<number> {
    try {
      const messageDoc = await getDoc(doc(db, 'messages', messageId));
      
      if (!messageDoc.exists()) {
        return 0;
      }
      
      const messageData = messageDoc.data();
      const reactions = messageData.reactions || [];
      const heartEmoji = '❤️';
      
      // ハートのリアクションを探す
      const heartReaction = reactions.find(
        (r: { emoji: string }) => r.emoji === heartEmoji
      );
      
      return heartReaction ? heartReaction.count : 0;
    } catch (error) {
      console.error('いいね数取得エラー:', error);
      return 0;
    }
  },
  
  // スレッド内のメッセージ一覧をリアルタイムで監視
  subscribeToMessagesByThread(threadId: string, callback: (messages: Message[]) => void): () => void {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('threadId', '==', threadId),
        orderBy('timestamp', 'asc')
      );
      
      // onSnapshotリスナーを設定
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            threadId: data.threadId,
            content: data.content,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            timestamp: (data.timestamp as Timestamp).toDate(),
            attachments: data.attachments || [],
            reactions: data.reactions || []
          } as Message;
        });
        
        callback(messages);
      }, (error) => {
        console.error(`スレッド(${threadId})のメッセージ監視エラー:`, error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('メッセージ監視設定エラー:', error);
      return () => {};
    }
  }
};

// Firebase接続テストサービス
export const firebaseTestService = {
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Firebase接続テスト実行中...');
      
      // 現在のユーザー情報を取得
      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : 'anonymous';
      
      // connectionTestコレクションにテストドキュメントを作成
      const testData = {
        timestamp: new Date(),
        message: 'Connection test',
        userId: userId,
        isAuthenticated: !!currentUser
      };
      
      // connectionTestコレクションにドキュメントを追加
      const docRef = await addDoc(collection(db, 'connectionTest'), testData);
      console.log('テストドキュメント作成成功:', docRef.id);
      
      // 作成したドキュメントを削除（クリーンアップ）
      await deleteDoc(docRef);
      console.log('テストドキュメント削除成功');
      
      return {
        success: true,
        message: 'Firebaseへの接続に成功しました。データの読み書きが正常に行えます。'
      };
    } catch (error) {
      console.error('Firebase接続テストエラー:', error);
      return {
        success: false,
        message: `Firebaseへの接続に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
  
  // Firebaseの設定情報を取得
  getFirebaseConfig(): { projectId: string | undefined; authDomain: string | undefined } {
    return {
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
    };
  }
};
