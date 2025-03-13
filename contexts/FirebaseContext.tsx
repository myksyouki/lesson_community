import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../firebase/models';

// Firebaseコンテキストの型定義
interface FirebaseContextType {
  initialized: boolean;
  isInitialized: boolean; // initializedと同じ値を持つエイリアス
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  updateUserLastLogin: (userId: string) => Promise<void>;
}

// デフォルト値
const defaultContext: FirebaseContextType = {
  initialized: false,
  isInitialized: false,
  user: null,
  loading: true,
  error: null,
  logout: async () => {},
  updateUserLastLogin: async () => {}
};

// コンテキストの作成
const FirebaseContext = createContext<FirebaseContextType>(defaultContext);

// コンテキストを使用するためのフック
export const useFirebase = () => useContext(FirebaseContext);

// プロバイダーコンポーネント
export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FirebaseContextType>({
    ...defaultContext,
    logout: async () => {
      try {
        console.log('ログアウト処理を実行します');
        await signOut(auth);
        console.log('ログアウト成功');
      } catch (error) {
        console.error('ログアウトエラー:', error);
      }
    },
    updateUserLastLogin: async (userId: string) => {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
      } catch (error) {
        console.error('最終ログイン更新エラー:', error);
      }
    }
  });

  useEffect(() => {
    console.log('FirebaseProvider: 初期化処理を開始します');
    
    // Firebaseの初期化状態を確認
    const checkInitialization = async () => {
      try {
        console.log('Firebase認証状態の監視を設定します');
        
        // 認証状態の監視を設定
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('認証状態が変更されました:', firebaseUser ? `ユーザーID: ${firebaseUser.uid}` : '未ログイン');
          
          if (firebaseUser) {
            try {
              // 最終ログイン時間を更新
              await state.updateUserLastLogin(firebaseUser.uid);
              console.log('最終ログイン時間を更新しました');
              
              // Firestoreからユーザー情報を取得
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              
              if (userDoc.exists()) {
                // ユーザー情報が存在する場合
                console.log('ユーザー情報が見つかりました');
                setState(prev => ({
                  ...prev,
                  initialized: true,
                  isInitialized: true,
                  user: userDoc.data() as User,
                  loading: false,
                  error: null
                }));
              } else {
                // ユーザー情報が存在しない場合（認証はされているがFirestoreにデータがない）
                console.log('ユーザー情報が見つかりません。新規作成します');
                const newUser = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || '',
                  email: firebaseUser.email || '',
                  createdAt: new Date(),
                  lastLogin: new Date()
                };
                
                // 新しいユーザーをFirestoreに保存
                await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
                console.log('新しいユーザー情報を保存しました');
                
                setState(prev => ({
                  ...prev,
                  initialized: true,
                  isInitialized: true,
                  user: newUser,
                  loading: false,
                  error: null
                }));
              }
            } catch (error) {
              // ユーザー情報取得エラー
              console.error('ユーザー情報取得エラー:', error);
              setState(prev => ({
                ...prev,
                initialized: true,
                isInitialized: true,
                user: null,
                loading: false,
                error: `ユーザー情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
              }));
            }
          } else {
            // 未ログイン状態
            console.log('未ログイン状態です');
            setState(prev => ({
              ...prev,
              initialized: true,
              isInitialized: true,
              user: null,
              loading: false,
              error: null
            }));
          }
        });
        
        // クリーンアップ関数
        return () => {
          console.log('Firebase認証状態の監視を解除します');
          unsubscribe();
        };
      } catch (error) {
        // Firebase初期化エラー
        console.error('Firebase初期化エラー:', error);
        setState(prev => ({
          ...prev,
          initialized: false,
          isInitialized: false,
          user: null,
          loading: false,
          error: `Firebaseの初期化に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        }));
      }
    };
    
    checkInitialization();
  }, []);

  console.log('FirebaseProvider: 現在の状態', {
    initialized: state.initialized,
    isLoggedIn: !!state.user,
    loading: state.loading,
    error: state.error
  });

  return (
    <FirebaseContext.Provider value={state}>
      {children}
    </FirebaseContext.Provider>
  );
}; 