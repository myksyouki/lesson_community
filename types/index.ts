// ユーザー関連の型定義
export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  bio?: string;
  instruments?: string[];
  selectedCategories?: string[];
  createdAt?: string;
}

// スレッド関連の型定義
export interface Thread {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  replies: number;
  isLiked: boolean;
}

// チャンネル関連の型定義
export interface Channel {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  threads: Thread[];
}

// 最近訪れたスレッドの型定義
export interface RecentThread {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
  timestamp: number;
}

// お気に入りスレッドの型定義
export interface FavoriteThread {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
}

// 楽器カテゴリーの型定義
export type InstrumentCategory = 
  | 'flute'
  | 'clarinet'
  | 'oboe'
  | 'fagotto'
  | 'saxophone'
  | 'horn'
  | 'euphonium'
  | 'trumpet'
  | 'trombone'
  | 'tuba'
  | 'percussion'
  | 'default'; 