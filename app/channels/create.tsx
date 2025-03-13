import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput, IconButton, Menu } from 'react-native-paper';
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

export default function CreateChannelScreen() {
  const router = useRouter();
  const { userState, addCreatedChannel, canCreateChannel } = useUser();
  const { createChannel } = useData();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(userState.selectedCategories[0] || 'flute');
  const [menuVisible, setMenuVisible] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 選択されているカテゴリー情報
  const currentInstrument = INSTRUMENT_CATEGORIES.find(cat => cat.id === selectedCategory);
  
  // メニューの表示/非表示
  const toggleMenu = () => setMenuVisible(!menuVisible);
  
  // カテゴリー選択
  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setMenuVisible(false);
  };
  
  // チャンネル作成処理
  const handleCreateChannel = async () => {
    // バリデーション
    if (!name.trim()) {
      setError('チャンネル名を入力してください');
      return;
    }
    
    if (!description.trim()) {
      setError('説明文を入力してください');
      return;
    }
    
    // ユーザーがチャンネルを作成できるか確認
    if (!canCreateChannel()) {
      setError('作成できるチャンネルの上限（3つ）に達しています');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // チャンネル作成
      const channelId = await createChannel({
        name: name.trim(),
        description: description.trim(),
        category: selectedCategory,
        creatorId: 'current-user', // 実際のアプリでは認証済みユーザーのIDを使用
      });
      
      // ユーザーの作成したチャンネル一覧に追加
      addCreatedChannel(channelId);
      
      // 作成したチャンネルに移動
      router.push(`/channels/${channelId}`);
    } catch (error) {
      console.error('チャンネル作成エラー:', error);
      setError('チャンネルの作成に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
        
        <Text style={styles.headerTitle}>新規チャンネル作成</Text>
        
        <Button 
          mode="contained" 
          onPress={handleCreateChannel}
          loading={isSubmitting}
          disabled={!name.trim() || !description.trim() || isSubmitting}
          style={[
            styles.createButton, 
            { backgroundColor: currentInstrument?.color || '#7F3DFF' }
          ]}
        >
          作成
        </Button>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.scrollView}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <Text style={styles.label}>チャンネル名 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.nameInput}
            placeholder="例: 初心者質問"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            mode="outlined"
            outlineColor="#2A2A2A"
            activeOutlineColor={currentInstrument?.color || '#7F3DFF'}
            theme={{ colors: { text: '#FFFFFF', background: '#1E1E1E' } }}
          />
          
          <Text style={styles.label}>説明文 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="チャンネルの説明文を入力してください..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            mode="outlined"
            outlineColor="#2A2A2A"
            activeOutlineColor={currentInstrument?.color || '#7F3DFF'}
            theme={{ colors: { text: '#FFFFFF', background: '#1E1E1E' } }}
          />
          
          <Text style={styles.label}>カテゴリー <Text style={styles.required}>*</Text></Text>
          <Menu
            visible={menuVisible}
            onDismiss={toggleMenu}
            anchor={
              <TouchableOpacity
                style={[
                  styles.categorySelector,
                  { borderColor: currentInstrument?.color || '#7F3DFF' }
                ]}
                onPress={toggleMenu}
              >
                <View style={styles.selectedCategory}>
                  <View 
                    style={[
                      styles.categoryIcon, 
                      { backgroundColor: currentInstrument?.color + '30' || '#7F3DFF30' }
                    ]}
                  >
                    <Ionicons 
                      name="musical-notes" 
                      size={18} 
                      color={currentInstrument?.color || '#7F3DFF'} 
                    />
                  </View>
                  <Text style={styles.categoryText}>{currentInstrument?.name || 'フルート'}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            {INSTRUMENT_CATEGORIES.map(category => (
              <Menu.Item
                key={category.id}
                onPress={() => selectCategory(category.id)}
                title={category.name}
                titleStyle={{ color: category.id === selectedCategory ? category.color : '#FFFFFF' }}
                leadingIcon={() => (
                  <Ionicons
                    name="musical-notes"
                    size={18}
                    color={category.color}
                  />
                )}
              />
            ))}
          </Menu>
          
          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>注意：</Text>
            <Text style={styles.noteText}>• 1ユーザーにつき作成できるチャンネルは3つまでです</Text>
            <Text style={styles.noteText}>• 不適切な内容のチャンネルは削除される場合があります</Text>
            <Text style={styles.noteText}>• 作成後もチャンネル名・説明文の編集が可能です</Text>
          </View>
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    marginRight: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#FF5757',
  },
  nameInput: {
    backgroundColor: '#1E1E1E',
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: '#1E1E1E',
    marginBottom: 8,
    height: 120,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  menuContent: {
    backgroundColor: '#1E1E1E',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 87, 87, 0.2)',
    padding: 12,
    borderRadius: 4,
    marginVertical: 12,
  },
  errorText: {
    color: '#FF5757',
    fontSize: 14,
  },
  noteContainer: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7F3DFF',
  },
  noteTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 4,
  },
}); 