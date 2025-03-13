import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * プロフィールページのリダイレクト
 * 
 * このページは (drawer) 内のプロフィールページにリダイレクトします
 */
export default function ProfileRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // (drawer)のプロフィールページへリダイレクト
    router.replace('/(drawer)/profile');
  }, []);
  
  // リダイレクト中に表示するものはない
  return null;
} 