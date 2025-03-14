import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Alert, PanResponder } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Chip, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import { useSideMenu } from '../../contexts/SideMenuContext';
import { useUser } from '../../contexts/UserContext';
import { db, auth, storage } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// チャンネルのカテゴリ
const CHANNEL_CATEGORIES = [
  { id: 'general', name: '一般' },
  { id: 'artist', name: 'アーティスト' },
  { id: 'genre', name: 'ジャンル' },
  { id: 'instrument', name: '楽器' },
  { id: 'theory', name: '音楽理論' },
  { id: 'production', name: '音楽制作' },
  { id: 'concert', name: 'ライブ・コンサート' },
  { id: 'learning', name: '学習' },
  { id: 'other', name: 'その他' },
];

// 楽器カテゴリー（自動的にタイプは導入されている）
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
  const { openMenu } = useSideMenu();
  const { userState } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(userState.selectedCategories[0] || 'flute');
  const [image, setImage] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームが有効かどうかを計算
  const isFormValid = useMemo(() => {
    return name.trim() !== '' && 
           name.length >= 3 && 
           description.trim() !== '' && 
           selectedCategory !== '';
  }, [name, description, selectedCategory]);

  // 戻るボタンの処理
  const handleBack = () => {
    router.back();
  };

  // 右スワイプで戻るための処理を追加
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 右スワイプを検出（x方向の移動が20以上、y方向の移動が20未満）
        return gestureState.dx > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        // 右へのスワイプが50px以上なら前の画面に戻る
        if (gestureState.dx > 50) {
          router.back();
        }
      },
    })
  ).current;

  // 画像の選択
  const pickImage = async () => {
    try {
      // パーミッションの確認
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('権限エラー', '画像ライブラリへのアクセス権限が必要です');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('画像選択エラー:', err);
      Alert.alert('エラー', '画像の選択中にエラーが発生しました');
    }
  };

  // 画像のアップロード
  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ユーザーが認証されていません');
      }
      
      const fileName = `channels/${currentUser.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      throw new Error('画像のアップロードに失敗しました');
    }
  };

  // 画像の削除
  const removeImage = () => {
    setImage(null);
  };

  // バリデーション - この関数はボタンクリック時のみ呼び出す
  const validateForm = () => {
    if (!name.trim()) {
      setError('チャンネル名を入力してください');
      return false;
    }
    
    if (name.length < 3) {
      setError('チャンネル名は3文字以上で入力してください');
      return false;
    }
    
    if (!description.trim()) {
      setError('説明を入力してください');
      return false;
    }
    
    if (!selectedCategory) {
      setError('カテゴリを選択してください');
      return false;
    }
    
    setError(null);
    return true;
  };

  // チャンネル作成処理
  const handleCreateChannel = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ユーザーが認証されていません');
      }
      
      // 画像がある場合はアップロード
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // チャンネルデータの作成
      const channelData = {
        name: name.trim(),
        description: description.trim(),
        category: selectedCategory,
        imageUrl: imageUrl,
        isPrivate: isPrivate,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        creatorName: currentUser.displayName || 'Unknown User',
        creatorAvatar: currentUser.photoURL || null,
        memberCount: 1,
        threadCount: 0,
        members: [currentUser.uid],
        lastActivity: serverTimestamp(),
      };
      
      // Firestoreに保存
      const docRef = await addDoc(collection(db, 'channels'), channelData);
      
      Alert.alert(
        '成功',
        'チャンネルが作成されました',
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/channels/${docRef.id}`),
          },
        ]
      );
    } catch (err) {
      console.error('チャンネル作成エラー:', err);
      setError('チャンネルの作成に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MusicGradientBackground theme="default" opacity={0.98}>
      <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
        <StatusBar style="light" />
        
        {/* ヘッダー */}
        <View style={styles.header}>
          <IconButton
            icon="menu"
            iconColor="#fff"
            size={24}
            onPress={openMenu}
          />
          <Text style={styles.headerTitle}>チャンネル作成</Text>
          <IconButton
            icon="bell-outline"
            iconColor="#fff"
            size={24}
            onPress={() => console.log('通知ボタンが押されました')}
          />
        </View>
        
        {/* 戻るボタン */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView style={styles.formContainer}>
            {/* エラーメッセージ */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {/* チャンネル名 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>チャンネル名 *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="チャンネル名を入力"
                placeholderTextColor="#aaa"
                maxLength={50}
              />
            </View>
            
            {/* チャンネル説明 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>説明 *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="チャンネルの説明を入力"
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>
            
            {/* チャンネルカテゴリ */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>カテゴリ *</Text>
              <View style={styles.categoriesContainer}>
                {INSTRUMENT_CATEGORIES.filter(cat => 
                  userState.selectedCategories.includes(cat.id)
                ).map((category) => (
                  <Chip
                    key={category.id}
                    selected={selectedCategory === category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.selectedCategoryChip,
                    ]}
                    textStyle={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.selectedCategoryChipText,
                    ]}
                  >
                    {category.name}
                  </Chip>
                ))}
              </View>
              <Text style={styles.categoryHelpText}>
                ※ユーザーが選択したカテゴリー「
                {INSTRUMENT_CATEGORIES.find(cat => cat.id === userState.selectedCategories[0])?.name || 'フルート'}
                」のチャンネルのみ作成できます
              </Text>
            </View>
            
            {/* チャンネル画像 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>カバー画像 (オプション)</Text>
              {image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                    <MaterialIcons name="cancel" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="#fff" />
                  <Text style={styles.imagePickerText}>画像を選択</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* プライバシー設定 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>プライバシー</Text>
              <View style={styles.privacyOptionsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.privacyOption,
                    !isPrivate && styles.selectedPrivacyOption,
                  ]}
                  onPress={() => setIsPrivate(false)}
                >
                  <Ionicons 
                    name="globe-outline" 
                    size={24} 
                    color={!isPrivate ? "#6200ee" : "#fff"} 
                  />
                  <View style={styles.privacyOptionTextContainer}>
                    <Text style={[
                      styles.privacyOptionTitle,
                      !isPrivate && styles.selectedPrivacyOptionText,
                    ]}>公開</Text>
                    <Text style={styles.privacyOptionDescription}>
                      誰でも閲覧・参加可能
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.privacyOption,
                    isPrivate && styles.selectedPrivacyOption,
                  ]}
                  onPress={() => setIsPrivate(true)}
                >
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={24} 
                    color={isPrivate ? "#6200ee" : "#fff"} 
                  />
                  <View style={styles.privacyOptionTextContainer}>
                    <Text style={[
                      styles.privacyOptionTitle,
                      isPrivate && styles.selectedPrivacyOptionText,
                    ]}>非公開</Text>
                    <Text style={styles.privacyOptionDescription}>
                      招待されたユーザーのみ参加可能
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* 作成ボタン - 修正箇所 */}
            <TouchableOpacity 
              style={[styles.createButton, (!isFormValid || isLoading) && styles.disabledButton]}
              onPress={handleCreateChannel}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>チャンネルを作成</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </MusicGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryChip: {
    margin: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryChipText: {
    color: '#FFFFFF',
  },
  selectedCategoryChip: {
    backgroundColor: '#6200ee',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  imagePickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 120,
  },
  imagePickerText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    height: 180,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 4,
  },
  privacyOptionsContainer: {
    gap: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
  },
  selectedPrivacyOption: {
    backgroundColor: 'rgba(98, 0, 238, 0.2)',
    borderColor: '#6200ee',
    borderWidth: 1,
  },
  privacyOptionTextContainer: {
    marginLeft: 12,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedPrivacyOptionText: {
    color: '#6200ee',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#BBBBBB',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#6200ee',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    flexDirection: 'row',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: 'rgba(98, 0, 238, 0.5)',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  categoryHelpText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 