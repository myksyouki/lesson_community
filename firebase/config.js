// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebaseの設定情報
// 環境変数から設定値を読み込む
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 設定値の検証（開発環境のみ）
if (__DEV__) {
  // 必須の設定値が設定されているか確認
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Firebase設定エラー: 次の設定値が不足しています: ${missingFields.join(', ')}`);
    console.warn('環境変数が正しく設定されているか確認してください。');
  } else {
    console.log('Firebase設定: すべての必須設定値が設定されています');
  }
}

// Firebaseの初期化
// アプリの初期化ステータスをログ出力
console.log('Firebase初期化開始...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
// 認証の初期化をAsyncStorageを使用して行う
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
console.log('Firebase初期化完了');

// Firebaseサービスのタイムアウト設定
const FIREBASE_TIMEOUT = 30000; // 30秒

// Auth設定
if (auth.settings && __DEV__) {
  auth.settings.appVerificationDisabledForTesting = true; // 開発環境ではテスト用の検証を無効化
}

console.log('Firebase各サービスの初期化完了');

// エクスポート
export { app, db, auth, storage };
