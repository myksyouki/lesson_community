import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Text,
  Dimensions, 
  PanResponder,
  FlatList,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useUser } from '../contexts/UserContext';
import { useData } from '../contexts/DataContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// カードの高さと間隔の定義
const CARD_HEIGHT = 55;
const CARD_MARGIN = 5;
const VISIBLE_CARDS = 5;
const TOTAL_CARD_HEIGHT = CARD_HEIGHT + CARD_MARGIN * 2;

interface DrumRollFABProps {
  onPress?: () => void;
  isThreadScreen?: boolean;
  isChannelScreen?: boolean;
}

export default function DrumRollFAB({ onPress, isThreadScreen = false, isChannelScreen = false }: DrumRollFABProps) {
  const router = useRouter();
  const { userState, setFabPosition } = useUser();
  const { channels } = useData();
  
  // デフォルト値を設定して、undefinedの場合に備える
  const defaultPosition = { bottom: 80, right: 20 };
  const fabEnabled = userState?.fabEnabled ?? true;
  const fabPosition = userState?.fabPosition ?? defaultPosition;
  
  // 状態管理
  const [isDragging, setIsDragging] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const [drumRollVisible, setDrumRollVisible] = useState(false);
  
  // アニメーション用の値
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const cardListX = useSharedValue(-width); // 横方向のアニメーション用
  const cardListOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(0); // オーバーレイの透明度
  
  // ドラムロール用の状態
  const flatListRef = useRef<FlatList>(null);
  const [selectedIndex, setSelectedIndex] = useState(2); // 中央のカード（インデックス2）を初期選択
  
  // チャンネルデータ
  const activeCategory = userState?.selectedCategories?.[0] || 'flute';
  const categoryChannels = channels?.filter(channel => channel.category === activeCategory) || [];
  
  // FABをタップした時の処理
  const handlePress = () => {
    // ドラッグ中は何もしない
    if (isDragging || longPressActive) return;
    
    // アニメーション効果
    scale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    // 外部から渡されたonPressがあれば実行
    if (onPress) {
      onPress();
    } else {
      // 長押し処理を実行（通常のタップでもドラムロールを表示）
      handleLongPress();
    }
  };
  
  // 長押し時の処理
  const handleLongPress = () => {
    // ドラッグ中は何もしない
    if (isDragging) return;
    
    setLongPressActive(true);
    
    // ドラムロールメニューを表示
    showDrumRollMenu();
  };
  
  // ドラムロールメニューを表示
  const showDrumRollMenu = () => {
    // FABのアニメーション
    scale.value = withTiming(1.3, { duration: 200 });
    
    // カードリストのアニメーション - 横から飛び出す
    cardListX.value = withTiming(0, { 
      duration: 400,
      easing: Easing.out(Easing.back(1.2))
    });
    cardListOpacity.value = withTiming(1, { duration: 300 });
    
    // オーバーレイのアニメーション
    overlayOpacity.value = withTiming(0.7, { duration: 300 });
    
    // ドラムロールメニューを表示
    setDrumRollVisible(true);
    
    // 初期選択位置にスクロール
    setTimeout(() => {
      if (flatListRef.current && categoryChannels.length > 0) {
        // 有効なインデックスを確保
        const validIndex = Math.max(0, Math.min(selectedIndex, categoryChannels.length - 1));
        
        flatListRef.current.scrollToIndex({
          index: validIndex,
          animated: true,
          viewPosition: 0.5
        });
      }
    }, 100);
  };
  
  // ドラムロールメニューを閉じる
  const closeDrumRollMenu = () => {
    // FABのアニメーション
    scale.value = withTiming(1, { duration: 200 });
    
    // カードリストのアニメーション - 横に戻る
    cardListX.value = withTiming(-width, { 
      duration: 300,
      easing: Easing.in(Easing.cubic)
    });
    cardListOpacity.value = withTiming(0, { duration: 200 });
    
    // オーバーレイのアニメーション
    overlayOpacity.value = withTiming(0, { duration: 200 });
    
    // ドラムロールメニューを非表示
    setTimeout(() => {
      setDrumRollVisible(false);
      setLongPressActive(false);
    }, 300);
  };
  
  // カードがスクロールで中央に来た時の処理
  const handleCenterItem = (index: number) => {
    setSelectedIndex(index);
  };
  
  // カードをタップした時の処理
  const handleCardPress = (item: any) => {
    // 選択したチャンネルに移動
    router.push(`/channels/${item.id}`);
    
    // ドラムロールメニューを閉じる
    closeDrumRollMenu();
  };
  
  // FABのアニメーションスタイル
  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ]
    };
  });
  
  // カードリストのアニメーションスタイル
  const cardListStyle = useAnimatedStyle(() => {
    return {
      opacity: cardListOpacity.value,
      transform: [
        { translateX: cardListX.value }
      ]
    };
  });
  
  // オーバーレイのアニメーションスタイル
  const overlayStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: `rgba(0, 0, 0, ${overlayOpacity.value})`,
    };
  });
  
  // FABの位置を変更するためのPanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => longPressActive,
      onMoveShouldSetPanResponder: () => longPressActive,
      onPanResponderGrant: () => {
        setIsDragging(true);
        scale.value = withTiming(1.2, { duration: 100 });
      },
      onPanResponderMove: (_, gestureState) => {
        // 画面の端に近づきすぎないように制限
        const newRight = Math.max(10, Math.min(width - 70, width - gestureState.moveX));
        const newBottom = Math.max(10, Math.min(height - 70, height - gestureState.moveY));
        
        // 位置を更新
        if (setFabPosition) {
          setFabPosition({ bottom: newBottom, right: newRight });
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        setLongPressActive(false);
        scale.value = withTiming(1, { duration: 100 });
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setLongPressActive(false);
        scale.value = withTiming(1, { duration: 100 });
      },
    })
  ).current;
  
  // FABが無効の場合は何も表示しない
  if (!fabEnabled) {
    return null;
  }
  
  // 画面に応じて位置を調整
  let position = fabPosition;
  
  // スレッド画面の場合は、入力エリアと重ならないように位置を調整
  if (isThreadScreen) {
    position = { bottom: Math.max(fabPosition.bottom, 100), right: fabPosition.right };
  }
  
  // チャンネル画面の場合は、スレッド作成ボタンと重ならないように位置を調整
  if (isChannelScreen) {
    position = { bottom: Math.max(fabPosition.bottom, 140), right: fabPosition.right };
  }
  
  // 表示するデータ
  const displayData = categoryChannels.length === 0
    ? Array(5).fill(null).map((_, i) => ({
        id: `dummy-${i}`,
        name: 'チャンネルがありません',
        isDummy: true
      }))
    : categoryChannels;
  
  // カードのレンダリング
  const renderCard = ({ item, index }: { item: any, index: number }) => {
    const isCenter = index === selectedIndex;
    
    // ダミーデータの場合は透明なカードを表示
    if (item.isDummy) {
      return <View style={[styles.card, { opacity: 0 }]} />;
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.card,
          isCenter ? styles.cardCenter : styles.cardInactive
        ]}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <Text style={[
            styles.cardTitle,
            isCenter ? styles.cardTitleCenter : styles.cardTitleInactive
          ]}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // FABをタップしたときにドラムロールを表示するように変更
  const handleFabPress = () => {
    if (drumRollVisible) {
      closeDrumRollMenu();
    } else {
      handlePress();
    }
  };
  
  // ドラムロールの表示位置を計算
  const getCardListPosition = () => {
    // 画面の中央より右側にFABがある場合は左側に表示
    const isRightSide = position.right < width / 2;
    
    return {
      bottom: position.bottom + 60, // FABの上に表示
      right: isRightSide ? position.right + 70 : undefined, // 右側にFABがある場合は左側に表示
      left: !isRightSide ? width - position.right + 10 : undefined, // 左側にFABがある場合は右側に表示
    };
  };
  
  const cardListPosition = getCardListPosition();
  
  return (
    <>
      <Animated.View 
        style={[
          styles.fabContainer, 
          fabStyle,
          { bottom: position.bottom, right: position.right }
        ]}
        {...panResponder.panHandlers}
      >
        {drumRollVisible && (
          <View style={styles.fabLabel}>
            <Text style={styles.fabLabelText}>ch</Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.fab,
            longPressActive && styles.fabActive
          ]}
          onPress={handleFabPress}
          onLongPress={handleLongPress}
          delayLongPress={300}
          activeOpacity={0.8}
        >
          <View style={styles.fabContent}>
            <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      {/* ドラムロールカードリスト - カレンダースタイル */}
      {drumRollVisible && (
        <TouchableWithoutFeedback onPress={closeDrumRollMenu}>
          <Animated.View style={[styles.drumRollOverlay, overlayStyle]}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View 
                style={[
                  styles.cardListContainer, 
                  cardListStyle,
                  { 
                    position: 'absolute',
                    bottom: cardListPosition.bottom,
                    right: cardListPosition.right,
                    left: cardListPosition.left,
                  }
                ]}
              >
                {/* 中央マーカー */}
                <View style={styles.centerMarker} />
                
                {/* カードリスト */}
                <FlatList
                  ref={flatListRef}
                  data={displayData}
                  renderItem={renderCard}
                  keyExtractor={(item, index) => `${item.id}-${index}`}
                  contentContainerStyle={styles.cardListContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={TOTAL_CARD_HEIGHT}
                  decelerationRate="fast"
                  snapToAlignment="center"
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / TOTAL_CARD_HEIGHT);
                    handleCenterItem(index);
                  }}
                  initialScrollIndex={Math.min(selectedIndex, displayData.length - 1)}
                  getItemLayout={(data, index) => ({
                    length: TOTAL_CARD_HEIGHT,
                    offset: TOTAL_CARD_HEIGHT * index,
                    index,
                  })}
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  drumRollOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 990,
  },
  fabContainer: {
    position: 'absolute',
    zIndex: 999,
  },
  fabLabel: {
    position: 'absolute',
    bottom: 65,
    alignSelf: 'center',
    backgroundColor: 'rgba(127, 61, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabLabelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7F3DFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabActive: {
    backgroundColor: '#B03DFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fabContent: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7F3DFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardListContainer: {
    width: 280, // 幅を調整
    height: TOTAL_CARD_HEIGHT * VISIBLE_CARDS, // 余白を含む
    backgroundColor: 'rgba(10, 10, 15, 0.95)', // 背景色の不透明度を上げる
    borderRadius: 16, // 角丸を調整
    padding: 10, // パディングを調整
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  cardListContent: {
    paddingVertical: TOTAL_CARD_HEIGHT * 2, // 上下に十分なスペースを確保
  },
  card: {
    height: CARD_HEIGHT,
    marginVertical: CARD_MARGIN,
    borderRadius: 10, // 角丸を調整
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  cardCenter: {
    borderBottomWidth: 1.5, // ボーダーを調整
    borderTopWidth: 1.5, // ボーダーを調整
    borderColor: 'rgba(127, 61, 255, 0.5)', // ボーダーの不透明度を上げる
    backgroundColor: 'rgba(20, 20, 30, 0.95)', // 背景色の不透明度を調整
    shadowColor: '#7F3DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardInactive: {
    backgroundColor: 'rgba(20, 20, 30, 0.75)', // 非選択カードの背景色の不透明度を調整
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18, // パディングを調整
  },
  cardTitle: {
    fontSize: 16, // フォントサイズを調整
    fontWeight: '600',
    textAlign: 'center',
  },
  cardTitleCenter: {
    fontSize: 17, // フォントサイズを調整
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardTitleInactive: {
    color: 'rgba(220, 220, 220, 0.85)', // 非選択カードのテキスト色の不透明度を調整
  },
  centerMarker: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    top: '50%',
    marginTop: -CARD_HEIGHT / 2,
    backgroundColor: 'rgba(127, 61, 255, 0.2)', // 背景色の不透明度を調整
    borderRadius: 10, // カードと同じ角丸に調整
    borderWidth: 1.5, // ボーダーを調整
    borderColor: 'rgba(127, 61, 255, 0.4)', // ボーダーの不透明度を調整
    zIndex: -1,
  },
}); 