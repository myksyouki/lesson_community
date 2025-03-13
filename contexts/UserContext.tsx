import React, { createContext, useState, useContext, ReactNode } from 'react';

// ユーザーの状態の型定義
interface UserState {
  selectedCategories: string[];
  darkMode: boolean;
  notifications: boolean;
  username: string;
  bio: string;
  avatarUrl: string;
  fabEnabled: boolean;
  fabPosition: { bottom: number; right: number };
  // ユーザーが作成したチャンネルのID配列
  createdChannels: string[];
}

// コンテキストの型定義
interface UserContextType {
  userState: UserState;
  setSelectedCategories: (categories: string[]) => void;
  toggleCategory: (categoryId: string) => void;
  setDarkMode: (enabled: boolean) => void;
  setNotifications: (enabled: boolean) => void;
  updateProfile: (data: Partial<UserState>) => void;
  setFabEnabled: (enabled: boolean) => void;
  setFabPosition: (position: { bottom: number; right: number }) => void;
  // チャンネル作成関連の機能
  addCreatedChannel: (channelId: string) => boolean;
  removeCreatedChannel: (channelId: string) => void;
  canCreateChannel: () => boolean;
}

// デフォルト値
const defaultUserState: UserState = {
  selectedCategories: ['flute'],
  darkMode: true,
  notifications: true,
  username: '宮越 優希',
  bio: 'フルート奏者 / 作曲家 / 音楽プロデューサー',
  avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  fabEnabled: true,
  fabPosition: { bottom: 20, right: 20 },
  createdChannels: [],
};

// コンテキストの作成
const UserContext = createContext<UserContextType | undefined>(undefined);

// コンテキストプロバイダーコンポーネント
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userState, setUserState] = useState<UserState>(defaultUserState);

  // カテゴリーの設定
  const setSelectedCategories = (categories: string[]) => {
    setUserState(prev => ({
      ...prev,
      selectedCategories: categories,
    }));
  };

  // カテゴリーの切り替え
  const toggleCategory = (categoryId: string) => {
    setUserState(prev => {
      const currentCategories = [...prev.selectedCategories];
      const index = currentCategories.indexOf(categoryId);
      
      if (index > -1) {
        currentCategories.splice(index, 1);
      } else {
        currentCategories.push(categoryId);
      }
      
      return {
        ...prev,
        selectedCategories: currentCategories,
      };
    });
  };

  // ダークモードの設定
  const setDarkMode = (enabled: boolean) => {
    setUserState(prev => ({
      ...prev,
      darkMode: enabled,
    }));
  };

  // 通知の設定
  const setNotifications = (enabled: boolean) => {
    setUserState(prev => ({
      ...prev,
      notifications: enabled,
    }));
  };

  // FABの表示/非表示設定
  const setFabEnabled = (enabled: boolean) => {
    setUserState(prev => ({
      ...prev,
      fabEnabled: enabled,
    }));
  };

  // FABの位置設定
  const setFabPosition = (position: { bottom: number; right: number }) => {
    setUserState(prev => ({
      ...prev,
      fabPosition: position,
    }));
  };

  // プロフィールの更新
  const updateProfile = (data: Partial<UserState>) => {
    setUserState(prev => ({
      ...prev,
      ...data,
    }));
  };

  // ユーザーが作成したチャンネルを追加（制限チェック付き）
  const addCreatedChannel = (channelId: string): boolean => {
    // 既に3つチャンネルを作成している場合は失敗
    if (userState.createdChannels.length >= 3) {
      return false;
    }
    
    setUserState(prev => ({
      ...prev,
      createdChannels: [...prev.createdChannels, channelId],
    }));
    
    return true;
  };

  // ユーザーが作成したチャンネルを削除
  const removeCreatedChannel = (channelId: string) => {
    setUserState(prev => ({
      ...prev,
      createdChannels: prev.createdChannels.filter(id => id !== channelId),
    }));
  };

  // チャンネルをさらに作成できるかどうかをチェック
  const canCreateChannel = (): boolean => {
    return userState.createdChannels.length < 3;
  };

  return (
    <UserContext.Provider
      value={{
        userState,
        setSelectedCategories,
        toggleCategory,
        setDarkMode,
        setNotifications,
        updateProfile,
        setFabEnabled,
        setFabPosition,
        addCreatedChannel,
        removeCreatedChannel,
        canCreateChannel,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// カスタムフック
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 