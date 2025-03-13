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
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { db, auth, storage } from './config';
import { User, Channel, Thread, Message, Attachment } from './models';

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
        await updateDoc(doc(db, 'users', userDoc.docs[0].id), {
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
  }
};

// チャンネル関連のサービス
export const channelService = {
  // 楽器カテゴリーに属するチャンネル一覧を取得
  async getChannelsByInstrument(instrument: string): Promise<Channel[]> {
    try {
      const channelsQuery = query(
        collection(db, 'channels'),
        where('instrument', '==', instrument),
        orderBy('name')
      );
      
      const channelDocs = await getDocs(channelsQuery);
      return channelDocs.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          instrument: data.instrument,
          icon: data.icon,
          color: data.color,
          createdAt: (data.createdAt as Timestamp).toDate(),
          memberCount: data.memberCount,
          threadCount: data.threadCount
        } as Channel;
      });
    } catch (error) {
      console.error('チャンネル取得エラー:', error);
      throw error;
    }
  }
};

// スレッド関連のサービス
export const threadService = {
  // チャンネルに属するスレッド一覧を取得
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
      }
      
      const threadDocs = await getDocs(threadsQuery!);
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
  async searchThreads(channelId: string, query: string): Promise<Thread[]> {
    try {
      const threadsQuery = collection(db, 'threads');
      const snapshot = await getDocs(threadsQuery);
      
      // Firestoreにはテキスト検索機能がないため、クライアント側でフィルタリング
      const threads = snapshot.docs
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
          thread.channelId === channelId && 
          (thread.title.toLowerCase().includes(query.toLowerCase()) || 
           thread.authorName.toLowerCase().includes(query.toLowerCase()))
        );
      
      return threads;
    } catch (error) {
      console.error('スレッド検索エラー:', error);
      throw error;
    }
  },
  
  // 新しいスレッドを作成
  async createThread(thread: Omit<Thread, 'id' | 'createdAt' | 'lastActivity'>, initialMessage?: string): Promise<Thread> {
    try {
      const newThread = {
        ...thread,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        messageCount: initialMessage ? 1 : 0,
        isPinned: false
      };
      
      const docRef = await addDoc(collection(db, 'threads'), newThread);
      
      // 最初のメッセージを作成（もし指定されていれば）
      if (initialMessage) {
        const messageData: Omit<Message, 'id' | 'timestamp'> = {
          threadId: docRef.id,
          content: initialMessage,
          userId: thread.authorId,
          userName: thread.authorName,
          attachments: [],
          reactions: []
        };
        
        await this.addMessage(messageData);
      }
      
      // チャンネルのスレッド数を更新
      const channelRef = doc(db, 'channels', thread.channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (channelDoc.exists()) {
        await updateDoc(channelRef, {
          threadCount: (channelDoc.data().threadCount || 0) + 1
        });
      }
      
      return {
        ...newThread,
        id: docRef.id,
        createdAt: new Date(),
        lastActivity: new Date()
      } as Thread;
    } catch (error) {
      console.error('スレッド作成エラー:', error);
      throw error;
    }
  },
  
  // メッセージを追加
  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    return await messageService.addMessage(message);
  }
};

// メッセージ関連のサービス
export const messageService = {
  // スレッドのメッセージ一覧を取得
  async getMessagesByThread(threadId: string): Promise<Message[]> {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('threadId', '==', threadId),
        orderBy('timestamp')
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
  
  // 新しいメッセージを送信
  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    try {
      const newMessage = {
        ...message,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'messages'), newMessage);
      
      // スレッドの最終アクティビティと返信数を更新
      const threadRef = doc(db, 'threads', message.threadId);
      const threadDoc = await getDoc(threadRef);
      
      if (threadDoc.exists()) {
        await updateDoc(threadRef, {
          lastActivity: serverTimestamp(),
          messageCount: (threadDoc.data().messageCount || 0) + 1
        });
      }
      
      return {
        ...newMessage,
        id: docRef.id,
        timestamp: new Date()
      } as Message;
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      throw error;
    }
  },
  
  // メッセージを追加（内部使用）
  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    try {
      const newMessage = {
        ...message,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'messages'), newMessage);
      
      // スレッドの最終更新日時とメッセージ数を更新
      const threadRef = doc(db, 'threads', message.threadId);
      const threadDoc = await getDoc(threadRef);
      
      if (threadDoc.exists()) {
        await updateDoc(threadRef, {
          lastActivity: serverTimestamp(),
          messageCount: (threadDoc.data().messageCount || 0) + 1
        });
      }
      
      return {
        ...newMessage,
        id: docRef.id,
        timestamp: new Date()
      } as Message;
    } catch (error) {
      console.error('メッセージ追加エラー:', error);
      throw error;
    }
  },
  
  // 画像を添付してメッセージを送信
  async sendMessageWithImage(message: Omit<Message, 'id' | 'timestamp'>, imageUri: string, fileName: string): Promise<Message> {
    try {
      // 画像をStorageにアップロード
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `attachments/${message.threadId}/${fileName}`);
      await uploadBytes(storageRef, blob);
      
      const downloadUrl = await getDownloadURL(storageRef);
      
      // 添付ファイル情報を作成
      const attachment: Attachment = {
        id: fileName,
        type: 'image',
        url: downloadUrl,
        name: fileName,
        size: blob.size
      };
      
      // メッセージに添付ファイルを追加して送信
      const messageWithAttachment = {
        ...message,
        attachments: [...(message.attachments || []), attachment]
      };
      
      return await this.sendMessage(messageWithAttachment);
    } catch (error) {
      console.error('画像付きメッセージ送信エラー:', error);
      throw error;
    }
  }
};
