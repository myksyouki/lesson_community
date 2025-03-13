import { useEffect, useState, useRef } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

/**
 * フェードインとスケールアニメーションを適用するフック
 * @param fadeAnim フェードアニメーション用のAnimated.Value
 * @param scaleAnim スケールアニメーション用のAnimated.Value
 * @param duration アニメーション時間（ミリ秒）
 */
export const useFadeInScale = (
  fadeAnim: Animated.Value,
  scaleAnim: Animated.Value,
  duration: number = 500
) => {
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
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
};

/**
 * スワイプで戻る機能を提供するフック
 * @returns スワイプ関連のプロパティとハンドラー
 */
export const useSwipeBack = () => {
  const router = useRouter();
  const translateX = new Animated.Value(0);

  // スワイプジェスチャーのハンドラ
  const onGestureEvent = (event: any) => {
    // 右方向へのスワイプのみ処理
    if (event.nativeEvent.translationX > 0) {
      translateX.setValue(event.nativeEvent.translationX);
    }
  };

  // スワイプジェスチャー終了時の処理
  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === 4) {
      // スワイプが一定距離以上なら戻る
      if (event.nativeEvent.translationX > 100) {
        // アニメーションを完了させてから遷移
        Animated.timing(translateX, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          router.back();
        });
      } else {
        // 元の位置に戻す
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return {
    translateX,
    onGestureEvent,
    onHandlerStateChange,
  };
};

/**
 * 回転ホイールの制御用フック
 * @param updateTopItem 上部アイテムを更新する関数
 * @returns 回転制御に必要なプロパティとハンドラー
 */
export const useRotationWheel = (updateTopItem: () => void) => {
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [lastGestureTime, setLastGestureTime] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const velocityRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastAngleRef = useRef<number>(0);

  // 慣性アニメーションを適用
  const applyInertia = () => {
    if (Math.abs(velocityRef.current) < 0.001) {
      setIsRotating(false);
      updateTopItem();
      return;
    }

    // 減衰係数
    const dampingFactor = 0.95;
    velocityRef.current *= dampingFactor;

    // 角度を更新
    setRotationAngle((prevAngle: number) => {
      const newAngle = prevAngle + velocityRef.current;
      updateTopItem();
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
        if (now - lastGestureTime < 50) { // 感度調整
          return;
        }
        
        // 時間を更新
        setLastGestureTime(now);
        
        // 中心からのジェスチャーの角度を計算
        const { moveX, moveY, x0, y0 } = gestureState;
        const centerX = width / 2;
        const centerY = Dimensions.get('window').height / 2;
        
        // 現在の位置と開始位置から角度の変化を計算
        const currentAngle = Math.atan2(moveY - centerY, moveX - centerX);
        const startAngle = Math.atan2(y0 - centerY, x0 - centerX);
        const deltaAngle = currentAngle - startAngle;
        
        // 回転角度を更新（前回の角度に変化分を加算）
        setRotationAngle((prevAngle: number) => {
          const newAngle = prevAngle + (deltaAngle * 0.1); // 感度調整
          
          // 速度を計算
          const timeDelta = now - lastTimeRef.current;
          if (timeDelta > 0) {
            const angleDelta = newAngle - lastAngleRef.current;
            velocityRef.current = angleDelta / timeDelta * 16; // 16msは約60FPS
          }
          
          lastTimeRef.current = now;
          lastAngleRef.current = newAngle;
          
          // 回転角度が変わるたびに上部のアイテムを更新
          updateTopItem();
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

  return {
    rotationAngle,
    setRotationAngle,
    isRotating,
    panResponder,
  };
}; 