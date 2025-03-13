import { useState, useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { INSTRUMENT_COLORS } from '../constants/Colors';

const { width } = Dimensions.get('window');
const CIRCLE_RADIUS = width * 0.38; // 円の半径

// 楽器データの型定義
export interface Instrument {
  id: string;
  name: string;
  icon: string;
  color: string;
  size?: number;
}

/**
 * 楽器選択画面のロジックを管理するフック
 * @param instruments 楽器データの配列
 * @param initialSelectedId 初期選択されている楽器ID
 * @param onSelect 楽器選択時のコールバック
 * @returns 楽器選択に必要なプロパティとハンドラー
 */
export const useInstrumentSelector = (
  instruments: Instrument[],
  initialSelectedId: string | null = null,
  onSelect?: (instrumentId: string | null) => void
) => {
  const router = useRouter();
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(initialSelectedId);
  const [lastSelectedInstrument, setLastSelectedInstrument] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [confirmAnim] = useState(new Animated.Value(0));
  const [rotationAngle, setRotationAngle] = useState(0);
  const [topInstrumentId, setTopInstrumentId] = useState<string | null>(null);
  const [lastGestureTime, setLastGestureTime] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [initialRender, setInitialRender] = useState(true);
  const [highlightsEnabled, setHighlightsEnabled] = useState(false);
  
  // 速度計算用の参照
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastAngleRef = useRef(0);
  
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
      
      // コールバックがあれば実行
      if (onSelect) {
        onSelect(null);
      }
    } else {
      setLastSelectedInstrument(selectedInstrument);
      setSelectedInstrument(instrumentId);
      
      // 確認メッセージを表示
      Animated.timing(confirmAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // コールバックがあれば実行
      if (onSelect) {
        onSelect(instrumentId);
      }
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
    const isTop = Math.abs(angle % (2 * Math.PI) - (-Math.PI / 2)) < 0.15 || 
                  Math.abs(angle % (2 * Math.PI) - (3 * Math.PI / 2)) < 0.15;
    
    return { x, y, angle, isTop };
  };
  
  // 上部（12時の位置）に最も近い楽器を特定して設定
  const updateTopInstrument = () => {
    if (instruments.length === 0) return;
    
    // 現在の回転角度から12時の位置に最も近い楽器のインデックスを計算
    const angleStep = (2 * Math.PI) / instruments.length;
    const normalizedAngle = (rotationAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    
    // 12時の位置は -Math.PI/2 (または 3*Math.PI/2)
    // その位置に最も近い楽器のインデックスを計算
    let closestIndex = Math.round((normalizedAngle + Math.PI/2) / angleStep) % instruments.length;
    if (closestIndex < 0) closestIndex += instruments.length;
    
    // 対応する楽器を上部楽器として設定
    const topInstrument = instruments[closestIndex].id;
    
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
        if (now - lastGestureTime < 50) { // 感度調整
          return;
        }
        
        // 時間を更新
        setLastGestureTime(now);
        
        // 中心からのジェスチャーの角度を計算
        const { moveX, moveY, x0, y0 } = gestureState;
        const centerX = width / 2;
        const centerY = Dimensions.get('window').height / 2 - 50; // 中心位置の調整
        
        // 現在の位置と開始位置から角度の変化を計算
        const currentAngle = Math.atan2(moveY - centerY, moveX - centerX);
        const startAngle = Math.atan2(y0 - centerY, x0 - centerX);
        const deltaAngle = currentAngle - startAngle;
        
        // 回転角度を更新（前回の角度に変化分を加算）
        setRotationAngle(prevAngle => {
          const newAngle = prevAngle + (deltaAngle * 0.1); // 感度調整
          
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
  
  // 選択した楽器を確定する
  const handleConfirm = () => {
    if (selectedInstrument && onSelect) {
      onSelect(selectedInstrument);
    }
  };
  
  return {
    selectedInstrument,
    lastSelectedInstrument,
    fadeAnim,
    scaleAnim,
    confirmAnim,
    rotationAngle,
    topInstrumentId,
    isRotating,
    initialRender,
    highlightsEnabled,
    panResponder,
    handleSelectInstrument,
    handleConfirm,
    getPositionOnCircle,
    updateTopInstrument,
  };
}; 