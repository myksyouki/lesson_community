import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../../../contexts/user';
import { useData } from '../../../contexts/data';
import { LAYOUT, ANIMATION } from '../../../constants/theme';
import { RecentThread, FavoriteThread } from '../../../types';
import MiniMenu from './MiniMenu';
import FullMenu from './FullMenu';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export default function SideMenu({ isOpen, onClose, isExpanded: propIsExpanded, onExpandChange }: SideMenuProps) {
  const router = useRouter();
  
  // 状態管理
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChannels, setExpandedChannels] = useState<string[]>([]);
  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [favoriteThreads, setFavoriteThreads] = useState<FavoriteThread[]>([]);
  
  // 外部からのisExpandedプロパティの変更を監視
  useEffect(() => {
    if (propIsExpanded !== undefined) {
      setIsExpanded(propIsExpanded);
    }
  }, [propIsExpanded]);
  
  // アニメーション用の値
  const menuWidth = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  
  // スワイプ検出用のPanResponder
  const menuPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // ミニメニューが表示されている時のみ、右へのスワイプを検出
        return isOpen && !isExpanded && gestureState.dx > 20 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderGrant: () => {
        // スワイプ開始
      },
      onPanResponderMove: (_, gestureState) => {
        // スワイプ中
        if (gestureState.dx > 50) {
          setIsExpanded(true);
        }
      },
      onPanResponderRelease: () => {
        // スワイプ終了
      },
    })
  ).current;
  
  // サンプルデータ（実際の実装では、AsyncStorageなどから取得）
  useEffect(() => {
    // 最近訪れたスレッドのサンプルデータ
    setRecentThreads([
      { id: '1', title: 'フルートの持ち方について', channelId: 'flute-beginners', channelName: '初心者質問', timestamp: Date.now() - 3600000 },
      { id: '2', title: 'クラリネットのリード選び', channelId: 'clarinet-general', channelName: 'クラリネット全般', timestamp: Date.now() - 7200000 },
    ]);
    
    // お気に入りスレッドのサンプルデータ
    setFavoriteThreads([
      { id: '3', title: 'フルートのビブラート習得法', channelId: 'flute-advanced', channelName: 'フルート上級者' },
      { id: '4', title: 'アルトサックスの初心者におすすめの曲', channelId: 'saxophone-jazz', channelName: 'ジャズサックス' },
    ]);
  }, []);
  
  // メニューの表示/非表示のアニメーション
  useEffect(() => {
    if (isOpen) {
      // メニューを表示
      Animated.parallel([
        Animated.timing(menuWidth, {
          toValue: isExpanded ? LAYOUT.FULL_MENU_WIDTH : LAYOUT.MINI_MENU_WIDTH,
          duration: ANIMATION.DURATION.MEDIUM,
          useNativeDriver: false,
        }),
        Animated.timing(menuOpacity, {
          toValue: 1,
          duration: ANIMATION.DURATION.MEDIUM,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // メニューを非表示
      Animated.parallel([
        Animated.timing(menuWidth, {
          toValue: 0,
          duration: ANIMATION.DURATION.MEDIUM,
          useNativeDriver: false,
        }),
        Animated.timing(menuOpacity, {
          toValue: 0,
          duration: ANIMATION.DURATION.MEDIUM,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isOpen, isExpanded, menuWidth, menuOpacity]);
  
  // 展開/折りたたみの切り替え
  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // 親コンポーネントに変更を通知
    if (onExpandChange) {
      onExpandChange(newExpandedState);
    }
  };
  
  // チャンネルの展開/折りたたみの切り替え
  const toggleChannel = (channelId: string) => {
    setExpandedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };
  
  // スレッドをタップしたときの処理
  const handleThreadPress = (channelId: string, threadId: string) => {
    // スレッド画面に遷移
    router.push(`/threads/${channelId}/${threadId}`);
    
    // メニューを閉じる
    onClose();
    
    // 最近訪れたスレッドに追加（実際の実装では、AsyncStorageなどに保存）
    // ここではモックとして、ステートを更新するだけ
    console.log(`Navigate to thread ${threadId} in channel ${channelId}`);
  };
  
  // お気に入りボタンをタップしたときの処理
  const handleFavoritePress = (channelId: string, threadId: string) => {
    // お気に入りの追加/削除（実際の実装では、AsyncStorageなどに保存）
    // ここではモックとして、コンソールにログを出力するだけ
    console.log(`Toggle favorite for thread ${threadId} in channel ${channelId}`);
  };
  
  // チャンネルをタップしたときの処理
  const handleChannelPress = (channelId: string) => {
    // チャンネル画面に遷移
    router.push(`/channels/${channelId}`);
    
    // メニューを閉じる
    onClose();
  };
  
  // 検索ボタンをタップしたときの処理
  const handleSearch = () => {
    // 検索画面に遷移（実際の実装では、検索画面に遷移する）
    // ここではモックとして、コンソールにログを出力するだけ
    console.log(`Search for: ${searchQuery}`);
    
    // メニューを閉じる
    onClose();
  };
  
  // 設定画面に遷移
  const goToSettings = () => {
    router.push('/settings');
    onClose();
  };
  
  // プロフィール画面に遷移
  const goToProfile = () => {
    router.push('/profile');
    onClose();
  };
  
  // ホーム画面に遷移
  const goToHome = () => {
    router.push('/');
    onClose();
  };
  
  // カテゴリー画面に遷移
  const goToCategory = () => {
    router.push('/category');
    onClose();
  };
  
  return (
    <View style={styles.container} {...menuPanResponder.panHandlers}>
      {/* ミニメニュー */}
      {isOpen && !isExpanded && (
        <MiniMenu
          onExpandPress={toggleExpand}
          onHomePress={goToHome}
          onCategoryPress={goToCategory}
          onSettingsPress={goToSettings}
          onProfilePress={goToProfile}
          menuOpacity={menuOpacity}
        />
      )}
      
      {/* フルメニュー */}
      {isOpen && isExpanded && (
        <FullMenu
          onCollapsePress={toggleExpand}
          onHomePress={goToHome}
          onCategoryPress={goToCategory}
          onSettingsPress={goToSettings}
          onProfilePress={goToProfile}
          onChannelPress={handleChannelPress}
          onThreadPress={handleThreadPress}
          onFavoritePress={handleFavoritePress}
          onSearch={handleSearch}
          menuWidth={menuWidth}
          menuOpacity={menuOpacity}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          expandedChannels={expandedChannels}
          toggleChannel={toggleChannel}
          recentThreads={recentThreads}
          favoriteThreads={favoriteThreads}
        />
      )}
      
      {/* 背景オーバーレイ（メニューが開いているときのみ表示） */}
      {isOpen && (
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: menuOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }
          ]}
          onTouchEnd={onClose}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  overlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    zIndex: -1,
  },
}); 