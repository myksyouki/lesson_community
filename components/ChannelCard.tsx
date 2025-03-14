import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { channelService } from '../firebase/services';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withDelay, Easing } from 'react-native-reanimated';

interface ChannelCardProps {
  id: string;
  name: string;
  description: string;
  icon?: any;
  color?: string;
  membersCount?: number;
  threadsCount?: number;
}

export default function ChannelCard({ 
  id, 
  name, 
  description, 
  icon = 'chatbubbles', 
  color = '#7F3DFF',
  membersCount = 0,
  threadsCount = 0
}: ChannelCardProps) {
  const [threadCount, setThreadCount] = useState(threadsCount);
  
  // アニメーション用の値
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const iconScale = useSharedValue(1);
  
  // Firebaseからリアルタイムでスレッド数を取得
  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        const channelData = await channelService.getChannelById(id);
        if (channelData) {
          setThreadCount(channelData.threadCount);
        }
      } catch (error) {
        console.error('チャンネルデータ取得エラー:', error);
      }
    };
    
    fetchChannelData();
    
    // リアルタイム更新のためのリスナーを設定
    const unsubscribe = channelService.subscribeToChannel(id, (channel) => {
      if (channel) {
        setThreadCount(channel.threadCount);
      }
    });
    
    // アイコンのアニメーション
    iconRotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }), 
      -1, // 無限に繰り返す
      false
    );
    
    return () => unsubscribe();
  }, [id]);
  
  // タップしたときのアニメーション
  const handlePressIn = () => {
    scale.value = withSpring(0.97);
    opacity.value = withTiming(0.9, { duration: 100 });
    iconScale.value = withSpring(1.2);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 150 });
    iconScale.value = withDelay(100, withSpring(1));
  };
  
  // アニメーションスタイル
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: iconScale.value },
        { rotateZ: `${iconRotation.value}deg` }
      ],
    };
  });
  
  return (
    <Animated.View style={animatedCardStyle}>
      <TouchableOpacity 
        style={styles.container}
        onPress={() => router.push(`/channels/${id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient 
          colors={['rgba(40, 40, 60, 0.8)', 'rgba(20, 20, 30, 0.8)']} 
          style={styles.gradient}
        >
          <View style={styles.headerContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}30` }]}>
              <Animated.View style={animatedIconStyle}>
                <Ionicons name={icon} size={20} color={color} />
              </Animated.View>
            </View>
            <View style={[styles.indicator, { backgroundColor: color }]} />
          </View>
          
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color="#999999" />
              <Text style={styles.statText}>{membersCount}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="chatbubbles-outline" size={16} color="#999999" />
              <Text style={styles.statText}>{threadCount}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 6,
    height: 36,
    borderRadius: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: '#999999',
    fontSize: 14,
    marginLeft: 4,
  },
}); 