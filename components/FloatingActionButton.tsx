import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  backgroundColor?: string;
  position?: { bottom: number; right: number };
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  backgroundColor = '#6C72CB',
  position = { bottom: 20, right: 20 },
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fabContainer,
        { backgroundColor, bottom: position.bottom, right: position.right },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon as any} size={24} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    position: 'absolute',
  },
});

export default FloatingActionButton; 