import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { StatusBar } from 'expo-status-bar';

// 画面サイズを取得
const { width, height } = Dimensions.get('window');
const CIRCLE_RADIUS = width * 0.38; // 円の半径
const ITEM_SIZE = width * 0.18; // 楽器アイコンのサイズ
const TOP_ITEM_SIZE = width * 0.24; // 上部の大きい楽器アイコンのサイズ

// 楽器データ
const INSTRUMENTS = [
  { id: 'flute', name: 'フルート', icon: 'musical-notes', color: '#7F3DFF' },
  { id: 'clarinet', name: 'クラリネット', icon: 'musical-notes', color: '#FF3D77' },
  { id: 'oboe', name: 'オーボエ', icon: 'musical-notes', color: '#3D7FFF' },
  { id: 'fagotto', name: 'ファゴット', icon: 'musical-notes', color: '#FF9F3D', size: 0.9 },
  { id: 'saxophone', name: 'サクソフォン', icon: 'musical-notes', color: '#3DFFCF' },
  { id: 'horn', name: 'ホルン', icon: 'musical-notes', color: '#FF3D3D' },
  { id: 'euphonium', name: 'ユーフォニアム', icon: 'musical-notes', color: '#B03DFF' },
  { id: 'trumpet', name: 'トランペット', icon: 'musical-notes', color: '#FFD93D' },
  { id: 'trombone', name: 'トロンボーン', icon: 'musical-notes', color: '#3DFFB0' },
  { id: 'tuba', name: 'チューバ', icon: 'musical-notes', color: '#FF6B3D' },
  { id: 'percussion', name: 'パーカッション', icon: 'musical-notes', color: '#3DB0FF' },
];

interface InstrumentSelectorProps {
  isModal?: boolean;
  onClose?: () => void;
}

export default function InstrumentSelectorScreen({ isModal = false, onClose }: InstrumentSelectorProps) {
  const router = useRouter();
  const { userState, setSelectedCategories } = useUser();
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(userState.selectedCategories[0] || null);
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [confirmAnim] = useState(new Animated.Value(0));
  const [rotationAngle, setRotationAngle] = useState(0);
  const rotationRef = useRef(new Animated.Value(0)).current;
  const [topInstrumentId, setTopInstrumentId] = useState<string | null>(null);
  const [lastGestureTime, setLastGestureTime] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastAngleRef = useRef(0);
  const [initialRender, setInitialRender] = useState(true);
  const [highlightsEnabled, setHighlightsEnabled] = useState(false);
  const [lastSelectedInstrument, setLastSelectedInstrument] = useState<string | null>(null);

  // 初期アニメーション
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 初期状態で上部の楽器を設定するが、ハイライトはしない
    updateTopInstrument();
    
    // 初期レンダリングが完了したことをマーク
    setTimeout(() => {
      setInitialRender(false);
    }, 100);
    
    // ハイライトを有効にするのは少し遅延させる
    setTimeout(() => {
      setHighlightsEnabled(true);
    }, 500);

    // 現在選択されている楽器があれば、確認メッセージを表示
    if (selectedInstrument) {
      Animated.timing(confirmAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  // 楽器選択時のアニメーション
  const handleSelectInstrument = (instrumentId: string) => {
    // 同じ楽器を再度選択した場合は選択を解除
    if (selectedInstrument === instrumentId) {
      setSelectedInstrument(null);
      setLastSelectedInstrument(null);
      
      // 確認メッセージを非表示
      Animated.timing(confirmAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setLastSelectedInstrument(selectedInstrument);
      setSelectedInstrument(instrumentId);
      
      // 確認メッセージを表示
      Animated.timing(confirmAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // 中央アイコンをタップした時の処理
  const handleCenterTap = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // 確定ボタンを押した時の処理
  const handleConfirm = async () => {
    // 選択した楽器を使用
    if (selectedInstrument) {
      try {
        // 選択した楽器をユーザープロファイルに設定
        setSelectedCategories([selectedInstrument]);
        
        // Firebase認証が利用可能な場合、ユーザーの楽器情報をFirebaseに保存
        const { auth } = require('../firebase/config');
        const { userService } = require('../firebase/services');
        
        if (auth.currentUser) {
          await userService.updateUserInstruments(auth.currentUser.uid, [selectedInstrument]);
          console.log('楽器情報をFirebaseに保存しました:', selectedInstrument);
        }
        
        // モーダルの場合は閉じる、そうでなければホーム画面に遷移
        if (isModal && onClose) {
          onClose();
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.error('楽器情報の保存に失敗しました:', error);
        // エラーが発生してもホーム画面に遷移する
        if (isModal && onClose) {
          onClose();
        } else {
          router.replace('/');
        }
      }
    }
  };

  // キャンセルボタンを押した時の処理
  const handleCancel = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // 円周上に楽器を配置するための角度計算
  const getPositionOnCircle = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / total;
    // 回転角度を考慮した角度計算
    const angle = index * angleStep - Math.PI / 2 + rotationAngle; // -90度から開始（12時の位置）
    
    const x = CIRCLE_RADIUS * Math.cos(angle);
    const y = CIRCLE_RADIUS * Math.sin(angle);
    
    // 12時の位置（上部）に近いかどうかを判定
    // 範囲を狭めて、より厳密に上部を判定
    const isTop = Math.abs(angle % (2 * Math.PI) - (-Math.PI / 2)) < 0.15 || 
                  Math.abs(angle % (2 * Math.PI) - (3 * Math.PI / 2)) < 0.15;
    
    return { x, y, angle, isTop };
  };

  // 上部（12時の位置）に最も近い楽器を特定して設定
  const updateTopInstrument = () => {
    // 現在の回転角度から12時の位置に最も近い楽器のインデックスを計算
    const angleStep = (2 * Math.PI) / INSTRUMENTS.length;
    const normalizedAngle = (rotationAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    
    // 12時の位置は -Math.PI/2 (または 3*Math.PI/2)
    // その位置に最も近い楽器のインデックスを計算
    let closestIndex = Math.round((normalizedAngle + Math.PI/2) / angleStep) % INSTRUMENTS.length;
    if (closestIndex < 0) closestIndex += INSTRUMENTS.length;
    
    // 対応する楽器を上部楽器として設定
    const topInstrument = INSTRUMENTS[closestIndex].id;
    
    // 前回と同じ場合は更新しない（不要な再レンダリングを防ぐ）
    if (topInstrumentId !== topInstrument) {
      setTopInstrumentId(topInstrument);
    }
  };

  // 慣性アニメーションを適用
  const applyInertia = () => {
    if (Math.abs(velocityRef.current) < 0.001) {
      setIsRotating(false);
      updateTopInstrument();
      return;
    }

    // 減衰係数
    const dampingFactor = 0.95;
    velocityRef.current *= dampingFactor;

    // 角度を更新
    setRotationAngle(prevAngle => {
      const newAngle = prevAngle + velocityRef.current;
      updateTopInstrument();
      return newAngle;
    });

    // 次のフレームで再度実行
    requestAnimationFrame(applyInertia);
  };

  // パンジェスチャーによる回転制御
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // ジェスチャー開始時の時間を記録
        setLastGestureTime(Date.now());
        lastTimeRef.current = Date.now();
        lastAngleRef.current = rotationAngle;
        velocityRef.current = 0;
        setIsRotating(false);
      },
      onPanResponderMove: (_, gestureState) => {
        // 現在の時間を取得
        const now = Date.now();
        
        // 前回のジェスチャーから十分な時間が経過していない場合はスキップ
        // これにより、ジェスチャーの頻度を制限し、スムーズな回転を実現
        if (now - lastGestureTime < 200) { // 約5FPSに制限し、スクロール感度を下げる
          return;
        }
        
        // 時間を更新
        setLastGestureTime(now);
        
        // 中心からのジェスチャーの角度を計算
        const { moveX, moveY, x0, y0 } = gestureState;
        const centerX = width / 2;
        const centerY = height / 2 - 50; // 中心位置の調整
        
        // 現在の位置と開始位置から角度の変化を計算
        const currentAngle = Math.atan2(moveY - centerY, moveX - centerX);
        const startAngle = Math.atan2(y0 - centerY, x0 - centerX);
        const deltaAngle = currentAngle - startAngle;
        
        // 回転角度を更新（前回の角度に変化分を加算）
        // 感度を下げるために回転量を調整（0.03倍に変更）
        setRotationAngle(prevAngle => {
          const newAngle = prevAngle + (deltaAngle * 0.03);
          
          // 速度を計算
          const timeDelta = now - lastTimeRef.current;
          if (timeDelta > 0) {
            const angleDelta = newAngle - lastAngleRef.current;
            velocityRef.current = angleDelta / timeDelta * 16; // 16msは約60FPS
          }
          
          lastTimeRef.current = now;
          lastAngleRef.current = newAngle;
          
          // 回転角度が変わるたびに上部の楽器を更新
          updateTopInstrument();
          return newAngle;
        });
      },
      onPanResponderRelease: () => {
        // 慣性アニメーションを開始
        setIsRotating(true);
        requestAnimationFrame(applyInertia);
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 戻るボタン - 左上に配置 */}
      <TouchableOpacity 
        style={styles.backButtonTop}
        onPress={handleCancel}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <Text style={styles.subtitle}>メイン楽器を選択してください</Text>
        
        <View 
          style={styles.circleContainer}
          {...panResponder.panHandlers}
        >
          {/* 中心の円 - タップで閉じる */}
          <TouchableOpacity 
            style={styles.centerCircle}
            onPress={handleCenterTap}
          >
            <Image 
              source={require('../assets/images/music-note.png')} 
              style={styles.centerImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {/* 楽器アイコン */}
          {INSTRUMENTS.map((instrument, index) => {
            const { x, y, isTop } = getPositionOnCircle(index, INSTRUMENTS.length);
            const isTopInstrument = instrument.id === topInstrumentId;
            const isSelected = instrument.id === selectedInstrument;
            
            // 上部の楽器は大きく表示
            const sizeMultiplier = instrument.size || 1;
            const itemSize = (isTopInstrument ? TOP_ITEM_SIZE : ITEM_SIZE) * sizeMultiplier;
            
            // 楽器ごとにアイコンサイズを調整
            const baseIconSize = instrument.id === 'fagotto' ? 24 : 28;
            const iconSize = isTopInstrument ? baseIconSize * 1.2 : baseIconSize;
            const fontSize = isTopInstrument ? 12 : 10;
            
            // トップ位置のハイライト表示を無効化
            // 選択された楽器は枠線表示
            const showBorder = isSelected;
            
            // 選択された楽器は色を変更、トップ位置のハイライトは無効化
            const bgColor = isSelected ? instrument.color : '#2A2A2A';
            
            // 選択された楽器の場合、追加のエフェクトを適用
            const selectedScale = isSelected ? 1.3 : (isTopInstrument ? 1.1 : 1);
            
            // 選択された楽器にはシャドウエフェクトを強化
            const selectedShadow = isSelected ? {
              shadowColor: instrument.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 15,
              elevation: 15,
            } : {};
            
            // ファゴットの場合、特別な処理
            const isFagotto = instrument.id === 'fagotto';
            const fagottoStyle = isFagotto ? {
              transform: [
                { translateX: x },
                { translateY: y },
                { scale: isSelected ? 1.2 : 1 }
              ],
            } : {};
            
            return (
              <Animated.View
                key={instrument.id}
                style={[
                  styles.instrumentItem,
                  {
                    width: itemSize,
                    height: itemSize,
                    borderRadius: itemSize / 2,
                    transform: !isFagotto ? [
                      { translateX: x },
                      { translateY: y },
                      { scale: selectedScale }
                    ] : undefined,
                    backgroundColor: bgColor,
                    borderWidth: showBorder ? 4 : 0,
                    borderColor: '#FFFFFF',
                    zIndex: isSelected ? 20 : (isTopInstrument ? 10 : 1),
                    overflow: 'hidden', // はみ出し防止
                  },
                  isFagotto ? fagottoStyle : {},
                  isSelected ? selectedShadow : {},
                ]}
              >
                <TouchableOpacity
                  style={styles.instrumentButton}
                  onPress={() => {
                    // タップした楽器を選択
                    handleSelectInstrument(instrument.id);
                  }}
                >
                  <Ionicons 
                    name={instrument.icon as any} 
                    size={iconSize} 
                    color={isSelected ? '#FFFFFF' : '#AAAAAA'} 
                  />
                  <Text 
                    style={[
                      styles.instrumentName,
                      { 
                        color: isSelected ? '#FFFFFF' : '#AAAAAA',
                        fontSize: fontSize,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {instrument.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        
        {/* 選択確認メッセージとボタン */}
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
                { color: INSTRUMENTS.find(i => i.id === selectedInstrument)?.color || '#7F3DFF' }
              ]}>
                {' ' + (INSTRUMENTS.find(i => i.id === selectedInstrument)?.name || '') + ' '}
              </Text>
              です
            </Text>
            <Button 
              mode="contained" 
              style={[
                styles.confirmButton,
                { 
                  backgroundColor: INSTRUMENTS.find(i => i.id === selectedInstrument)?.color || '#7F3DFF',
                }
              ]}
              onPress={handleConfirm}
            >
              変更する
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
  backButtonTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40, // 下部スペースを調整
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  instrumentButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instrumentName: {
    textAlign: 'center',
    marginTop: 4,
    width: '100%',
  },
  confirmContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  confirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  selectedInstrument: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  confirmButton: {
    paddingHorizontal: 32,
    borderRadius: 30,
    width: 200,
  },
}); 