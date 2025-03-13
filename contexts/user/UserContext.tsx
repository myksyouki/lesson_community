import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types';

// ユーザー状態の型定義
interface UserState {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  bio?: string;
  instruments?: string[];
  selectedCategories?: string[];
  createdAt?: string;
  isLoggedIn: boolean;
}

// コンテキストの型定義
interface UserContextType {
  userState: UserState | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>;
  updateProfile: (profileData: Partial<UserState>) => Promise<boolean>;
  updateSelectedCategories: (categories: string[]) => Promise<boolean>;
}

// コンテキストの作成
const UserContext = createContext<UserContextType | undefined>(undefined);

// サンプルユーザーデータ
const SAMPLE_USER: UserState = {
  id: 'user123',
  name: '山田太郎',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  email: 'yamada@example.com',
  bio: '音楽が大好きです。フルートを5年間演奏しています。',
  instruments: ['flute', 'piano'],
  selectedCategories: ['flute'],
  createdAt: '2023-01-15T10:30:00Z',
  isLoggedIn: true,
};

// プロバイダーコンポーネント
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userState, setUserState] = useState<UserState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初期化時にユーザー情報を取得
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUserState(JSON.parse(userData));
        } else {
          // 開発用のサンプルデータ
          setUserState(SAMPLE_USER);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // ログイン処理
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 実際の実装では、APIを呼び出して認証する
      // ここではモックとして、常に成功するようにする
      await new Promise(resolve => setTimeout(resolve, 1000)); // 遅延をシミュレート
      
      // サンプルユーザーデータを設定
      setUserState(SAMPLE_USER);
      
      // ユーザーデータをローカルストレージに保存
      await AsyncStorage.setItem('user', JSON.stringify(SAMPLE_USER));
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト処理
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // ユーザーデータをクリア
      setUserState(null);
      
      // ローカルストレージからユーザーデータを削除
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザー登録処理
  const register = async (userData: { name: string; email: string; password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 実際の実装では、APIを呼び出してユーザーを登録する
      // ここではモックとして、常に成功するようにする
      await new Promise(resolve => setTimeout(resolve, 1000)); // 遅延をシミュレート
      
      // 新しいユーザーデータを作成
      const newUser: UserState = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        avatar: 'https://randomuser.me/api/portraits/lego/1.jpg', // デフォルトアバター
        instruments: [],
        selectedCategories: [],
        createdAt: new Date().toISOString(),
        isLoggedIn: true,
      };
      
      // ユーザーデータを設定
      setUserState(newUser);
      
      // ユーザーデータをローカルストレージに保存
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // プロフィール更新処理
  const updateProfile = async (profileData: Partial<UserState>): Promise<boolean> => {
    try {
      if (!userState) return false;
      
      setIsLoading(true);
      
      // 実際の実装では、APIを呼び出してプロフィールを更新する
      // ここではモックとして、常に成功するようにする
      await new Promise(resolve => setTimeout(resolve, 500)); // 遅延をシミュレート
      
      // ユーザーデータを更新
      const updatedUser = { ...userState, ...profileData };
      setUserState(updatedUser);
      
      // ユーザーデータをローカルストレージに保存
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 選択カテゴリー更新処理
  const updateSelectedCategories = async (categories: string[]): Promise<boolean> => {
    return updateProfile({ selectedCategories: categories });
  };

  return (
    <UserContext.Provider value={{
      userState,
      isLoading,
      login,
      logout,
      register,
      updateProfile,
      updateSelectedCategories,
    }}>
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