import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';

// 画面サイズを取得
const { width, height } = Dimensions.get('window');
const CIRCLE_RADIUS = width * 0.38; // 円の半径
const ITEM_SIZE = width * 0.18; // 楽器アイコンのサイズ

// 楽器データ
const INSTRUMENTS = [
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

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateProfile, setSelectedCategories } = useUser();
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [confirmAnim] = useState(new Animated.Value(0));

  // 初期アニメーション
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 楽器選択時のアニメーション
  const handleSelectInstrument = (instrumentId: string) => {
    setSelectedInstrument(instrumentId);
    Animated.timing(confirmAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // 確定ボタンを押した時の処理
  const handleConfirm = () => {
    if (selectedInstrument) {
      // 選択した楽器をユーザープロファイルに設定
      setSelectedCategories([selectedInstrument]);
      
      // ホーム画面に遷移
      router.replace('/');
    }
  };

  // 円周上に楽器を配置するための角度計算
  const getPositionOnCircle = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / total;
    const angle = index * angleStep - Math.PI / 2; // -90度から開始（12時の位置）
    
    const x = CIRCLE_RADIUS * Math.cos(angle);
    const y = CIRCLE_RADIUS * Math.sin(angle);
    
    return { x, y };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <Text style={styles.title}>あなたのメイン楽器を選択</Text>
        <Text style={styles.subtitle}>演奏する楽器を選んでコミュニティに参加しましょう</Text>
        
        <View style={styles.circleContainer}>
          {/* 中心の円 */}
          <View style={styles.centerCircle}>
            <Image 
              source={require('../assets/images/music-note.png')} 
              style={styles.centerImage}
              resizeMode="contain"
            />
          </View>
          
          {/* 楽器アイコン */}
          {INSTRUMENTS.map((instrument, index) => {
            const { x, y } = getPositionOnCircle(index, INSTRUMENTS.length);
            const isSelected = selectedInstrument === instrument.id;
            
            return (
              <TouchableOpacity
                key={instrument.id}
                style={[
                  styles.instrumentItem,
                  {
                    transform: [
                      { translateX: x },
                      { translateY: y },
                    ],
                    backgroundColor: isSelected ? instrument.color : '#2A2A2A',
                  },
                ]}
                onPress={() => handleSelectInstrument(instrument.id)}
              >
                <Ionicons 
                  name={instrument.icon as any} 
                  size={28} 
                  color={isSelected ? '#FFFFFF' : instrument.color} 
                />
                <Text 
                  style={[
                    styles.instrumentName,
                    { color: isSelected ? '#FFFFFF' : '#AAAAAA' }
                  ]}
                >
                  {instrument.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* 選択確認メッセージ */}
        {selectedInstrument && (
          <Animated.View 
            style={[
              styles.confirmContainer,
              { 
                opacity: confirmAnim,
                transform: [{ 
                  translateY: confirmAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  }) 
                }] 
              }
            ]}
          >
            <Text style={styles.confirmText}>
              あなたのメイン楽器は
              <Text style={[
                styles.selectedInstrument,
                { color: INSTRUMENTS.find(i => i.id === selectedInstrument)?.color }
              ]}>
                {INSTRUMENTS.find(i => i.id === selectedInstrument)?.name}
              </Text>
              です
            </Text>
            <Button 
              mode="contained" 
              style={[
                styles.confirmButton,
                { backgroundColor: INSTRUMENTS.find(i => i.id === selectedInstrument)?.color }
              ]}
              onPress={handleConfirm}
            >
              はじめる
            </Button>
          </Animated.View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 40,
    textAlign: 'center',
  },
  circleContainer: {
    width: width * 0.9,
    height: width * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  centerCircle: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  centerImage: {
    width: width * 0.15,
    height: width * 0.15,
    tintColor: '#7F3DFF',
  },
  instrumentItem: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  instrumentName: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  confirmContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  confirmText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectedInstrument: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  confirmButton: {
    paddingHorizontal: 32,
    borderRadius: 30,
  },
}); 