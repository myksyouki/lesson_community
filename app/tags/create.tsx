import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useUser } from '../../contexts/UserContext';
import MusicGradientBackground from '../../components/MusicGradientBackground';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  withSequence,
  withDelay 
} from 'react-native-reanimated';

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

export default function CreateTagScreen() {
  const { userState } = useUser();
  const router = useRouter();
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  // アニメーション用
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(20);
  const titleScale = useSharedValue(0.9);
  const colorGlow = useSharedValue(1);
  
  useEffect(() => {
    // アニメーション開始
    titleScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    formOpacity.value = withDelay(
      200, 
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    formTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    
    // 選択した色を光らせるアニメーション
    colorGlow.value = withSequence(
      withTiming(1.2, { duration: 500 }),
      withTiming(1, { duration: 500 })
    );
  }, []);
  
  // タグ作成処理
  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      Alert.alert('エラー', 'タグ名を入力してください');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 実際の実装では、Firebaseにタグを追加
      // const newTagRef = await firestore().collection('tags').add({
      //   name: tagName,
      //   color: selectedColor,
      //   count: 0,
      //   createdAt: firestore.FieldValue.serverTimestamp(),
      //   createdBy: userState.userId
      // });
      
      // モック処理（成功をシミュレーション）
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(
          'タグ作成完了',
          `タグ「${tagName}」が作成されました`,
          [
            { 
              text: 'OK', 
              onPress: () => router.back() 
            }
          ]
        );
      }, 1000);
      
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('エラー', 'タグの作成に失敗しました');
      setIsLoading(false);
    }
  };
  
  // アニメーションスタイル
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleScale.value,
    transform: [{ scale: titleScale.value }],
  }));
  
  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));
  
  // 色が選択されたときのアニメーション効果
  const updateSelectedColor = (color: string) => {
    setSelectedColor(color);
    colorGlow.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 300 })
    );
  };
  
  // 色を選ぶためのコンポーネント
  const ColorOption = ({ color }: { color: string }) => {
    const isSelected = color === selectedColor;
    const colorScale = useSharedValue(1);
    
    useEffect(() => {
      if (isSelected) {
        colorScale.value = withSequence(
          withTiming(1.1, { duration: 200 }),
          withTiming(1, { duration: 200 })
        );
      }
    }, [isSelected]);
    
    const colorAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: isSelected ? colorScale.value : 1 }],
      borderWidth: isSelected ? 3 : 0,
    }));
    
    return (
      <Animated.View style={colorAnimatedStyle}>
        <TouchableOpacity
          style={[
            styles.colorOption,
            { backgroundColor: color },
            isSelected && styles.selectedColorOption
          ]}
          onPress={() => updateSelectedColor(color)}
        />
      </Animated.View>
    );
  };
  
  return (
    <MusicGradientBackground theme="default">
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Animated.Text style={[styles.headerTitle, titleAnimatedStyle]}>
            新しいタグを作成
          </Animated.Text>
          
          <View style={{ width: 40 }} />
        </View>
        
        {/* メインコンテンツ */}
        <Animated.ScrollView 
          style={[styles.content, formAnimatedStyle]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* タグ名入力 */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>タグ名</Text>
            <TextInput
              style={styles.textInput}
              placeholder="タグ名を入力（例：初心者、テクニック）"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={tagName}
              onChangeText={setTagName}
              maxLength={20}
            />
          </View>
          
          {/* 色選択 */}
          <View style={styles.colorContainer}>
            <Text style={styles.inputLabel}>タグの色</Text>
            <View style={styles.colorGrid}>
              {DEFAULT_COLORS.map((color) => (
                <ColorOption key={color} color={color} />
              ))}
            </View>
          </View>
          
          {/* プレビュー */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>プレビュー</Text>
            <View style={styles.previewTag}>
              <View 
                style={[
                  styles.previewTagInner, 
                  { backgroundColor: `${selectedColor}30`, borderColor: `${selectedColor}60` }
                ]}
              >
                <Text style={[styles.previewTagText, { color: selectedColor }]}>
                  {tagName || 'タグ名'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={[styles.createButton, { backgroundColor: selectedColor }]}
              labelStyle={styles.createButtonLabel}
              onPress={handleCreateTag}
              loading={isLoading}
              disabled={isLoading || !tagName.trim()}
            >
              タグを作成
            </Button>
          </View>
        </Animated.ScrollView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(60, 60, 80, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 16,
  },
  colorContainer: {
    marginBottom: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  previewContainer: {
    marginBottom: 32,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  previewTag: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  previewTagInner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  previewTagText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  createButton: {
    padding: 4,
    borderRadius: 12,
  },
  createButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 4,
  },
}); 