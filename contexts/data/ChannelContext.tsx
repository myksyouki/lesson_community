import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Channel } from '../../types';

// サンプルデータ（実際の実装ではFirebaseなどから取得）
import { sampleChannels } from './sampleData';

// コンテキストの型定義
interface ChannelContextType {
  channels: Channel[];
  getChannelsByCategory: (category: string) => Channel[];
  getChannel: (channelId: string) => Channel | undefined;
  createChannel: (channelData: { name: string; description: string; category: string; creatorId: string }) => Promise<string>;
  deleteChannel: (channelId: string) => Promise<boolean>;
  getUserCreatedChannels: (userId: string) => Channel[];
}

// コンテキストの作成
const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const ChannelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [channels, setChannels] = useState<Channel[]>(sampleChannels);

  // カテゴリーでチャンネルをフィルタリング
  const getChannelsByCategory = (category: string): Channel[] => {
    return channels.filter(channel => channel.category === category);
  };

  // IDでチャンネルを取得
  const getChannel = (channelId: string): Channel | undefined => {
    return channels.find(channel => channel.id === channelId);
  };

  // チャンネルを作成
  const createChannel = async (channelData: { 
    name: string; 
    description: string; 
    category: string; 
    creatorId: string 
  }): Promise<string> => {
    const newChannel: Channel = {
      id: `channel-${Date.now()}`,
      name: channelData.name,
      description: channelData.description,
      category: channelData.category,
      members: 1,
      threads: [],
    };
    
    setChannels(prevChannels => [...prevChannels, newChannel]);
    return newChannel.id;
  };

  // チャンネルを削除
  const deleteChannel = async (channelId: string): Promise<boolean> => {
    const channelExists = channels.some(channel => channel.id === channelId);
    
    if (channelExists) {
      setChannels(prevChannels => prevChannels.filter(channel => channel.id !== channelId));
      return true;
    }
    
    return false;
  };

  // ユーザーが作成したチャンネルを取得
  const getUserCreatedChannels = (userId: string): Channel[] => {
    // 実際の実装では、チャンネルにcreatorIdなどのフィールドがあり、それでフィルタリングする
    // ここではサンプルとして、ユーザーIDに基づいてランダムにチャンネルを返す
    return channels.filter((_, index) => index % 3 === 0);
  };

  return (
    <ChannelContext.Provider value={{
      channels,
      getChannelsByCategory,
      getChannel,
      createChannel,
      deleteChannel,
      getUserCreatedChannels,
    }}>
      {children}
    </ChannelContext.Provider>
  );
};

// カスタムフック
export const useChannels = (): ChannelContextType => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannels must be used within a ChannelProvider');
  }
  return context;
}; 