import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { firebaseTestService } from '../firebase/services';

const FirebaseConnectionTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [config, setConfig] = useState<{ projectId?: string; authDomain?: string } | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const testResult = await firebaseTestService.testConnection();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        message: `テスト実行中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const showConfig = () => {
    setConfig(firebaseTestService.getFirebaseConfig());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase接続テスト</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="接続テスト実行" 
          onPress={testConnection} 
          disabled={loading} 
        />
        
        <Button 
          title="設定情報を表示" 
          onPress={showConfig} 
          disabled={loading} 
        />
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>テスト実行中...</Text>
        </View>
      )}
      
      {result && (
        <View style={[
          styles.resultContainer, 
          result.success ? styles.successContainer : styles.errorContainer
        ]}>
          <Text style={styles.resultTitle}>
            {result.success ? '成功' : 'エラー'}
          </Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
        </View>
      )}
      
      {config && (
        <View style={styles.configContainer}>
          <Text style={styles.configTitle}>Firebase設定情報:</Text>
          <Text style={styles.configItem}>プロジェクトID: {config.projectId || '未設定'}</Text>
          <Text style={styles.configItem}>認証ドメイン: {config.authDomain || '未設定'}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  resultContainer: {
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  successContainer: {
    backgroundColor: '#e6f7e6',
    borderColor: '#28a745',
    borderWidth: 1,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
  },
  configContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e6f0ff',
    borderRadius: 6,
  },
  configTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  configItem: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default FirebaseConnectionTest; 