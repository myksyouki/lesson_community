import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  withTiming,
  useAnimatedScrollHandler,
  useDerivedValue,
  Extrapolate,
  SharedValue,
  withSpring,
  withDelay,
  withRepeat,
  useSharedValue,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  parallaxFactor?: number; // パララックス効果の強さ
  blurHeader?: boolean; // ヘッダーをぼかすかどうか
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  parallaxFactor = 0.5,
  blurHeader = false,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = useBottomTabOverflow();
  
  // スクロール速度を追跡（変更可能な値として定義）
  const scrollVelocity = useSharedValue(0);
  
  // スクロールハンドラー
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // scrollOffsetはuseScrollViewOffsetで自動的に更新される
      if (event.velocity) {
        scrollVelocity.value = Math.abs(event.velocity.y);
      }
    },
  });
  
  // ヘッダーのアニメーションスタイル
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollOffset.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
      [-HEADER_HEIGHT * parallaxFactor, 0, HEADER_HEIGHT * 0.75],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      scrollOffset.value, 
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT], 
      [2, 1, 1], 
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollOffset.value,
      [0, HEADER_HEIGHT * 0.8],
      [1, 0.2],
      Extrapolate.CLAMP
    );
    
    // スクロール速度に基づくダイナミックな効果
    const dynamicScale = withSpring(
      1 + Math.min(scrollVelocity.value / 5000, 0.05),
      { damping: 20, stiffness: 90 }
    );
    
    return {
      transform: [
        { translateY },
        { scale: scale * dynamicScale },
      ],
      opacity,
    };
  });
  
  // コンテンツのアニメーションスタイル
  const contentAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollOffset.value,
      [0, HEADER_HEIGHT],
      [0, -30],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollOffset.value,
      [-50, 0, 50],
      [0.5, 1, 1],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      scrollOffset.value,
      [-100, 0],
      [0.95, 1],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { translateY },
        { scale },
      ],
      opacity,
    };
  });
  
  // ヘッダーのオーバーレイアニメーションスタイル
  const headerOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [0, HEADER_HEIGHT * 0.5],
      [0, 0.5],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)',
    };
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor[colorScheme] },
            headerAnimatedStyle,
          ]}>
          {headerImage}
          <Animated.View style={[styles.headerOverlay, headerOverlayStyle]} />
        </Animated.View>
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <ThemedView style={styles.contentInner}>
            {children}
          </ThemedView>
        </Animated.View>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
    overflow: 'hidden',
  },
  contentInner: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
