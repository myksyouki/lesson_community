import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FAB } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeContext';
import { useDrumRoll } from '@/hooks/useDrumRoll';
import { DrumRollCardItem } from './DrumRollCard';
import Animated from 'react-native-reanimated';
import DrumRollCard from './DrumRollCard';

const { width } = Dimensions.get('window');

// ドラムロールに表示する項目
const drumRollItems: DrumRollCardItem[] = [
  { id: '1', title: 'ドラム', icon: 'ios-musical-notes', gradient: ['#7F3DFF', '#B03DFF'] },
  { id: '2', title: 'ベース', icon: 'ios-musical-note', gradient: ['#FF3D77', '#FF5E3D'] },
  { id: '3', title: 'ギター', icon: 'ios-guitar', gradient: ['#3D8FFF', '#3DCEFF'] },
  { id: '4', title: 'キーボード', icon: 'ios-keypad', gradient: ['#3DBEFF', '#3DF2FF'] },
  { id: '5', title: 'ボーカル', icon: 'ios-mic', gradient: ['#FF3D77', '#FFBD3D'] },
];

interface DrumRollFABProps {
  onItemSelect?: (item: DrumRollCardItem) => void;
  fabPosition?: { right: number; bottom: number };
}

function DrumRollFAB({ onItemSelect, fabPosition = { right: 20, bottom: 85 } }: DrumRollFABProps) {
  const { theme } = useTheme();
  const { 
    isVisible, 
    selectedIndex, 
    fabRef,
    showDrumRoll, 
    closeDrumRoll,
    handleScroll,
    animatedStyles,
    maskAnimatedStyle
  } = useDrumRoll({ 
    fabPosition,
    itemCount: drumRollItems.length,
    onSelect: (index) => {
      if (onItemSelect && index >= 0 && index < drumRollItems.length) {
        onItemSelect(drumRollItems[index]);
      }
    }
  });

  // コンポーネントがアンマウントされる際にドラムロールを閉じる
  useEffect(() => {
    return () => {
      if (isVisible) {
        closeDrumRoll();
      }
    };
  }, [isVisible, closeDrumRoll]);

  return (
    <>
      {/* ドラムロールメニュー */}
      {isVisible && (
        <>
          <Animated.View style={[styles.backdrop, maskAnimatedStyle]}>
            <Animated.View style={[styles.drumRollContainer, animatedStyles.container]}>
              {drumRollItems.map((item, index) => (
                <Animated.View 
                  key={item.id} 
                  style={[
                    animatedStyles.cards[index]
                  ]}
                >
                  <DrumRollCard
                    item={item}
                    index={index}
                    selectedIndex={selectedIndex}
                    onPress={() => handleScroll(index)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          </Animated.View>
        </>
      )}

      {/* FABボタン */}
      <View
        ref={fabRef}
        style={[
          styles.fabContainer,
          { right: fabPosition.right, bottom: fabPosition.bottom },
        ]}
      >
        <FAB
          icon="drums"
          color="#FFFFFF"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={isVisible ? closeDrumRoll : showDrumRoll}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  fab: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 90,
  },
  drumRollContainer: {
    position: 'absolute',
    right: 20,
    bottom: 85,
    width: width * 0.7,
    zIndex: 95,
  },
});

export default memo(DrumRollFAB); 