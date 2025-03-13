import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, storage } from '../firebase/config';
import { userService } from '../firebase/services';
import { User as AppUser } from '../firebase/models';
import { useUser } from './UserContext';

// Firebaseの状態の型定義
interface FirebaseState {
  initialized: boolean;
  loading: boolean;
  isLoggedIn: boolean;
  user: AppUser | null;
  error: Error | null;
}

// コンテキストの型定義
interface FirebaseContextType {
  initialized: boolean;
  loading: boolean;
  isLoggedIn: boolean;
  user: AppUser | null;
  error: Error | null;
  isInitialized: boolean;
}

// コンテキストの作成
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Firebaseプロバイダーコンポーネント
export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FirebaseState>({
    initialized: false,
    loading: true,
    isLoggedIn: false,
    user: null,
    error: null,
  });
  
  const { setSelectedCategories } = useUser();
  // 既にリスナーが設定されているかを追跡するためのref
  const listenerSetRef = useRef(false);

  // Firebase初期化とユーザー認証状態の監視
  useEffect(() => {
    // 既にリスナーが設定されている場合は何もしない
    if (listenerSetRef.current) return;
    
    // リスナーが設定されたことをマーク
    listenerSetRef.current = true;
    
    try {
      // Firebaseの初期化状態を設定
      console.log('[Firebase] 設定確認...');
      setState(prev => ({ ...prev, initialized: true }));
      
      // 認証状態の変更を監視
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        console.log('[Firebase] 認証状態変更:', firebaseUser?.uid || 'ログアウト状態');
        
        if (firebaseUser) {
          try {
            // Firestoreからユーザー情報を取得
            const appUser = await userService.getUserProfile(firebaseUser.uid);
            
            // 楽器情報がある場合はUserContextに設定
            if (appUser && appUser.instruments && appUser.instruments.length > 0) {
              console.log('[Firebase] 楽器情報:', appUser.instruments);
              setSelectedCategories(appUser.instruments);
            }
            
            setState({
              initialized: true,
              loading: false,
              isLoggedIn: true,
              user: appUser,
              error: null,
            });
          } catch (error) {
            console.error('[Firebase] ユーザー情報取得エラー:', error);
            setState({
              initialized: true,
              loading: false,
              isLoggedIn: true,
              user: {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                avatar: firebaseUser.photoURL || undefined,
                createdAt: new Date(),
                lastLogin: new Date(),
              },
              error: null,
            });
          }
        } else {
          setState({
            initialized: true,
            loading: false,
            isLoggedIn: false,
            user: null,
            error: null,
          });
        }
      });

      // クリーンアップ関数
      return () => {
        listenerSetRef.current = false;
        unsubscribe();
      };
    } catch (error) {
      console.error('[Firebase] 設定確認エラー:', error);
      setState({
        initialized: false,
        loading: false,
        isLoggedIn: false,
        user: null,
        error: error as Error,
      });
    }
  }, []); // 依存配列を空にして初回マウント時のみ実行

  // コンテキスト値
  const contextValue: FirebaseContextType = {
    initialized: state.initialized,
    loading: state.loading,
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    error: state.error,
    isInitialized: state.initialized && !state.loading,
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

// カスタムフック
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}; 