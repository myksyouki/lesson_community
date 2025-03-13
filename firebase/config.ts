import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebaseの設定
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Firebaseアプリの初期化（既に初期化されている場合は既存のアプリを取得）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase認証の取得（一時的にAsyncStorageを使わない方法に戻す）
const auth = getAuth(app);

// Firestoreデータベースの取得
const db = getFirestore(app);

// Firebase Storageの取得
const storage = getStorage(app);

export { app, auth, db, storage };
