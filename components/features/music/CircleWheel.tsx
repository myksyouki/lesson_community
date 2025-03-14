import React from 'react';
import { Dimensions } from 'react-native';
import BaseWheel, { WheelItem } from './BaseWheel';

const { width } = Dimensions.get('window');

interface CircleWheelProps {
  radius: number;
  items: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  centerX: number;
  centerY: number;
  onItemSelected?: (id: string) => void;
  selectedItemId?: string;
  defaultColor?: string;
}

export default function CircleWheel({
  radius,
  items,
  centerX,
  centerY,
  onItemSelected,
  selectedItemId,
  defaultColor = '#7F3DFF',
}: CircleWheelProps) {
  // BaseWheelで使用するためのアイテムマッピング
  const wheelItems: WheelItem[] = items.map(item => ({
    id: item.id,
    name: item.name,
    color: item.color
  }));
  
  return (
    <BaseWheel
      radius={radius}
      items={wheelItems}
      centerX={centerX}
      centerY={centerY}
      onItemSelected={onItemSelected}
      selectedItemId={selectedItemId}
      defaultColor={defaultColor}
      backgroundColor="rgba(30, 30, 30, 0.8)"
      strokeColor="#333333"
      textSize={12}
      isInnerWheel={false}
      showCenterCircle={false}
    />
  );
} 