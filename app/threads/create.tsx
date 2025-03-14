import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Alert, PanResponder } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Chip, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import { useUser } from '../../contexts/UserContext';
import { useSideMenu } from '../../contexts/SideMenuContext';
import { db, auth, storage } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  getDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// スレッドのタグ
const THREAD_TAGS = [
  '質問', '議論', '情報共有', 'レビュー', '作品紹介', 
  '初心者向け', '中級者向け', '上級者向け', 'イベント', 'その他'
];

export default function CreateThreadScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const channelId = params.channelId as string;
  const { userState } = useUser();
  const { openMenu } = useSideMenu();
  
  // チャンネル情報
  const [channelInfo, setChannelInfo] = useState<{id: string; name: string; category: string} | null>(null);
  
  // フォームの状態
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  
  // UI状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
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
          handleBack();
        }
      },
    })
  ).current;
  
  // チャンネル情報の取得
  useEffect(() => {
    const fetchChannelInfo = async () => {
      if (!channelId) {
        setChannelError('チャンネルIDが指定されていません');
        setIsLoadingChannel(false);
        return;
      }
      
      try {
        const channelRef = doc(db, 'channels', channelId as string);
        const channelSnap = await getDoc(channelRef);
        
        if (!channelSnap.exists()) {
          setChannelError('チャンネルが見つかりません');
          setIsLoadingChannel(false);
          return;
        }
        
        const data = channelSnap.data();
        const channelData = {
          id: channelId as string,
          name: data.name,
          category: data.category
        };
        
        setChannelInfo(channelData);
        
        // チャンネルのカテゴリーがユーザーの選択したカテゴリーと一致するか確認
        if (!userState.selectedCategories.includes(data.category)) {
          setCategoryError(`このチャンネルはあなたが選択していないカテゴリー「${data.category}」に属しています。選択したカテゴリー「${userState.selectedCategories.join(', ')}」のチャンネルにのみスレッドを作成できます。`);
        } else {
          setCategoryError(null);
        }
      } catch (error) {
        console.error('チャンネル情報取得エラー:', error);
        setChannelError('チャンネル情報の取得に失敗しました');
      } finally {
        setIsLoadingChannel(false);
      }
    };
    
    fetchChannelInfo();
  }, [channelId, userState.selectedCategories]);
  
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
  
  // 画像の削除
  const removeImage = () => {
    setImage(null);
  };
  
  // 画像をFirebase Storageにアップロード
  const uploadImage = async (imageUri: string): Promise<string> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ユーザーがログインしていません');
      }
      
      // 画像のファイル名を生成
      const fileName = `threads/${channelId}/${Date.now()}_${currentUser.uid}.jpg`;
      const storageRef = ref(storage, fileName);
      
      // 画像をBlobに変換
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Storageにアップロード
      await uploadBytes(storageRef, blob);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      throw error;
    }
  };
  
  // タグ選択
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        // 最大3つまで選択可能
        if (prev.length >= 3) {
          Alert.alert('タグ選択', 'タグは最大3つまで選択できます');
          return prev;
        }
        return [...prev, tag];
      }
    });
  };
  
  // バリデーション
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (categoryError) {
      newErrors.category = categoryError;
    }
    
    if (!title.trim()) {
      newErrors.title = 'タイトルを入力してください';
    } else if (title.length < 5) {
      newErrors.title = 'タイトルは5文字以上で入力してください';
    }
    
    if (!content.trim()) {
      newErrors.content = '本文を入力してください';
    } else if (content.length < 10) {
      newErrors.content = '本文は10文字以上で入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // スレッド作成処理
  const handleCreateThread = async () => {
    if (!validateForm()) return;
    
    // カテゴリーエラーがある場合は作成できない
    if (categoryError) {
      Alert.alert('エラー', categoryError);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ユーザーがログインしていません');
      }
      
      // 画像がある場合はアップロード
      let imageUrl = '';
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // スレッドデータを作成
      const threadData = {
        title: title.trim(),
        content: content.trim(),
        channelId: channelId as string,
        authorId: currentUser.uid,
        authorName: userState?.username || currentUser.displayName || 'Anonymous',
        authorAvatar: userState?.avatarUrl || currentUser.photoURL || '',
        tags: selectedTags,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        commentCount: 0,
        likeCount: 0,
      };
      
      // Firestoreにスレッドデータを追加
      const docRef = await addDoc(collection(db, 'threads'), threadData);
      const threadId = docRef.id;
      
      // チャンネルのスレッド数を更新
      const channelRef = doc(db, 'channels', channelId as string);
      await updateDoc(channelRef, {
        threadCount: increment(1),
        lastActivity: serverTimestamp()
      });
      
      // 成功メッセージ
      Alert.alert(
        'スレッド作成完了',
        'スレッドが正常に作成されました',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace(`/threads/${channelId}/${threadId}`)
          }
        ]
      );
    } catch (error) {
      console.error('スレッド作成エラー:', error);
      Alert.alert(
        'エラー',
        'スレッドの作成に失敗しました。もう一度お試しください。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // チャンネルが見つからない場合のエラー表示
  if (channelError) {
    return (
      <MusicGradientBackground theme="default" opacity={0.97}>
        <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
          <StatusBar style="light" />
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#fff" />
            <Text style={styles.errorTitle}>{channelError}</Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => router.push('/channels')}
            >
              <Text style={styles.errorButtonText}>チャンネル一覧へ戻る</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </MusicGradientBackground>
    );
  }

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
          <Text style={styles.headerTitle}>スレッド作成</Text>
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
        
        {/* チャンネル情報 */}
        {isLoadingChannel ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>チャンネル情報を読み込み中...</Text>
          </View>
        ) : channelInfo && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView style={styles.formContainer}>
              <View style={styles.channelInfoContainer}>
                <Text style={styles.channelInfoLabel}>投稿先:</Text>
                <Text style={styles.channelInfoName}>{channelInfo.name}</Text>
                {/* カテゴリーバッジを追加 */}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{channelInfo.category}</Text>
                </View>
              </View>
              
              {/* カテゴリーエラー警告 */}
              {categoryError && (
                <View style={styles.categoryErrorContainer}>
                  <Ionicons name="warning-outline" size={20} color="#FFD700" />
                  <Text style={styles.categoryErrorText}>{categoryError}</Text>
                </View>
              )}
              
              {/* タイトル入力 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>タイトル *</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                  }}
                  placeholder="スレッドのタイトルを入力"
                  placeholderTextColor="#aaa"
                  maxLength={100}
                  editable={!categoryError}
                />
                {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
                <Text style={styles.characterCount}>{title.length}/100</Text>
              </View>
              
              {/* 本文入力 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>本文 *</Text>
                <TextInput
                  style={[styles.input, styles.textArea, errors.content && styles.inputError]}
                  value={content}
                  onChangeText={(text) => {
                    setContent(text);
                    if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
                  }}
                  placeholder="スレッドの本文を入力"
                  placeholderTextColor="#aaa"
                  multiline
                  numberOfLines={10}
                  maxLength={5000}
                  editable={!categoryError}
                />
                {errors.content ? <Text style={styles.errorText}>{errors.content}</Text> : null}
                <Text style={styles.characterCount}>{content.length}/5000</Text>
              </View>
              
              {/* 画像添付 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>画像 (オプション)</Text>
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
                    <Text style={styles.imagePickerText}>画像を追加</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* タグ選択 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>タグ (最大3つまで)</Text>
                <View style={styles.tagsContainer}>
                  {THREAD_TAGS.map((tag) => (
                    <Chip
                      key={tag}
                      selected={selectedTags.includes(tag)}
                      onPress={() => handleTagToggle(tag)}
                      style={[
                        styles.tagChip,
                        selectedTags.includes(tag) && styles.selectedTagChip,
                      ]}
                      textStyle={[
                        styles.tagChipText,
                        selectedTags.includes(tag) && styles.selectedTagChipText,
                      ]}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
                
                {selectedTags.length > 0 && (
                  <View style={styles.selectedTagsContainer}>
                    <Text style={styles.selectedTagsTitle}>選択したタグ：</Text>
                    <View style={styles.selectedTagsList}>
                      {selectedTags.map((tag) => (
                        <Chip
                          key={tag}
                          onClose={() => handleTagToggle(tag)}
                          style={styles.selectedTagDisplay}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              
              {/* 送信ボタン */}
              <TouchableOpacity 
                style={[
                  styles.createButton, 
                  (isSubmitting || categoryError) && styles.disabledButton
                ]}
                onPress={handleCreateThread}
                disabled={isSubmitting || categoryError !== null}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>スレッドを作成</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  channelInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  channelInfoLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 8,
  },
  channelInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    height: 200,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF4D4D',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tagChip: {
    margin: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagChipText: {
    color: '#FFFFFF',
  },
  selectedTagChip: {
    backgroundColor: '#6200ee',
  },
  selectedTagChipText: {
    color: '#FFFFFF',
  },
  selectedTagsContainer: {
    marginTop: 16,
  },
  selectedTagsTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  selectedTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedTagDisplay: {
    backgroundColor: 'rgba(98, 0, 238, 0.3)',
    marginRight: 8,
    marginBottom: 8,
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
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 4,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 24,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  categoryBadge: {
    backgroundColor: 'rgba(98, 0, 238, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  categoryErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  categoryErrorText: {
    color: '#FFD700',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF4D4D',
  },
}); 