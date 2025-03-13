import React, { ReactNode } from 'react';
import { ChannelProvider, useChannels } from './ChannelContext';
import { ThreadProvider, useThreads } from './ThreadContext';

// 複数のプロバイダーを一つにまとめる
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChannelProvider>
      <ThreadProvider>
        {children}
      </ThreadProvider>
    </ChannelProvider>
  );
};

// 便宜上、元のDataContextからエクスポートされていたものを再エクスポート
export { useChannels } from './ChannelContext';
export { useThreads } from './ThreadContext';

// 後方互換性のために、元のuseDataフックも提供
export const useData = () => {
  const channelContext = useChannels();
  const threadContext = useThreads();
  
  return {
    ...channelContext,
    ...threadContext,
  };
}; 