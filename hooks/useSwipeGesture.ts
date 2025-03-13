import { useRef } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

/**
 * スワイプジェスチャーを処理するフック
 * @param onSwipeRight 右スワイプ時のコールバック（省略時はルーターのback）
 * @param onSwipeLeft 左スワイプ時のコールバック
 * @param threshold スワイプと判定する閾値（ピクセル）
 * @returns スワイプ関連のプロパティとハンドラー
 */
export const useSwipeGesture = (
  onSwipeRight?: () => void,
  onSwipeLeft?: () => void,
  threshold: number = 100
) => {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;
  
  // スワイプジェスチャーのハンドラ
  const onGestureEvent = (event: any) => {
    // 水平方向のスワイプのみ処理
    translateX.setValue(event.nativeEvent.translationX);
  };

  // スワイプジェスチャー終了時の処理
  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === 4) { // 4 = State.END
      // 右方向へのスワイプ
      if (event.nativeEvent.translationX > threshold && onSwipeRight) {
        // アニメーションを完了させてからコールバック実行
        Animated.timing(translateX, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeRight();
        });
      } 
      // 左方向へのスワイプ
      else if (event.nativeEvent.translationX < -threshold && onSwipeLeft) {
        // アニメーションを完了させてからコールバック実行
        Animated.timing(translateX, {
          toValue: -width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeLeft();
        });
      } 
      // スワイプが閾値未満の場合は元の位置に戻す
      else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // 右スワイプで戻る（デフォルト動作）
  const handleSwipeBack = () => {
    if (onSwipeRight) {
      onSwipeRight();
    } else {
      router.back();
    }
  };

  return {
    translateX,
    onGestureEvent,
    onHandlerStateChange,
    handleSwipeBack,
    panResponder: PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 水平方向の移動が垂直方向より大きい場合のみ反応
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // ジェスチャー開始時の処理
      },
      onPanResponderMove: (evt, gestureState) => {
        // 移動中の処理
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        // 右スワイプ
        if (gestureState.dx > threshold) {
          Animated.timing(translateX, {
            toValue: width,
            duration: 200,
            useNativeDriver: true,
          }).start(handleSwipeBack);
        } 
        // 左スワイプ
        else if (gestureState.dx < -threshold && onSwipeLeft) {
          Animated.timing(translateX, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(onSwipeLeft);
        } 
        // スワイプが閾値未満
        else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  };
}; 