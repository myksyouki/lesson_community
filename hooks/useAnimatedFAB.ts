import { useState, useRef } from 'react';
import { Dimensions, PanResponder } from 'react-native';
import { useSharedValue, withTiming, withSequence, Easing, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

/**
 * FAB（Floating Action Button）のアニメーションと操作を管理するフック
 * @param initialPosition 初期位置
 * @param onPositionChange 位置変更時のコールバック
 * @returns FAB制御に必要なプロパティとハンドラー
 */
export const useAnimatedFAB = (
  initialPosition = { bottom: 80, right: 20 },
  onPositionChange?: (position: { bottom: number; right: number }) => void
) => {
  // 状態
  const [menuVisible, setMenuVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  
  // アニメーション用の値
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  // FABをタップした時の処理
  const handlePress = () => {
    // ドラッグ中は何もしない
    if (isDragging || longPressActive) return;
    
    // アニメーション効果
    scale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    rotation.value = withTiming(rotation.value + 360, { 
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    
    // メニューの表示/非表示を切り替え
    setMenuVisible(!menuVisible);
  };
  
  // 長押し開始
  const handleLongPress = () => {
    setLongPressActive(true);
    scale.value = withTiming(1.1, { duration: 200 });
  };
  
  // FABの位置を変更するためのPanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => longPressActive,
      onMoveShouldSetPanResponder: () => longPressActive,
      onPanResponderGrant: () => {
        setIsDragging(true);
        scale.value = withTiming(1.2, { duration: 100 });
      },
      onPanResponderMove: (_, gestureState) => {
        // 画面の端に近づきすぎないように制限
        const newRight = Math.max(10, Math.min(width - 70, width - gestureState.moveX));
        const newBottom = Math.max(10, Math.min(height - 70, height - gestureState.moveY));
        
        // 位置を更新
        const newPosition = { bottom: newBottom, right: newRight };
        setPosition(newPosition);
        
        if (onPositionChange) {
          onPositionChange(newPosition);
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        setLongPressActive(false);
        scale.value = withTiming(1, { duration: 100 });
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setLongPressActive(false);
        scale.value = withTiming(1, { duration: 100 });
      },
    })
  ).current;
  
  // FABを閉じる
  const handleClose = () => {
    if (menuVisible) {
      // 閉じるアニメーション
      scale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      rotation.value = withTiming(rotation.value + 180, { 
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
      
      setMenuVisible(false);
    }
  };
  
  // 画面に応じて位置を調整
  const getAdjustedPosition = (isThreadScreen = false, isChannelScreen = false) => {
    let adjustedPosition = { ...position };
    
    // スレッド画面の場合は、入力エリアと重ならないように位置を調整
    if (isThreadScreen) {
      adjustedPosition.bottom = Math.max(position.bottom, 100); // 入力エリアからさらに上に
    }
    
    // チャンネル画面の場合は、スレッド作成ボタンと重ならないように位置を調整
    if (isChannelScreen) {
      adjustedPosition.bottom = Math.max(position.bottom, 140); // スレッド作成ボタンからさらに上に
    }
    
    return adjustedPosition;
  };
  
  return {
    menuVisible,
    scale,
    rotation,
    position,
    isDragging,
    longPressActive,
    panResponder,
    handlePress,
    handleLongPress,
    handleClose,
    getAdjustedPosition,
  };
}; 