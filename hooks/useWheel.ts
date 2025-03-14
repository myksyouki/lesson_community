import { useState, useRef, useEffect } from 'react';

interface UseWheelProps {
  initialAngle?: number;
  inertiaFactor?: number;
  minVelocity?: number;
  onAngleChange?: (angle: number) => void;
}

interface UseWheelResult {
  angle: number;
  isRotating: boolean;
  startRotation: (angle: number, time: number) => void;
  updateRotation: (angle: number, time: number) => void;
  endRotation: () => void;
}

export function useWheel({
  initialAngle = 0,
  inertiaFactor = 0.95,
  minVelocity = 0.1,
  onAngleChange,
}: UseWheelProps = {}): UseWheelResult {
  const [angle, setAngle] = useState(initialAngle);
  const [isRotating, setIsRotating] = useState(false);
  const [lastGestureTime, setLastGestureTime] = useState(0);
  
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastAngleRef = useRef(initialAngle);
  const requestRef = useRef<number | null>(null);
  
  // 角度を正規化する（0〜360度の範囲に収める）
  const normalizeAngle = (angle: number): number => {
    return ((angle % 360) + 360) % 360;
  };
  
  // 回転を開始
  const startRotation = (newAngle: number, time: number) => {
    setIsRotating(true);
    setLastGestureTime(time);
    lastTimeRef.current = time;
    lastAngleRef.current = normalizeAngle(newAngle);
    velocityRef.current = 0;
    
    // 角度を更新
    setAngle(normalizeAngle(newAngle));
    if (onAngleChange) {
      onAngleChange(normalizeAngle(newAngle));
    }
  };
  
  // 回転を更新
  const updateRotation = (newAngle: number, time: number) => {
    if (!isRotating) return;
    
    setLastGestureTime(time);
    
    // 角度の変化量と時間の変化量から角速度を計算
    const deltaTime = time - lastTimeRef.current;
    if (deltaTime > 0) {
      const deltaAngle = normalizeAngle(newAngle) - lastAngleRef.current;
      velocityRef.current = deltaAngle / deltaTime * 16; // 16msは一般的なフレーム時間
    }
    
    lastTimeRef.current = time;
    lastAngleRef.current = normalizeAngle(newAngle);
    
    // 角度を更新
    setAngle(normalizeAngle(newAngle));
    if (onAngleChange) {
      onAngleChange(normalizeAngle(newAngle));
    }
  };
  
  // 回転を終了
  const endRotation = () => {
    if (!isRotating) return;
    
    // 慣性アニメーションを開始
    if (Math.abs(velocityRef.current) > minVelocity) {
      applyInertia();
    } else {
      setIsRotating(false);
    }
  };
  
  // 慣性アニメーション
  const applyInertia = () => {
    if (Math.abs(velocityRef.current) < minVelocity) {
      setIsRotating(false);
      cancelAnimationFrame(requestRef.current!);
      requestRef.current = null;
      return;
    }
    
    // 角速度を減衰させる
    velocityRef.current *= inertiaFactor;
    
    // 新しい角度を計算
    const newAngle = normalizeAngle(lastAngleRef.current + velocityRef.current);
    lastAngleRef.current = newAngle;
    
    // 角度を更新
    setAngle(newAngle);
    if (onAngleChange) {
      onAngleChange(newAngle);
    }
    
    // 次のフレームで再度実行
    requestRef.current = requestAnimationFrame(applyInertia);
  };
  
  // コンポーネントのアンマウント時にアニメーションをキャンセル
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  return {
    angle,
    isRotating,
    startRotation,
    updateRotation,
    endRotation,
  };
} 