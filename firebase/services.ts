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
  writeBatch
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
      const userDocs = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
      
      if (!userDocs.empty) {
        return userDocs.docs[0].data() as User;
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
      const userDocs = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
      
      if (userDocs.empty) {
        throw new Error('ユーザーが見つかりません');
      }
      
      const userDocRef = userDocs.docs[0].ref;
      await updateDoc(userDocRef, { ...profileData });
      
      // Firebaseの認証プロフィールも更新
      if (auth.currentUser && profileData.name) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.name,
          photoURL: profileData.avatar
        });
      }
      
      // 更新後のユーザー情報を取得して返す
      const updatedUserDoc = await getDoc(userDocRef);
      return updatedUserDoc.data() as User;
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  },
  
  // ユーザーの楽器情報を更新
  async updateUserInstruments(userId: string, instruments: string[]): Promise<User> {
    try {
      const userDocs = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
      
      if (userDocs.empty) {
        throw new Error('ユーザーが見つかりません');
      }
      
      const userDocRef = userDocs.docs[0].ref;
      await updateDoc(userDocRef, { instruments });
      
      // 更新後のユーザー情報を取得して返す
      const updatedUserDoc = await getDoc(userDocRef);
      return updatedUserDoc.data() as User;
    } catch (error) {
      console.error('楽器情報更新エラー:', error);
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
  }
};

// スレッド関連のサービス
export const threadService = {
  // チャンネル内のスレッド一覧を取得
  async getThreadsByChannel(channelId: string, sortBy: string = 'lastActivity'): Promise<Thread[]> {
    try {
      let threadsQuery;
      
      if (sortBy === 'lastActivity') {
        threadsQuery = query(
          collection(db, 'threads'),
          where('channelId', '==', channelId),
          orderBy('lastActivity', 'desc')
        );
      } else if (sortBy === 'createdAt') {
        threadsQuery = query(
          collection(db, 'threads'),
          where('channelId', '==', channelId),
          orderBy('createdAt', 'desc')
        );
      } else if (sortBy === 'messageCount') {
        threadsQuery = query(
          collection(db, 'threads'),
          where('channelId', '==', channelId),
          orderBy('messageCount', 'desc')
        );
      } else {
        threadsQuery = query(
          collection(db, 'threads'),
          where('channelId', '==', channelId),
          orderBy('lastActivity', 'desc')
        );
      }
      
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
  async createThread(thread: Omit<Thread, 'id' | 'createdAt' | 'lastActivity' | 'messageCount' | 'isPinned'>, initialMessage?: string): Promise<Thread> {
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
      
      // 初期メッセージがある場合は追加
      if (initialMessage) {
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
  }
};

// メッセージ関連のサービス
export const messageService = {
  // スレッド内のメッセージ一覧を取得
  async getMessagesByThread(threadId: string): Promise<Message[]> {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('threadId', '==', threadId),
        orderBy('timestamp', 'asc')
      );
      
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
  
  // リアクションを追加/削除
  async toggleReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const message = messageDoc.data();
        const reactions = message.reactions || [];
        
        // 既存のリアクションを探す
        const existingReactionIndex = reactions.findIndex((r: Reaction) => r.emoji === emoji);
        
        if (existingReactionIndex >= 0) {
          const reaction = reactions[existingReactionIndex];
          const userIndex = reaction.users.indexOf(userId);
          
          if (userIndex >= 0) {
            // ユーザーが既にリアクションしている場合は削除
            reaction.users.splice(userIndex, 1);
            reaction.count--;
            
            // リアクションのユーザーがいなくなった場合はリアクション自体を削除
            if (reaction.count === 0) {
              reactions.splice(existingReactionIndex, 1);
            }
          } else {
            // ユーザーがまだリアクションしていない場合は追加
            reaction.users.push(userId);
            reaction.count++;
          }
        } else {
          // 新しいリアクションを追加
          reactions.push({
            emoji,
            count: 1,
            users: [userId]
          });
        }
        
        // メッセージを更新
        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error('リアクション更新エラー:', error);
      throw error;
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
