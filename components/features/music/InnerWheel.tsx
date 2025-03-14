import React from 'react';
import { Dimensions } from 'react-native';
import BaseWheel, { WheelItem } from './BaseWheel';

const { width } = Dimensions.get('window');

interface InnerWheelProps {
  radius: number;
  items: Array<{
    id: string;
    title: string;
    color?: string;
  }>;
  centerX: number;
  centerY: number;
  onItemSelected?: (id: string) => void;
  selectedItemId?: string;
  defaultColor?: string;
}

export default function InnerWheel({
  radius,
  items,
  centerX,
  centerY,
  onItemSelected,
  selectedItemId,
  defaultColor = '#3D7FFF',
}: InnerWheelProps) {
  // BaseWheelで使用するためのアイテムマッピング
  const wheelItems: WheelItem[] = items.map(item => ({
    id: item.id,
    name: item.title,  // 表示用にnameフィールドにtitleをセット
    title: item.title, // オリジナルのtitleも保持
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
      backgroundColor="rgba(30, 30, 40, 0.9)"
      strokeColor="#444444"
      textSize={10}
      isInnerWheel={true}
      showCenterCircle={true}
    />
  );
} 