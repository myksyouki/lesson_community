import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../../../contexts/user';
import { LAYOUT } from '../../../constants/theme';

interface MiniMenuProps {
  onExpandPress: () => void;
  onHomePress: () => void;
  onCategoryPress: () => void;
  onSettingsPress: () => void;
  onProfilePress: () => void;
  menuOpacity: Animated.Value;
}

export default function MiniMenu({
  onExpandPress,
  onHomePress,
  onCategoryPress,
  onSettingsPress,
  onProfilePress,
  menuOpacity,
}: MiniMenuProps) {
  const { userState } = useUser();
  const router = useRouter();

  return (
    <Animated.View style={[styles.miniMenu, { opacity: menuOpacity }]}>
      {/* 展開ボタン */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={onExpandPress}>
        <Ionicons name="chevron-forward-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* ホームボタン */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={onHomePress}>
        <Ionicons name="home-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* カテゴリーボタン */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={onCategoryPress}>
        <Ionicons name="grid-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* 設定ボタン */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={onSettingsPress}>
        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* プロフィールボタン */}
      <TouchableOpacity style={styles.miniMenuItem} onPress={onProfilePress}>
        <View style={styles.miniAvatar}>
          {userState?.avatar ? (
            <Text style={styles.miniAvatarText}>{userState.name.charAt(0)}</Text>
          ) : (
            <Ionicons name="person-outline" size={18} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  miniMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: LAYOUT.MINI_MENU_WIDTH,
    height: '100%',
    backgroundColor: '#1E1E1E',
    paddingTop: 60,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#333333',
  },
  miniMenuItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7F3DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 