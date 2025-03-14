import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { useWheel } from '../../../hooks/useWheel';

const AnimatedG = Animated.createAnimatedComponent(G);

export interface WheelItem {
  id: string;
  name: string;
  title?: string;  // InnerWheelで使用
  color?: string;
}

interface BaseWheelProps {
  radius: number;
  items: WheelItem[];
  centerX: number;
  centerY: number;
  onItemSelected?: (id: string) => void;
  selectedItemId?: string;
  defaultColor?: string;
  backgroundColor?: string;
  strokeColor?: string;
  textSize?: number;
  isInnerWheel?: boolean;  // 内側のホイールかどうかのフラグ
  showCenterCircle?: boolean; // 中心の小さな円を表示するかどうか
}

export default function BaseWheel({
  radius,
  items,
  centerX,
  centerY,
  onItemSelected,
  selectedItemId,
  defaultColor = '#7F3DFF',
  backgroundColor = 'rgba(30, 30, 30, 0.8)',
  strokeColor = '#333333',
  textSize = 12,
  isInnerWheel = false,
  showCenterCircle = false,
}: BaseWheelProps) {
  const itemCount = items.length;
  const rotationValue = useSharedValue(0);
  
  // ホイールの回転ロジックを扱うカスタムフック
  const { startRotation, updateRotation, endRotation } = useWheel({
    onAngleChange: (newAngle) => {
      rotationValue.value = newAngle;
      
      const topItemIndex = Math.round(newAngle / (360 / itemCount)) % itemCount;
      const topItem = items[topItemIndex >= 0 ? topItemIndex : (itemCount + topItemIndex) % itemCount];
      if (topItem && onItemSelected) {
        onItemSelected(topItem.id);
      }
    }
  });
  
  // PanResponderの設定
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        const { moveX, moveY } = gestureState;
        const startAngle = calculateAngle(moveX, moveY);
        startRotation(startAngle, Date.now());
      },
      onPanResponderMove: (_, gestureState) => {
        const { moveX, moveY } = gestureState;
        const currentAngle = calculateAngle(moveX, moveY);
        updateRotation(currentAngle, Date.now());
      },
      onPanResponderRelease: () => {
        endRotation();
      },
      onPanResponderTerminate: () => {
        endRotation();
      },
    })
  ).current;
  
  // タッチ位置から角度を計算
  const calculateAngle = (x: number, y: number): number => {
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    return (angle + 90 + 360) % 360; // 上部を0度とする
  };
  
  // AnimatedGコンポーネント用のanimatedProps
  const animatedProps = useAnimatedProps(() => {
    return {
      rotation: rotationValue.value,
      origin: `${radius}, ${radius}`,
    };
  });
  
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
        {/* 背景の円 */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius}
          fill={backgroundColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
        
        {/* 回転するホイール部分 */}
        <AnimatedG
          animatedProps={animatedProps}
          rotation={0}
          origin={`${radius}, ${radius}`}
        >
          {/* 各アイテムのセクション */}
          {items.map((item, index) => {
            const startAngle = (index * 360) / itemCount;
            const endAngle = ((index + 1) * 360) / itemCount;
            const isSelected = item.id === selectedItemId;
            
            // SVGのパスを作成
            const x1 = radius + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = radius + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = radius + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = radius + radius * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
            
            const d = `
              M ${radius} ${radius}
              L ${x1} ${y1}
              A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
              Z
            `;
            
            // テキストの位置を計算
            const textAngle = (startAngle + endAngle) / 2;
            const textRadius = radius * (isInnerWheel ? 0.65 : 0.75);
            const textX = radius + textRadius * Math.cos((textAngle * Math.PI) / 180);
            const textY = radius + textRadius * Math.sin((textAngle * Math.PI) / 180);
            
            // 表示テキストを決定
            const displayText = isInnerWheel && item.title 
              ? (item.title.length > 12 ? item.title.substring(0, 10) + '...' : item.title)
              : item.name;
            
            return (
              <G key={item.id}>
                <Path
                  d={d}
                  fill={isSelected ? (item.color || defaultColor) : `${item.color || defaultColor}80`}
                  stroke={strokeColor}
                  strokeWidth={0.5}
                />
                <SvgText
                  x={textX}
                  y={textY}
                  fill="#FFFFFF"
                  fontSize={textSize}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {displayText}
                </SvgText>
              </G>
            );
          })}
        </AnimatedG>
        
        {/* 中心の小さな円（オプション） */}
        {showCenterCircle && (
          <Circle
            cx={radius}
            cy={radius}
            r={radius * 0.2}
            fill="#1E1E1E"
            stroke="#444444"
            strokeWidth={1}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
}); 