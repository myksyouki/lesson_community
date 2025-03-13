import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';
import CircleOfFifthsMenu from './CircleOfFifthsMenu';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

interface MusicFABProps {
  onPress?: () => void;
  isThreadScreen?: boolean;
  isChannelScreen?: boolean;
}

export default function MusicFAB({ onPress, isThreadScreen = false, isChannelScreen = false }: MusicFABProps) {
  const { userState, setFabPosition } = useUser();
  // デフォルト値を設定して、undefinedの場合に備える
  const defaultPosition = { bottom: 80, right: 20 }; // デフォルト位置を上に調整
  const fabEnabled = userState?.fabEnabled ?? true;
  const fabPosition = userState?.fabPosition ?? defaultPosition;
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  
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
    
    // 外部から渡されたonPressがあれば実行
    if (onPress) {
      onPress();
    }
  };
  
  // FABのアニメーションスタイル
  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ]
    };
  });
  
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
        if (setFabPosition) {
          setFabPosition({ bottom: newBottom, right: newRight });
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
  
  // FABが無効の場合は何も表示しない
  if (!fabEnabled) {
    return null;
  }
  
  // 画面に応じて位置を調整
  let position = fabPosition;
  
  // スレッド画面の場合は、入力エリアと重ならないように位置を調整
  if (isThreadScreen) {
    position = { bottom: Math.max(fabPosition.bottom, 100), right: fabPosition.right }; // 入力エリアからさらに上に
  }
  
  // チャンネル画面の場合は、スレッド作成ボタンと重ならないように位置を調整
  if (isChannelScreen) {
    position = { bottom: Math.max(fabPosition.bottom, 140), right: fabPosition.right }; // スレッド作成ボタンからさらに上に
  }
  
  return (
    <>
      <Animated.View 
        style={[
          styles.fabContainer, 
          fabStyle,
          { bottom: position.bottom, right: position.right }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.fab,
            longPressActive && styles.fabDragging
          ]}
          onPress={handlePress}
          onLongPress={() => setLongPressActive(true)}
          delayLongPress={500}
          activeOpacity={0.8}
        >
          <View style={styles.fabContent}>
            <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      {/* CircleOfFifthsMenuコンポーネントを条件付きでレンダリング */}
      {menuVisible && (
        <CircleOfFifthsMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7F3DFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabDragging: {
    backgroundColor: '#B03DFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fabContent: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7F3DFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
}); 