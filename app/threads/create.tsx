import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';

// 楽器カテゴリーのデータ
const INSTRUMENT_CATEGORIES = [
  { id: 'flute', name: 'フルート', icon: 'musical-notes', color: '#7F3DFF' },
  { id: 'clarinet', name: 'クラリネット', icon: 'musical-notes', color: '#FF3D77' },
  { id: 'oboe', name: 'オーボエ', icon: 'musical-notes', color: '#3D7FFF' },
  { id: 'fagotto', name: 'ファゴット', icon: 'musical-notes', color: '#FF9F3D' },
  { id: 'saxophone', name: 'サクソフォン', icon: 'musical-notes', color: '#3DFFCF' },
  { id: 'horn', name: 'ホルン', icon: 'musical-notes', color: '#FF3D3D' },
  { id: 'euphonium', name: 'ユーフォニアム', icon: 'musical-notes', color: '#B03DFF' },
  { id: 'trumpet', name: 'トランペット', icon: 'musical-notes', color: '#FFD93D' },
  { id: 'trombone', name: 'トロンボーン', icon: 'musical-notes', color: '#3DFFB0' },
  { id: 'tuba', name: 'チューバ', icon: 'musical-notes', color: '#FF6B3D' },
  { id: 'percussion', name: 'パーカッション', icon: 'musical-notes', color: '#3DB0FF' },
];

export default function CreateThreadScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams();
  const { userState } = useUser();
  const { getChannel, createThread } = useData();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // チャンネル情報
  const channel = getChannel(channelId as string);
  
  // 現在の楽器カテゴリー情報
  const currentInstrument = INSTRUMENT_CATEGORIES.find(cat => cat.id === channel?.category);
  
  // スレッド作成処理
  const handleCreateThread = async () => {
    if (!title.trim() || !content.trim() || !channel) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createThread(channel.id, {
        title: title.trim(),
        content: content.trim(),
        author: {
          id: 'current-user',
          name: userState.username,
          avatar: userState.avatarUrl,
        },
      });
      
      // 成功したら前の画面に戻る
      router.back();
    } catch (error) {
      console.error('スレッド作成エラー:', error);
      // エラー処理（実際のアプリではエラーメッセージを表示する）
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!channel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>チャンネルが見つかりません</Text>
          <Button mode="contained" onPress={() => router.back()}>
            戻る
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          iconColor="#FFFFFF"
          onPress={() => router.back()}
          style={styles.closeButton}
        />
        
        <Text style={styles.headerTitle}>新規スレッド作成</Text>
        
        <Button 
          mode="contained" 
          onPress={handleCreateThread}
          loading={isSubmitting}
          disabled={!title.trim() || !content.trim() || isSubmitting}
          style={[
            styles.postButton, 
            { backgroundColor: currentInstrument?.color || '#7F3DFF' }
          ]}
        >
          投稿
        </Button>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.channelInfo}>
            <Text style={styles.channelInfoText}>
              投稿先: <Text style={styles.channelName}>{channel.name}</Text>
            </Text>
          </View>
          
          <TextInput
            style={styles.titleInput}
            placeholder="タイトル"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            outlineColor="#2A2A2A"
            activeOutlineColor={currentInstrument?.color || '#7F3DFF'}
            theme={{ colors: { text: '#FFFFFF', background: '#1E1E1E' } }}
          />
          
          <TextInput
            style={styles.contentInput}
            placeholder="内容を入力してください..."
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            mode="outlined"
            outlineColor="#2A2A2A"
            activeOutlineColor={currentInstrument?.color || '#7F3DFF'}
            theme={{ colors: { text: '#FFFFFF', background: '#1E1E1E' } }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  closeButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postButton: {
    borderRadius: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  channelInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  channelInfoText: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  channelName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  titleInput: {
    backgroundColor: '#1E1E1E',
    marginBottom: 16,
    fontSize: 16,
  },
  contentInput: {
    backgroundColor: '#1E1E1E',
    marginBottom: 16,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
  },
}); 