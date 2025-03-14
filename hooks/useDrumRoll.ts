import { useState, useRef, useCallback } from 'react';
import { Dimensions, ViewProps } from 'react-native';
import { useSharedValue, withTiming, withSpring, SharedValue, withSequence } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// カードの高さと間隔の定義
const CARD_HEIGHT = 55;
const CARD_MARGIN = 5;
const VISIBLE_CARDS = 5;
const TOTAL_CARD_HEIGHT = CARD_HEIGHT + CARD_MARGIN * 2;

interface UseDrumRollProps {
  fabPosition: { right: number; bottom: number };
  itemCount: number;
  onSelect?: (index: number) => void;
}

interface UseDrumRollResult {
  selectedIndex: number;
  isVisible: boolean;
  fabRef: React.RefObject<any>;
  showDrumRoll: () => void;
  closeDrumRoll: () => void;
  handleScroll: (index: number) => void;
  animatedStyles: {
    container: any;
    cards: any[];
  };
  maskAnimatedStyle: any;
}

export function useDrumRoll({ 
  fabPosition,
  itemCount,
  onSelect
}: UseDrumRollProps): UseDrumRollResult {
  // 状態管理
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fabRef = useRef<any>(null);
  
  // アニメーション用の値
  const menuAnimation = useSharedValue(0);
  const maskAnimation = useSharedValue(0);
  
  // ドラムロールメニューを表示
  const showDrumRoll = useCallback(() => {
    setIsVisible(true);
    menuAnimation.value = withTiming(1, { duration: 300 });
    maskAnimation.value = withTiming(1, { duration: 300 });
  }, [menuAnimation, maskAnimation]);
  
  // ドラムロールメニューを閉じる
  const closeDrumRoll = useCallback(() => {
    menuAnimation.value = withTiming(0, { duration: 300 });
    maskAnimation.value = withTiming(0, { duration: 300 });
    
    // アニメーション完了後に実際に非表示にする
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  }, [menuAnimation, maskAnimation]);
  
  // アイテム選択時の処理
  const handleScroll = useCallback((index: number) => {
    setSelectedIndex(index);
    
    // スプリングアニメーションで選択効果を強調
    menuAnimation.value = withSequence(
      withSpring(0.95, { damping: 5 }),
      withSpring(1, { damping: 8 })
    );
    
    // 選択されたアイテムをコールバックで通知
    if (onSelect) {
      onSelect(index);
    }
    
    // 選択後、少し遅延してメニューを閉じる
    setTimeout(() => {
      closeDrumRoll();
    }, 500);
  }, [onSelect, closeDrumRoll, menuAnimation]);
  
  // カードのアニメーションスタイルを計算
  const calculateCardStyles = () => {
    const styles: any[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      // 選択されたインデックスからの距離に応じてアニメーションを調整
      const distance = Math.abs(i - selectedIndex);
      const scale = 1 - (distance * 0.05);
      const opacity = 1 - (distance * 0.2);
      
      styles.push({
        opacity: withTiming(opacity, { duration: 200 }),
        transform: [
          { scale: withTiming(scale, { duration: 200 }) },
          { translateY: withTiming(distance * -5, { duration: 200 }) }
        ]
      });
    }
    
    return styles;
  };
  
  // アニメーションスタイルを生成
  const animatedStyles = {
    container: {
      opacity: menuAnimation,
      transform: [
        { scale: menuAnimation },
        { translateY: menuAnimation.value * -10 }
      ]
    },
    cards: calculateCardStyles()
  };
  
  const maskAnimatedStyle = {
    opacity: maskAnimation
  };
  
  return {
    selectedIndex,
    isVisible,
    fabRef,
    showDrumRoll,
    closeDrumRoll,
    handleScroll,
    animatedStyles,
    maskAnimatedStyle
  };
}

// ドラムロールのスタイル計算用ヘルパー関数
export const getDrumRollStyles = (fabPosition: { bottom: number; right: number }) => {
  const right = fabPosition.right + 60;
  const bottom = fabPosition.bottom;
  
  return {
    // メインのカードリスト
    cardList: {
      position: 'absolute' as const,
      right,
      bottom: bottom + 5,
      width: width * 0.7,
      height: TOTAL_CARD_HEIGHT * VISIBLE_CARDS,
      backgroundColor: 'transparent',
      zIndex: 1000,
    },
    // 背景オーバーレイ
    overlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      zIndex: 999,
    },
  };
}; 