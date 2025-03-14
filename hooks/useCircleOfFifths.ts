import { useState, useEffect } from 'react';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useData } from '@/contexts/data';
import { useUser } from '@/contexts/user';

// 音楽的なカラーパレット
export const COLORS = {
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

interface UseCircleOfFifthsProps {
  visible: boolean;
  onClose: () => void;
}

export function useCircleOfFifths({ visible, onClose }: UseCircleOfFifthsProps) {
  const router = useRouter();
  const { channels } = useData();
  const { userState } = useUser();
  
  // アニメーション用の値
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const [isClosing, setIsClosing] = useState(false);
  
  // チャンネルとスレッドの選択状態
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(undefined);
  
  // ユーザーが選択した楽器カテゴリー
  const activeCategory = userState?.selectedCategories?.[0] || 'flute';
  
  // 選択した楽器カテゴリーのチャンネルのみをフィルタリング
  const categoryChannels = channels?.filter(channel => channel.category === activeCategory) || [];
  
  // 表示するチャンネル（最大7つ + More）
  const displayChannels = categoryChannels.slice(0, 7);
  
  // お気に入りスレッド - 選択したチャンネルのスレッドから
  const favoriteThreads = selectedChannelId
    ? categoryChannels.find(channel => channel.id === selectedChannelId)?.threads.slice(0, 6) || []
    : [];
  
  // モーダルが表示された時のアニメーション
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12 });
      opacity.value = withTiming(1, { duration: 300 });
      
      // デフォルトで最初のチャンネルを選択
      if (displayChannels.length > 0 && !selectedChannelId) {
        setSelectedChannelId(displayChannels[0].id);
      }
    } else {
      // モーダルが非表示の時はリセット
      setSelectedChannelId(undefined);
      setSelectedThreadId(undefined);
      setIsClosing(false);
    }
  }, [visible, displayChannels]);
  
  // モーダルを閉じる処理
  const handleClose = () => {
    setIsClosing(true);
    scale.value = withTiming(0.3, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 }, () => {
      // アニメーション完了後に実際にモーダルを閉じる
      onClose();
    });
  };
  
  // チャンネルがタップされた時の処理
  const handleChannelSelected = (channelId: string) => {
    setSelectedChannelId(channelId);
    setSelectedThreadId(undefined);
  };
  
  // スレッドがタップされた時の処理
  const handleThreadSelected = (threadId: string) => {
    setSelectedThreadId(threadId);
  };
  
  // チャンネル画面に遷移
  const handleChannelPress = (channelId: string) => {
    handleClose();
    // 少し遅延を入れて、閉じるアニメーションが見えるようにする
    setTimeout(() => {
      router.push(`/channels/${channelId}`);
    }, 300);
  };
  
  // スレッド画面に遷移
  const handleThreadPress = (channelId: string, threadId: string) => {
    handleClose();
    // 少し遅延を入れて、閉じるアニメーションが見えるようにする
    setTimeout(() => {
      router.push(`/threads/${channelId}/${threadId}`);
    }, 300);
  };
  
  // もっと見るボタンが押された時の処理
  const handleMoreChannelsPress = () => {
    handleClose();
    // 少し遅延を入れて、閉じるアニメーションが見えるようにする
    setTimeout(() => {
      router.push(`/category/${activeCategory}`);
    }, 300);
  };
  
  // CircleWheelコンポーネント用のチャンネルアイテムを作成
  const channelItems = displayChannels.map((channel, index) => ({
    id: channel.id,
    name: channel.name,
    color: COLORS.channelColors[index % COLORS.channelColors.length],
  }));
  
  // InnerWheelコンポーネント用のスレッドアイテムを作成
  const threadItems = favoriteThreads.map((thread, index) => ({
    id: thread.id,
    title: thread.title,
    color: COLORS.channelColors[(index + 2) % COLORS.channelColors.length],
  }));
  
  // アニメーションスタイル
  const containerStyle = {
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  };
  
  return {
    channelItems,
    threadItems,
    selectedChannelId,
    selectedThreadId,
    containerStyle,
    isClosing,
    handleClose,
    handleChannelSelected,
    handleThreadSelected,
    handleChannelPress,
    handleThreadPress,
    handleMoreChannelsPress,
  };
} 