import React, { useState } from 'react';
import DrumRollFAB from './DrumRollFAB';
import CircleOfFifthsMenu from './CircleOfFifthsMenu';

interface MusicFABProps {
  onPress?: () => void;
  isThreadScreen?: boolean;
  isChannelScreen?: boolean;
}

export default function MusicFAB({ onPress, isThreadScreen = false, isChannelScreen = false }: MusicFABProps) {
  const [circleMenuVisible, setCircleMenuVisible] = useState(false);
  
  // 短押し時の処理 - CircleOfFifthsMenuを表示
  const handlePress = () => {
    setCircleMenuVisible(true);
    
    // 外部から渡されたonPressがあれば実行
    if (onPress) {
      onPress();
    }
  };
  
  // CircleOfFifthsMenuを閉じる
  const handleCloseCircleMenu = () => {
    setCircleMenuVisible(false);
  };
  
  return (
    <>
      {/* CircleOfFifthsMenu */}
      <CircleOfFifthsMenu 
        visible={circleMenuVisible} 
        onClose={handleCloseCircleMenu} 
      />
      
      {/* DrumRollFAB - 短押しはCircleOfFifthsMenuを開く、長押しは元の機能 */}
      <DrumRollFAB 
        onPress={handlePress}
        isThreadScreen={isThreadScreen}
        isChannelScreen={isChannelScreen}
      />
    </>
  );
} 