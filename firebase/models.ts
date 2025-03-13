// Firebaseで使用するデータモデルの型定義

// ユーザーの型定義
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  instruments?: string[];
  createdAt: Date;
  lastLogin: Date;
}

// チャンネルの型定義
export interface Channel {
  id: string;
  name: string;
  description: string;
  instrument: string;
  icon: string;
  color: string;
  createdAt: Date;
  memberCount: number;
  threadCount: number;
}

// スレッドの型定義
export interface Thread {
  id: string;
  title: string;
  channelId: string;
  instrument: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content?: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  likeCount?: number; // いいね数
  isPinned: boolean;
}

// メッセージの型定義
export interface Message {
  id: string;
  threadId: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  attachments?: Attachment[];
  reactions?: Reaction[];
}

// 添付ファイルの型定義
export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  name: string;
  size: number;
}

// リアクションの型定義
export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // ユーザーIDのリスト
}
