import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ActivityIndicator, Dialog, Portal, Button } from 'react-native-paper';
import { useUser } from '../../contexts/UserContext';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import firestore from '@react-native-firebase/firestore';

// タグのデフォルト色配列
const DEFAULT_COLORS = [
  '#7F3DFF',
  '#FF3D77',
  '#3D7FFF',
  '#FF9F3D',
  '#3DFFCF',
  '#FF3D3D',
  '#B03DFF',
  '#FFD93D',
  '#3DFFB0',
  '#FF6B3D',
];

// タグデータ型定義
interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
  createdAt?: any;
  createdBy?: string;
}

// モックデータ
const MOCK_TAGS: Tag[] = [
  { id: 'beginner', name: '初心者', color: '#7F3DFF', count: 12 },
  { id: 'technique', name: 'テクニック', color: '#FF3D77', count: 8 },
  { id: 'repertoire', name: 'レパートリー', color: '#3D7FFF', count: 10 },
  { id: 'gear', name: '機材', color: '#FF9F3D', count: 7 },
  { id: 'practice', name: '練習法', color: '#3DFFCF', count: 9 },
  { id: 'concert', name: '演奏会', color: '#FF3D3D', count: 5 },
  { id: 'ensemble', name: 'アンサンブル', color: '#B03DFF', count: 6 },
  { id: 'recording', name: '録音', color: '#FFD93D', count: 4 },
  { id: 'composition', name: '作曲', color: '#3DFFB0', count: 3 },
  { id: 'theory', name: '音楽理論', color: '#FF6B3D', count: 5 },
];

export default function TagsScreen() {
  const { userState } = useUser();
  const router = useRouter();
  const theme = useTheme();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  
  // アニメーション用
  const headerOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);
  
  useEffect(() => {
    loadTags();
    
    // アニメーション開始
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    listOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
  }, []);
  
  // Firebaseからタグを取得
  const loadTags = async () => {
    try {
      setLoading(true);
      
      // 実際の実装ではFirebaseからデータを取得
      // const tagsSnapshot = await firestore().collection('tags')
      //   .where('createdBy', '==', userState.uid)
      //   .orderBy('createdAt', 'desc')
      //   .get();
      // 
      // const tagsData = tagsSnapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // })) as Tag[];
      // 
      // setTags(tagsData);
      
      // モックデータを使用
      setTimeout(() => {
        setTags(MOCK_TAGS);
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('エラー', 'タグの読み込みに失敗しました');
      setLoading(false);
    }
  };
  
  // 新規タグ作成
  const createTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('エラー', 'タグ名を入力してください');
      return;
    }
    
    try {
      setLoading(true);
      
      // 実際の実装では、Firebaseにタグを追加
      // const newTagRef = await firestore().collection('tags').add({
      //   name: newTagName,
      //   color: selectedColor,
      //   count: 0,
      //   createdAt: firestore.FieldValue.serverTimestamp(),
      //   createdBy: userState.uid
      // });
      
      // UIを更新
      const newTag: Tag = {
        id: `tag-${Date.now()}`, // 実際の実装ではnewTagRef.idを使用
        name: newTagName,
        color: selectedColor,
        count: 0,
        createdAt: new Date(),
        createdBy: userState.uid
      };
      
      setTags(prev => [newTag, ...prev]);
      setIsDialogVisible(false);
      setNewTagName('');
      setSelectedColor(DEFAULT_COLORS[0]);
      
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('エラー', 'タグの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // タグの更新
  const updateTag = async () => {
    if (!editingTag || !newTagName.trim()) {
      Alert.alert('エラー', 'タグ名を入力してください');
      return;
    }
    
    try {
      setLoading(true);
      
      // 実際の実装では、Firebaseのタグを更新
      // await firestore().collection('tags').doc(editingTag.id).update({
      //   name: newTagName,
      //   color: selectedColor,
      //   updatedAt: firestore.FieldValue.serverTimestamp()
      // });
      
      // UIを更新
      setTags(prev => prev.map(tag => 
        tag.id === editingTag.id 
          ? { ...tag, name: newTagName, color: selectedColor }
          : tag
      ));
      
      setIsDialogVisible(false);
      setEditingTag(null);
      setNewTagName('');
      setSelectedColor(DEFAULT_COLORS[0]);
      
    } catch (error) {
      console.error('Error updating tag:', error);
      Alert.alert('エラー', 'タグの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // タグの削除
  const deleteTag = async (tag: Tag) => {
    Alert.alert(
      'タグの削除',
      `"${tag.name}"タグを削除しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // 実際の実装では、Firebaseのタグを削除
              // await firestore().collection('tags').doc(tag.id).delete();
              
              // UIを更新
              setTags(prev => prev.filter(t => t.id !== tag.id));
              setLoading(false);
              
            } catch (error) {
              console.error('Error deleting tag:', error);
              Alert.alert('エラー', 'タグの削除に失敗しました');
              setLoading(false);
            }
          },
        },
      ],
    );
  };
  
  // タグ編集ダイアログを開く
  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setSelectedColor(tag.color);
    setIsDialogVisible(true);
  };
  
  // 新規タグダイアログを開く
  const openCreateDialog = () => {
    setEditingTag(null);
    setNewTagName('');
    setSelectedColor(DEFAULT_COLORS[0]);
    setIsDialogVisible(true);
  };
  
  // アニメーションスタイル
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
  }));
  
  // カラーピッカー
  const ColorPicker = () => (
    <View style={styles.colorPickerContainer}>
      {DEFAULT_COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorItem,
            { backgroundColor: color },
            color === selectedColor && styles.selectedColorItem,
          ]}
          onPress={() => setSelectedColor(color)}
        />
      ))}
    </View>
  );
  
  // タグアイテムをレンダリング
  const renderTagItem = ({ item }: { item: Tag }) => (
    <Animated.View 
      style={[styles.tagItem, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
    >
      <View style={styles.tagContent}>
        <View style={styles.tagMainInfo}>
          <View style={[styles.tagColorIndicator, { backgroundColor: item.color }]} />
          <Text style={styles.tagName}>{item.name}</Text>
        </View>
        
        <Text style={styles.tagCount}>{item.count} 回使用</Text>
      </View>
      
      <View style={styles.tagActions}>
        <TouchableOpacity
          style={styles.tagActionButton}
          onPress={() => openEditDialog(item)}
        >
          <Ionicons name="pencil" size={18} color="#CCCCCC" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tagActionButton}
          onPress={() => deleteTag(item)}
        >
          <Ionicons name="trash" size={18} color="#CCCCCC" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
  
  return (
    <MusicGradientBackground theme="default">
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* ヘッダー */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>タグ管理</Text>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={openCreateDialog}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* タグリスト */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7F3DFF" />
          </View>
        ) : (
          <Animated.View style={[styles.listContainer, listAnimatedStyle]}>
            <FlatList
              data={tags}
              keyExtractor={(item) => item.id}
              renderItem={renderTagItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="pricetags-outline" size={64} color="#7F3DFF" style={{ opacity: 0.5 }} />
                  <Text style={styles.emptyText}>タグがありません</Text>
                  <Text style={styles.emptySubText}>右上の「+」ボタンから新しいタグを作成できます</Text>
                </View>
              }
            />
          </Animated.View>
        )}
        
        {/* タグ作成/編集ダイアログ */}
        <Portal>
          <Dialog
            visible={isDialogVisible}
            onDismiss={() => setIsDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>
              {editingTag ? 'タグを編集' : '新しいタグを作成'}
            </Dialog.Title>
            
            <Dialog.Content>
              <TextInput
                style={styles.input}
                placeholder="タグ名を入力"
                placeholderTextColor="#999999"
                value={newTagName}
                onChangeText={setNewTagName}
                maxLength={20}
              />
              
              <Text style={styles.colorPickerLabel}>色を選択：</Text>
              <ColorPicker />
            </Dialog.Content>
            
            <Dialog.Actions>
              <Button onPress={() => setIsDialogVisible(false)}>キャンセル</Button>
              <Button onPress={editingTag ? updateTag : createTag}>
                {editingTag ? '更新' : '作成'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 61, 255, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 60, 0.8)',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  tagContent: {
    flex: 1,
  },
  tagMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tagName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tagCount: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  tagActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dialog: {
    backgroundColor: '#202030',
  },
  dialogTitle: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  input: {
    backgroundColor: 'rgba(60, 60, 80, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorPickerLabel: {
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  colorItem: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
  },
  selectedColorItem: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 8,
    textAlign: 'center',
  },
}); 