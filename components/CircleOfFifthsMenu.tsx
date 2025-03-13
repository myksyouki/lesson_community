import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Pressable, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');
const OUTER_RADIUS = width * 0.4;
const INNER_RADIUS = width * 0.25;
const CENTER_X = width / 2;
const CENTER_Y = height / 2;

// 音楽的なカラーパレット
const COLORS = {
  background: 'rgba(18, 18, 24, 0.9)',
  primary: '#7F3DFF',
  secondary: '#3D7FFF',
  accent: '#FF3D77',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  channelColors: [
    '#7F3DFF', // パープル
    '#FF3D77', // ピンク
    '#3D7FFF', // ブルー
    '#FF9F3D', // オレンジ
    '#3DFFCF', // ターコイズ
    '#FF3D3D', // レッド
    '#B03DFF', // ディープパープル
    '#FFD93D', // イエロー
  ]
};

// 音符アイコン
const MUSIC_ICONS = [
  'musical-notes',
  'musical-note',
  'disc',
  'radio',
  'headset',
  'mic',
];

interface CircleOfFifthsMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function CircleOfFifthsMenu({ visible, onClose }: CircleOfFifthsMenuProps) {
  const router = useRouter();
  const { channels } = useData();
  const { userState } = useUser();
  
  // アニメーション用の値
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const [isClosing, setIsClosing] = useState(false);
  
  // ホイール回転用の状態
  const [rotationAngle, setRotationAngle] = useState(0);
  const [lastGestureTime, setLastGestureTime] = useState(0);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [topChannelId, setTopChannelId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastAngleRef = useRef(0);
  
  // 内側ホイール用の状態
  const [innerRotationAngle, setInnerRotationAngle] = useState(0);
  const [lastInnerGestureTime, setLastInnerGestureTime] = useState(0);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [topThreadId, setTopThreadId] = useState<string | null>(null);
  const [isInnerRotating, setIsInnerRotating] = useState(false);
  const innerVelocityRef = useRef(0);
  const lastInnerTimeRef = useRef(0);
  const lastInnerAngleRef = useRef(0);
  
  // ユーザーが選択した楽器カテゴリー
  const activeCategory = userState?.selectedCategories?.[0] || 'flute';
  
  // 選択した楽器カテゴリーのチャンネルのみをフィルタリング
  const categoryChannels = channels?.filter(channel => channel.category === activeCategory) || [];
  
  // 表示するチャンネル（最大7つ + More）
  const displayChannels = categoryChannels.slice(0, 7);
  
  // お気に入りスレッド（サンプル）- 選択した楽器カテゴリーのスレッドのみ
  const favoriteThreads = [
    { id: 'thread1', name: '初心者質問', channelId: categoryChannels[0]?.id || 'channel1', color: COLORS.channelColors[0] },
    { id: 'thread2', name: '練習方法', channelId: categoryChannels[0]?.id || 'channel1', color: COLORS.channelColors[1] },
    { id: 'thread3', name: '機材相談', channelId: categoryChannels[1]?.id || 'channel3', color: COLORS.channelColors[2] },
    { id: 'thread4', name: '演奏会情報', channelId: categoryChannels[2]?.id || 'channel4', color: COLORS.channelColors[3] },
  ].filter(thread => categoryChannels.some(channel => channel.id === thread.channelId));
  
  // モーダル表示時のアニメーション
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 90 });
      rotation.value = withTiming(360, { duration: 1000, easing: Easing.out(Easing.cubic) });
      
      // 初期状態で上部のチャンネルとスレッドを設定
      updateTopChannel();
      updateTopThread();
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.3, { duration: 200 });
    }
  }, [visible]);
  
  // 円形メニューのアニメーションスタイル
  const circleMenuStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
      ],
    };
  });
  
  // 背景の回転アニメーション
  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` }
      ]
    };
  });
  
  // チャンネルセグメントの位置計算
  const getChannelPosition = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / total;
    // 回転角度を考慮した角度計算
    const angle = index * angleStep - Math.PI / 2 + rotationAngle; // -90度から開始（12時の位置）
    
    const x = CENTER_X + OUTER_RADIUS * Math.cos(angle);
    const y = CENTER_Y + OUTER_RADIUS * Math.sin(angle);
    
    // 12時の位置（上部）に近いかどうかを判定
    const isTop = Math.abs(angle % (2 * Math.PI) - (-Math.PI / 2)) < 0.15 || 
                  Math.abs(angle % (2 * Math.PI) - (3 * Math.PI / 2)) < 0.15;
    
    return { x, y, angle, isTop };
  };
  
  // 上部（12時の位置）に最も近いチャンネルを特定して設定
  const updateTopChannel = () => {
    if (displayChannels.length === 0) return;
    
    // 現在の回転角度から12時の位置に最も近いチャンネルのインデックスを計算
    const angleStep = (2 * Math.PI) / (displayChannels.length + 1); // +1 for "More" button
    const normalizedAngle = (rotationAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    
    // 12時の位置は -Math.PI/2 (または 3*Math.PI/2)
    // その位置に最も近いチャンネルのインデックスを計算
    let closestIndex = Math.round((normalizedAngle + Math.PI/2) / angleStep) % (displayChannels.length + 1);
    if (closestIndex < 0) closestIndex += displayChannels.length + 1;
    
    // "More" ボタンが上部にある場合は特別処理
    if (closestIndex === displayChannels.length) {
      setTopChannelId('more');
    } else if (closestIndex < displayChannels.length) {
      // 対応するチャンネルを上部チャンネルとして設定
      setTopChannelId(displayChannels[closestIndex].id);
    }
  };
  
  // 慣性アニメーションを適用
  const applyInertia = () => {
    if (Math.abs(velocityRef.current) < 0.001) {
      setIsRotating(false);
      updateTopChannel();
      return;
    }

    // 減衰係数
    const dampingFactor = 0.95;
    velocityRef.current *= dampingFactor;

    // 角度を更新
    setRotationAngle(prevAngle => {
      const newAngle = prevAngle + velocityRef.current;
      updateTopChannel();
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
      onPanResponderGrant: (_, gestureState) => {
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
        if (now - lastGestureTime < 50) { // 感度を上げるために値を小さくする
          return;
        }
        
        // 時間を更新
        setLastGestureTime(now);
        
        // 中心からのジェスチャーの角度を計算
        const { moveX, moveY, x0, y0 } = gestureState;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 現在の位置と開始位置から角度の変化を計算
        const currentAngle = Math.atan2(moveY - centerY, moveX - centerX);
        const startAngle = Math.atan2(y0 - centerY, x0 - centerX);
        const deltaAngle = currentAngle - startAngle;
        
        // 回転角度を更新（前回の角度に変化分を加算）
        // 感度を上げるために回転量を調整（0.1倍）
        setRotationAngle(prevAngle => {
          const newAngle = prevAngle + (deltaAngle * 0.1);
          
          // 速度を計算
          const timeDelta = now - lastTimeRef.current;
          if (timeDelta > 0) {
            const angleDelta = newAngle - lastAngleRef.current;
            velocityRef.current = angleDelta / timeDelta * 16; // 16msは約60FPS
          }
          
          lastTimeRef.current = now;
          lastAngleRef.current = newAngle;
          
          // 回転角度が変わるたびに上部のチャンネルを更新
          updateTopChannel();
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
  
  // 上部（12時の位置）に最も近いスレッドを特定して設定
  const updateTopThread = () => {
    if (favoriteThreads.length === 0) return;
    
    // 現在の回転角度から12時の位置に最も近いスレッドのインデックスを計算
    const angleStep = (2 * Math.PI) / favoriteThreads.length;
    const normalizedAngle = (innerRotationAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    
    // 12時の位置は -Math.PI/2 (または 3*Math.PI/2)
    // その位置に最も近いスレッドのインデックスを計算
    let closestIndex = Math.round((normalizedAngle + Math.PI/2) / angleStep) % favoriteThreads.length;
    if (closestIndex < 0) closestIndex += favoriteThreads.length;
    
    // 対応するスレッドを上部スレッドとして設定
    setTopThreadId(favoriteThreads[closestIndex].id);
  };
  
  // 内側ホイールの慣性アニメーションを適用
  const applyInnerInertia = () => {
    if (Math.abs(innerVelocityRef.current) < 0.001) {
      setIsInnerRotating(false);
      updateTopThread();
      return;
    }

    // 減衰係数
    const dampingFactor = 0.95;
    innerVelocityRef.current *= dampingFactor;

    // 角度を更新
    setInnerRotationAngle(prevAngle => {
      const newAngle = prevAngle + innerVelocityRef.current;
      updateTopThread();
      return newAngle;
    });

    // 次のフレームで再度実行
    requestAnimationFrame(applyInnerInertia);
  };
  
  // 内側ホイール用のパンジェスチャー
  const innerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        // ジェスチャー開始時の時間を記録
        setLastInnerGestureTime(Date.now());
        lastInnerTimeRef.current = Date.now();
        lastInnerAngleRef.current = innerRotationAngle;
        innerVelocityRef.current = 0;
        setIsInnerRotating(false);
      },
      onPanResponderMove: (_, gestureState) => {
        // 現在の時間を取得
        const now = Date.now();
        
        // 前回のジェスチャーから十分な時間が経過していない場合はスキップ
        if (now - lastInnerGestureTime < 50) { // 感度を上げるために値を小さくする
          return;
        }
        
        // 時間を更新
        setLastInnerGestureTime(now);
        
        // 中心からのジェスチャーの角度を計算
        const { moveX, moveY, x0, y0 } = gestureState;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 現在の位置と開始位置から角度の変化を計算
        const currentAngle = Math.atan2(moveY - centerY, moveX - centerX);
        const startAngle = Math.atan2(y0 - centerY, x0 - centerX);
        const deltaAngle = currentAngle - startAngle;
        
        // 回転角度を更新（前回の角度に変化分を加算）
        setInnerRotationAngle(prevAngle => {
          const newAngle = prevAngle + (deltaAngle * 0.1);
          
          // 速度を計算
          const timeDelta = now - lastInnerTimeRef.current;
          if (timeDelta > 0) {
            const angleDelta = newAngle - lastInnerAngleRef.current;
            innerVelocityRef.current = angleDelta / timeDelta * 16; // 16msは約60FPS
          }
          
          lastInnerTimeRef.current = now;
          lastInnerAngleRef.current = newAngle;
          
          // 回転角度が変わるたびに上部のスレッドを更新
          updateTopThread();
          return newAngle;
        });
      },
      onPanResponderRelease: () => {
        // 慣性アニメーションを開始
        setIsInnerRotating(true);
        requestAnimationFrame(applyInnerInertia);
      },
    })
  ).current;
  
  // スレッドセグメントの位置計算（内側ホイールの回転を考慮）
  const getThreadPosition = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / total;
    // 回転角度を考慮した角度計算
    const angle = index * angleStep - Math.PI / 2 + innerRotationAngle; // -90度から開始（12時の位置）
    
    const x = CENTER_X + INNER_RADIUS * Math.cos(angle);
    const y = CENTER_Y + INNER_RADIUS * Math.sin(angle);
    
    // 12時の位置（上部）に近いかどうかを判定
    const isTop = Math.abs(angle % (2 * Math.PI) - (-Math.PI / 2)) < 0.15 || 
                  Math.abs(angle % (2 * Math.PI) - (3 * Math.PI / 2)) < 0.15;
    
    return { x, y, angle, isTop };
  };
  
  // 閉じるアニメーションを実行してから閉じる
  const handleClose = () => {
    setIsClosing(true);
    scale.value = withTiming(0.3, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(completeClose)();
      }
    });
    rotation.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) });
  };
  
  // アニメーション完了後に実際に閉じる
  const completeClose = () => {
    onClose();
    setIsClosing(false);
  };
  
  // チャンネルをタップした時の処理
  const handleChannelPress = (channelId: string) => {
    handleClose();
    setTimeout(() => {
      router.push(`/channels/${channelId}`);
    }, 300);
  };
  
  // スレッドをタップした時の処理
  const handleThreadPress = (channelId: string, threadId: string) => {
    handleClose();
    setTimeout(() => {
      router.push(`/threads/${channelId}/${threadId}`);
    }, 300);
  };
  
  // More Channelsをタップした時の処理
  const handleMoreChannelsPress = () => {
    handleClose();
    setTimeout(() => {
      router.push('/category/index');
    }, 300);
  };
  
  // visibleがfalseの場合は何も表示しない
  if (!visible) {
    return null;
  }
  
  return (
    <Modal
      transparent
      visible={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalBackground} onPress={handleClose}>
        <Animated.View style={[styles.menuContainer, circleMenuStyle]}>
          {/* 外側ホイール全体の領域 - パンジェスチャーを適用 */}
          <View 
            style={styles.outerWheelArea}
            {...panResponder.panHandlers}
          />
          
          {/* 内側ホイール全体の領域 - パンジェスチャーを適用 */}
          <View 
            style={styles.innerWheelArea}
            {...innerPanResponder.panHandlers}
          />
          
          {/* 背景の装飾的な円 */}
          <Animated.View style={[styles.backgroundCircle, rotationStyle]}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* 外側の円 */}
              <Circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={OUTER_RADIUS + 20}
                stroke={COLORS.primary}
                strokeWidth={1}
                strokeOpacity={0.3}
                fill="none"
              />
              
              {/* 内側の円 */}
              <Circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={INNER_RADIUS + 10}
                stroke={COLORS.secondary}
                strokeWidth={1}
                strokeOpacity={0.3}
                fill="none"
              />
              
              {/* 五度圏を表す線 */}
              {Array.from({ length: 12 }).map((_, index) => {
                const angle = (index * 30 * Math.PI) / 180;
                const x1 = CENTER_X + (INNER_RADIUS - 20) * Math.cos(angle);
                const y1 = CENTER_Y + (INNER_RADIUS - 20) * Math.sin(angle);
                const x2 = CENTER_X + (OUTER_RADIUS + 30) * Math.cos(angle);
                const y2 = CENTER_Y + (OUTER_RADIUS + 30) * Math.sin(angle);
                
                return (
                  <Path
                    key={`line-${index}`}
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    stroke={COLORS.primary}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                  />
                );
              })}
              
              {/* 中心の円 - タップで閉じる */}
              <Circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={40}
                fill={COLORS.primary}
                fillOpacity={0.1}
                stroke={COLORS.primary}
                strokeWidth={1}
              />
              
              {/* 中心の音符アイコン */}
              <SvgText
                x={CENTER_X}
                y={CENTER_Y + 10}
                fontSize="40"
                fontWeight="bold"
                fill={COLORS.primary}
                textAnchor="middle"
              >
                ♪
              </SvgText>
            </Svg>
          </Animated.View>
          
          {/* 中心の円をタップで閉じる */}
          <TouchableOpacity 
            style={styles.centerTouchArea}
            onPress={handleClose}
          >
            <View style={styles.centerIconContainer} />
          </TouchableOpacity>
          
          {/* 12時の位置マーカー */}
          <View style={styles.topMarker} />
          
          {/* チャンネルセグメント */}
          <View 
            style={styles.segmentsContainer} 
            pointerEvents="box-none"
          >
            {displayChannels.map((channel, index) => {
              const { x, y, isTop } = getChannelPosition(index, displayChannels.length + 1);
              const iconName = MUSIC_ICONS[index % MUSIC_ICONS.length];
              const color = COLORS.channelColors[index % COLORS.channelColors.length];
              const isTopChannel = channel.id === topChannelId;
              const isSelected = channel.id === selectedChannelId;
              
              // 上部のチャンネルは大きく表示
              const itemSize = isTopChannel ? 90 : 80;
              const iconSize = isTopChannel ? 28 : 24;
              const fontSize = isTopChannel ? 12 : 10;
              
              return (
                <TouchableOpacity
                  key={channel.id}
                  style={[
                    styles.channelSegment,
                    {
                      left: x - (itemSize / 2),
                      top: y - (itemSize / 2),
                      width: itemSize,
                      height: itemSize,
                      backgroundColor: isSelected ? color : (isTopChannel ? color : '#2A2A2A'),
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: '#FFFFFF',
                      transform: [{ scale: isTopChannel ? 1.1 : 1 }],
                      zIndex: isTopChannel ? 10 : 1,
                    }
                  ]}
                  onPress={() => handleChannelPress(channel.id)}
                >
                  <Ionicons name={iconName as any} size={iconSize} color="#FFFFFF" />
                  <Text style={[styles.segmentText, { fontSize }]} numberOfLines={1}>
                    {channel.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {/* More Channels ボタン - チャンネルがある場合のみ表示 */}
            {displayChannels.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.channelSegment,
                  {
                    left: getChannelPosition(displayChannels.length, displayChannels.length + 1).x - 40,
                    top: getChannelPosition(displayChannels.length, displayChannels.length + 1).y - 40,
                    backgroundColor: topChannelId === 'more' ? '#777777' : '#555555',
                    transform: [{ scale: topChannelId === 'more' ? 1.1 : 1 }],
                    zIndex: topChannelId === 'more' ? 10 : 1,
                  }
                ]}
                onPress={handleMoreChannelsPress}
              >
                <Ionicons name="ellipsis-horizontal" size={topChannelId === 'more' ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.segmentText, { fontSize: topChannelId === 'more' ? 12 : 10 }]}>もっと見る</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* スレッドセグメント */}
          <View style={styles.segmentsContainer} pointerEvents="box-none">
            {favoriteThreads.map((thread, index) => {
              const { x, y, isTop } = getThreadPosition(index, favoriteThreads.length);
              const isTopThread = thread.id === topThreadId;
              const isSelected = thread.id === selectedThreadId;
              
              // 上部のスレッドは大きく表示
              const itemSize = isTopThread ? 70 : 60;
              const iconSize = isTopThread ? 22 : 18;
              const fontSize = isTopThread ? 10 : 8;
              
              return (
                <TouchableOpacity
                  key={thread.id}
                  style={[
                    styles.threadSegment,
                    {
                      left: x - (itemSize / 2),
                      top: y - (itemSize / 2),
                      width: itemSize,
                      height: itemSize,
                      backgroundColor: isSelected ? thread.color : (isTopThread ? thread.color : '#2A2A2A'),
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: '#FFFFFF',
                      transform: [{ scale: isTopThread ? 1.1 : 1 }],
                      zIndex: isTopThread ? 10 : 1,
                    }
                  ]}
                  onPress={() => handleThreadPress(thread.channelId, thread.id)}
                >
                  <Ionicons name="chatbubble-outline" size={iconSize} color="#FFFFFF" />
                  <Text style={[styles.threadText, { fontSize }]} numberOfLines={1}>
                    {thread.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentsContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  channelSegment: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  segmentText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
  threadSegment: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  threadText: {
    color: '#FFFFFF',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topMarker: {
    position: 'absolute',
    top: height / 2 - OUTER_RADIUS - 15,
    width: 20,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    zIndex: 100,
  },
  wheelArea: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    zIndex: 50,
    backgroundColor: 'transparent',
  },
  centerTouchArea: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  outerWheelArea: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    zIndex: 50,
    backgroundColor: 'transparent',
  },
  innerWheelArea: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    zIndex: 51, // 内側ホイールは外側ホイールより前面に
    backgroundColor: 'transparent',
  },
  centerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 