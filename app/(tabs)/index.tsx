/**
 * 【開発用テストページ】
 * このファイルは Firebase 接続テスト用の開発用ページであり、本番環境では使用しません。
 * 本番環境のホーム画面は app/(drawer)/index.tsx にあります。
 * 
 * このページは技術検証やデバッグのみを目的としています。
 */
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Platform, View, Text, ScrollView, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firebaseTestService } from '@/firebase/services';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, addDoc, deleteDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

function HomeScreen() {
  const [connectionStatus, setConnectionStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const { user, isInitialized } = useFirebase();

  // 直接Firestoreにアクセスする接続テスト関数
  const testFirestoreConnection = async () => {
    try {
      console.log('Firebase接続テスト実行中...');
      setConnectionStatus(null);
      
      // connectionTestコレクションにテストドキュメントを作成
      const testData = {
        timestamp: new Date(),
        message: 'Connection test',
        userId: user?.id || 'anonymous'
      };
      
      // connectionTestコレクションにドキュメントを追加
      const docRef = await addDoc(collection(db, 'connectionTest'), testData);
      console.log('テストドキュメント作成成功:', docRef.id);
      
      // 作成したドキュメントを削除（クリーンアップ）
      await deleteDoc(docRef);
      console.log('テストドキュメント削除成功');
      
      setConnectionStatus({
        success: true,
        message: 'Firebaseへの接続に成功しました。データの読み書きが正常に行えます。'
      });
    } catch (error) {
      console.error('Firebase接続テストエラー:', error);
      setConnectionStatus({
        success: false,
        message: `Firebaseへの接続に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  useEffect(() => {
    // コンポーネントのマウント時にFirebase接続テストを実行
    testFirestoreConnection();
  }, []);

  // 接続テストを再実行する関数
  const retryConnection = () => {
    testFirestoreConnection();
  };

  // Firebase接続テスト用のコンポーネント
  const FirebaseConnectionTest = () => (
    <View style={styles.connectionContainer}>
      <Text style={styles.connectionTitle}>Firebase接続テスト</Text>
      <View style={[
        styles.connectionStatus,
        connectionStatus?.success ? styles.successContainer : 
        connectionStatus === null ? styles.loadingContainer : styles.errorContainer
      ]}>
        {connectionStatus ? (
          <>
            <Text style={[
              styles.statusText,
              connectionStatus.success ? styles.successText : styles.errorText
            ]}>
              {connectionStatus.success ? '接続成功 ✅' : '接続エラー ❌'}
            </Text>
            <Text style={styles.messageText}>{connectionStatus.message}</Text>
            {connectionStatus.success && (
              <Text style={styles.infoText}>
                Firebaseとの接続に成功しました。バックエンドサービスが正常に動作しています。
              </Text>
            )}
            <TouchableOpacity style={styles.retryButton} onPress={retryConnection}>
              <Text style={styles.retryButtonText}>接続テストを再実行</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.loadingText}>接続テスト中...</Text>
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>
                Firebase初期化状態: {isInitialized ? '完了 ✅' : '初期化中... ⏳'}
              </Text>
              {user && (
                <Text style={styles.userInfoText}>
                  ログインユーザー: {user.name || user.email || user.id}
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Firebase接続テスト */}
      <FirebaseConnectionTest />
      
      {/* メインコンテンツ */}
      <ThemedView style={styles.mainContent}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome!</ThemedText>
          <HelloWave />
        </ThemedView>
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Step 1: Try it</ThemedText>
          <ThemedText>
            Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
            Press{' '}
            <ThemedText type="defaultSemiBold">
              {Platform.select({
                ios: 'cmd + d',
                android: 'cmd + m',
                web: 'F12'
              })}
            </ThemedText>{' '}
            to open the developer menu.
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          <ThemedText>
            Tap the Explore tab to learn more about what's included in this starter app.
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
          <ThemedText>
            When you're ready, run{' '}
            <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
            <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
            <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
            <ThemedText type="defaultSemiBold">app-example</ThemedText>.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  connectionContainer: {
    margin: 16,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  connectionStatus: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  successContainer: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  errorContainer: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  loadingContainer: {
    borderColor: '#6c757d',
    backgroundColor: '#f8f9fa',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    color: '#28a745',
  },
  errorText: {
    color: '#dc3545',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#0066cc',
    marginTop: 8,
    backgroundColor: '#e6f2ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});
