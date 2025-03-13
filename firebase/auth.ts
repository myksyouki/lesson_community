import { useState, useEffect, createContext, useContext } from 'react';
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './config';

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {}
});

// 認証フックの作成
export function useAuth() {
  return useContext(AuthContext);
}

// 仮の認証フックの実装（本来はAuthProviderで提供）
export function setupAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ログイン機能
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    }
  };

  // 新規登録機能
  const register = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error) {
      console.error('登録エラー:', error);
      throw error;
    }
  };

  // ログアウト機能
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  };

  // プロフィール更新機能
  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName, photoURL });
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    updateUserProfile
  };
}
