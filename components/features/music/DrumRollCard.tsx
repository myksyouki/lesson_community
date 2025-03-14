import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface DrumRollCardItem {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  gradient?: [string, string];
}

interface DrumRollCardProps {
  item: DrumRollCardItem;
  index: number;
  selectedIndex: number;
  onPress: (item: DrumRollCardItem) => void;
}

function DrumRollCard({ item, index, selectedIndex, onPress }: DrumRollCardProps) {
  const isSelected = index === selectedIndex;
  
  // デフォルトのグラデーション
  const defaultGradient: [string, string] = ['#7F3DFF', '#B03DFF'];
  const gradientColors = item.gradient || defaultGradient;
  
  return (
    <TouchableOpacity 
      style={[
        styles.cardContainer,
        isSelected ? styles.selectedCard : styles.normalCard,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.card,
          isSelected ? styles.selectedCardInner : styles.normalCardInner,
        ]}
      >
        <View style={styles.cardContent}>
          {item.icon && (
            <Ionicons 
              name={item.icon as any} 
              size={isSelected ? 24 : 18} 
              color="#FFFFFF" 
              style={styles.icon}
            />
          )}
          <Text style={[
            styles.cardText,
            isSelected ? styles.selectedCardText : styles.normalCardText,
          ]}>
            {item.title}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 5,
    marginHorizontal: 10,
    height: 55,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  card: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  cardText: {
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  selectedCard: {
    transform: [{ scale: 1.05 }],
    zIndex: 1,
  },
  normalCard: {
    opacity: 0.8,
  },
  selectedCardInner: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  normalCardInner: {
    borderWidth: 0,
  },
  selectedCardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  normalCardText: {
    fontSize: 14,
  },
});

export default memo(DrumRollCard); 