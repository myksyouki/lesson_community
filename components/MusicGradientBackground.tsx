import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

interface GradientProps {
  style?: any;
  theme?: 'default' | 'jazz' | 'classical' | 'rock' | 'electronic';
  animated?: boolean;
  opacity?: number;
  children?: React.ReactNode;
}

// テーマ別の色定義
const themes = {
  default: {
    primary: ['#121220', '#1a1a2e', '#222233'] as const,
    secondary: ['rgba(127, 61, 255, 0.8)', 'rgba(61, 127, 255, 0.2)'] as const,
    accent: 'rgba(114, 9, 183, 0.3)',
  },
  jazz: {
    primary: ['#0d1b2a', '#1b263b', '#2e294e'] as const,
    secondary: ['rgba(230, 57, 70, 0.6)', 'rgba(241, 218, 191, 0.2)'] as const,
    accent: 'rgba(214, 40, 40, 0.25)',
  },
  classical: {
    primary: ['#2d3142', '#35374a', '#424361'] as const,
    secondary: ['rgba(172, 152, 120, 0.5)', 'rgba(207, 202, 177, 0.2)'] as const,
    accent: 'rgba(144, 122, 76, 0.3)',
  },
  rock: {
    primary: ['#0e0f19', '#1a171e', '#252027'] as const,
    secondary: ['rgba(213, 24, 31, 0.7)', 'rgba(90, 90, 90, 0.25)'] as const,
    accent: 'rgba(255, 86, 86, 0.3)',
  },
  electronic: {
    primary: ['#08081a', '#101025', '#191930'] as const,
    secondary: ['rgba(0, 242, 255, 0.5)', 'rgba(100, 0, 255, 0.2)'] as const,
    accent: 'rgba(131, 56, 236, 0.35)',
  },
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function MusicGradientBackground({
  style,
  theme = 'default',
  animated = true,
  opacity = 0.9,
  children,
}: GradientProps) {
  const colors = themes[theme];
  const animation = useSharedValue(0);
  const { width, height } = Dimensions.get('window');
  
  // アニメーションのスタート
  useEffect(() => {
    if (animated) {
      animation.value = withRepeat(
        withTiming(1, { duration: 20000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        -1, // 無限に繰り返す
        true // 反転する
      );
    }
  }, [animated]);
  
  // グラデーションのアニメーションスタイル
  const animatedGradient = useAnimatedStyle(() => {
    return {
      opacity: opacity,
    };
  });
  
  return (
    <View style={[styles.container, style]}>
      <AnimatedLinearGradient
        colors={colors.primary}
        style={[styles.gradient, animatedGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* アクセントのオーバーレイ */}
      <View style={[
        styles.overlay,
        {
          backgroundColor: colors.accent,
          width: width * 0.7,
          height: height * 0.5,
          top: -height * 0.1,
          right: -width * 0.2,
          borderRadius: width * 0.5,
          transform: [{ rotate: '15deg' }],
        }
      ]} />
      
      {/* 二次的な色のアクセント */}
      <LinearGradient
        colors={colors.secondary}
        style={[
          styles.accent,
          {
            width: width * 0.9,
            height: height * 0.6,
            bottom: -height * 0.2,
            left: -width * 0.1,
            borderRadius: width * 0.5,
          }
        ]}
        start={{ x: 0.7, y: 0.2 }}
        end={{ x: 0.3, y: 0.8 }}
      />
      
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    opacity: 0.25,
    zIndex: 0,
  },
  accent: {
    position: 'absolute',
    opacity: 0.15,
    zIndex: 0,
    transform: [{ rotate: '-10deg' }],
  },
}); 