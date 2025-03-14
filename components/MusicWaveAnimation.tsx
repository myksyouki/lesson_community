import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  withSequence,
} from 'react-native-reanimated';

interface WaveProps {
  color?: string;
  count?: number;
  height?: number;
  width?: number;
  opacity?: number;
  horizontal?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  style?: any;
}

export default function MusicWaveAnimation({
  color = '#7F3DFF',
  count = 5,
  height = 40,
  width = 3,
  opacity = 0.3,
  horizontal = false,
  position = 'bottom',
  style,
}: WaveProps) {
  // 波形バーの配列を作成
  const bars = Array.from({ length: count }, (_, i) => i);
  
  // バーの位置を計算（左右または上下の配置）
  const getPosition = () => {
    switch (position) {
      case 'top':
        return { top: 0, left: 0, right: 0, justifyContent: 'center' };
      case 'bottom':
        return { bottom: 0, left: 0, right: 0, justifyContent: 'center' };
      case 'left':
        return { top: 0, bottom: 0, left: 0, alignItems: 'center' };
      case 'right':
        return { top: 0, bottom: 0, right: 0, alignItems: 'center' };
      default:
        return { bottom: 0, left: 0, right: 0, justifyContent: 'center' };
    }
  };

  return (
    <View style={[styles.container, getPosition(), style]}>
      <View style={[
        styles.waveContainer, 
        horizontal ? { flexDirection: 'column' } : { flexDirection: 'row' }
      ]}>
        {bars.map((i) => (
          <BarAnimation 
            key={i} 
            color={color} 
            delay={i * 180} 
            height={height} 
            width={width}
            opacity={opacity}
            horizontal={horizontal}
          />
        ))}
      </View>
    </View>
  );
}

// 個々のバーのアニメーション
function BarAnimation({ 
  color, 
  delay,
  height,
  width,
  opacity,
  horizontal
}: { 
  color: string; 
  delay: number;
  height: number;
  width: number;
  opacity: number;
  horizontal: boolean;
}) {
  const animationValue = useSharedValue(0);
  
  // 異なるタイミングとパターンでバーを動かす
  useEffect(() => {
    const randomDuration = 1000 + Math.random() * 500;
    
    animationValue.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: randomDuration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.3, { duration: randomDuration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        ),
        -1, // 無限に繰り返す
        true // 反転する
      )
    );
  }, []);
  
  // バーのアニメーションスタイル
  const animatedStyle = useAnimatedStyle(() => {
    const size = interpolate(
      animationValue.value,
      [0, 1],
      [height * 0.3, height]
    );
    
    if (horizontal) {
      return {
        width: size,
        height: width,
      };
    }
    
    return {
      height: size,
      width: width,
    };
  });
  
  return (
    <Animated.View 
      style={[
        styles.bar, 
        animatedStyle, 
        { backgroundColor: color, opacity: opacity },
        horizontal ? styles.horizontalBar : styles.verticalBar
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 0,
    opacity: 0.7,
  },
  waveContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: 40,
  },
  bar: {
    borderRadius: 50,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  verticalBar: {
    alignSelf: 'flex-end',
  },
  horizontalBar: {
    alignSelf: 'center',
  },
}); 