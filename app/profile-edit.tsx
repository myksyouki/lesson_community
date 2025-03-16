import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, IconButton, Card, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../contexts/UserContext';
import MusicGradientBackground from '../components/MusicGradientBackground';

// 画面の幅を取得
const { width } = Dimensions.get('window');

export default function ProfileEditScreen() {
  const router = useRouter();
  const { userState, updateProfile, getCategoryThemeColor } = useUser();
  const themeColor = getCategoryThemeColor();
  
  // 編集用の状態
  const [username, setUsername] = useState(userState.username);
  const [bio, setBio] = useState(userState.bio);
  const [avatarUrl, setAvatarUrl] = useState(userState.avatarUrl);
  const [isLoading, setIsLoading] = useState(false);
  
  // 変更を保存
  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // プロフィール情報を更新
      await updateProfile({
        username,
        bio,
        avatarUrl
      });
      
      // 成功メッセージ
      Alert.alert(
        '保存完了',
        'プロフィール情報を更新しました',
        [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      Alert.alert('エラー', 'プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // アバター画像の変更
  const handleChangeAvatar = () => {
    // 現在は開発中のため、サンプル画像をランダムに設定
    const randomId = Math.floor(Math.random() * 100);
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    setAvatarUrl(`https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`);
  };
  
  // キャンセルして戻る
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <MusicGradientBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        
        {/* ヘッダー */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#FFFFFF"
            onPress={handleCancel}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>プロフィール編集</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.scrollView}>
          {/* アバター編集 */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUrl || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={[styles.changeAvatarButton, { backgroundColor: themeColor }]}
              onPress={handleChangeAvatar}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* フォーム */}
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.inputLabel}>ユーザー名</Text>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="ユーザー名を入力"
                placeholderTextColor="#777777"
              />
              
              <Text style={styles.inputLabel}>自己紹介</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="自己紹介を入力"
                placeholderTextColor="#777777"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Card.Content>
          </Card>
          
          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              style={styles.button}
              textColor="#FFFFFF"
              onPress={handleCancel}
            >
              キャンセル
            </Button>
            
            <Button
              mode="contained"
              style={[styles.button, { backgroundColor: themeColor }]}
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading}
            >
              保存する
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </MusicGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: width / 2 - 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderRadius: 12,
    marginBottom: 16,
  },
  inputLabel: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bioInput: {
    height: 120,
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 