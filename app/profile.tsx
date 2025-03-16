import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, IconButton, Card, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../contexts/UserContext';
import MusicGradientBackground from '../components/MusicGradientBackground';

/**
 * プロフィールページのリダイレクト
 * 
 * このページは新しいプロフィールページを表示します
 */
export default function ProfileRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // 古いリダイレクト先は削除されたため、このページ自体をプロフィールページとして使用
  }, []);
  
  return <ProfileScreen />;
}

export function ProfileScreen() {
  const router = useRouter();
  const { userState, getCategoryThemeColor } = useUser();
  const themeColor = getCategoryThemeColor();
  
  // 選択されている楽器を取得
  const selectedInstrument = userState.selectedCategories[0] || 'flute';
  
  // 楽器名のマッピング
  const instrumentNames: { [key: string]: string } = {
    flute: 'フルート',
    clarinet: 'クラリネット',
    oboe: 'オーボエ',
    fagotto: 'ファゴット',
    saxophone: 'サクソフォン',
    horn: 'ホルン',
    euphonium: 'ユーフォニアム',
    trumpet: 'トランペット',
    trombone: 'トロンボーン',
    tuba: 'チューバ',
    percussion: 'パーカッション',
  };
  
  // プロフィール編集画面へ遷移
  const handleEditProfile = () => {
    router.push('/profile-edit');
  };
  
  // 楽器選択画面へ遷移
  const handleChangeInstrument = () => {
    router.push('/instrument-selector');
  };
  
  // ホーム画面へ戻る
  const handleBackToHome = () => {
    router.push('/');
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
            onPress={handleBackToHome}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>プロフィール</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.scrollView}>
          {/* プロフィールカード */}
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Image
                source={{ uri: userState.avatarUrl || 'https://via.placeholder.com/100' }}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.username}>{userState.username}</Text>
                <View style={styles.instrumentBadge}>
                  <Ionicons name="musical-notes" size={14} color={themeColor} />
                  <Text style={[styles.instrumentText, { color: themeColor }]}>
                    {instrumentNames[selectedInstrument] || selectedInstrument}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.bio}>{userState.bio}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>投稿</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>フォロワー</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>フォロー中</Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                style={[styles.button, { backgroundColor: themeColor }]}
                onPress={handleEditProfile}
              >
                プロフィールを編集
              </Button>
              
              <Button
                mode="outlined"
                style={styles.button}
                textColor={themeColor}
                onPress={handleChangeInstrument}
              >
                楽器を切り替える
              </Button>
            </View>
          </Card>
          
          {/* アクティビティセクション */}
          <Card style={styles.activityCard}>
            <Card.Title title="最近のアクティビティ" titleStyle={styles.sectionTitle} />
            <Card.Content>
              <View style={styles.emptyActivity}>
                <Ionicons name="musical-notes" size={40} color="#555555" />
                <Text style={styles.emptyText}>まだアクティビティがありません</Text>
              </View>
            </Card.Content>
          </Card>
          
          {/* HOMEに戻るボタン */}
          <Button
            mode="contained"
            style={[styles.homeButton, { backgroundColor: themeColor }]}
            onPress={handleBackToHome}
          >
            HOMEに戻る
          </Button>
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
  profileCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  instrumentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  instrumentText: {
    fontSize: 12,
    marginLeft: 4,
  },
  bio: {
    fontSize: 14,
    color: '#DDDDDD',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  activityCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#777777',
    marginTop: 8,
  },
  homeButton: {
    marginVertical: 16,
  },
}); 