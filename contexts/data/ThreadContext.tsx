import React, { createContext, useContext, ReactNode } from 'react';
import { Thread } from '../../types';
import { useChannels } from './ChannelContext';

// コンテキストの型定義
interface ThreadContextType {
  getThread: (channelId: string, threadId: string) => Thread | undefined;
  toggleLike: (channelId: string, threadId: string) => void;
  createThread: (channelId: string, threadData: { 
    title: string; 
    content: string; 
    author: { 
      id: string; 
      name: string; 
      avatar: string; 
    } 
  }) => Promise<void>;
}

// コンテキストの作成
const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const ThreadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { channels, getChannel } = useChannels();

  // スレッドを取得
  const getThread = (channelId: string, threadId: string): Thread | undefined => {
    const channel = getChannel(channelId);
    if (!channel) return undefined;
    
    return channel.threads.find(thread => thread.id === threadId);
  };

  // いいねをトグル
  const toggleLike = (channelId: string, threadId: string): void => {
    const thread = getThread(channelId, threadId);
    if (!thread) return;
    
    // 実際の実装では、APIを呼び出してデータベースを更新する
    // ここではモックとして、コンソールにログを出力するだけ
    console.log(`Toggle like for thread ${threadId} in channel ${channelId}`);
    console.log(`Current like status: ${thread.isLiked}, likes count: ${thread.likes}`);
    
    // 実際の更新ロジックはここに実装
    // 例: thread.isLiked = !thread.isLiked;
    // thread.likes = thread.isLiked ? thread.likes + 1 : thread.likes - 1;
  };

  // スレッドを作成
  const createThread = async (
    channelId: string, 
    threadData: { 
      title: string; 
      content: string; 
      author: { 
        id: string; 
        name: string; 
        avatar: string; 
      } 
    }
  ): Promise<void> => {
    // 実際の実装では、APIを呼び出してデータベースを更新する
    // ここではモックとして、コンソールにログを出力するだけ
    console.log(`Create thread in channel ${channelId}`);
    console.log('Thread data:', threadData);
    
    // 実際の作成ロジックはここに実装
    // 例: const newThread = { ...threadData, id: `thread-${Date.now()}`, createdAt: new Date().toISOString(), likes: 0, replies: 0, isLiked: false };
    // channels.find(c => c.id === channelId)?.threads.push(newThread);
  };

  return (
    <ThreadContext.Provider value={{
      getThread,
      toggleLike,
      createThread,
    }}>
      {children}
    </ThreadContext.Provider>
  );
};

// カスタムフック
export const useThreads = (): ThreadContextType => {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error('useThreads must be used within a ThreadProvider');
  }
  return context;
}; 