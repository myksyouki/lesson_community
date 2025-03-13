import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// チャンネルのデータ
const CHANNELS = {
  guitar: [
    { id: 'general', name: '一般', icon: 'chatbubbles-outline', description: 'ギターに関する一般的な話題', members: 850, threads: 120, color: '#7F3DFF' },
    { id: 'techniques', name: 'テクニック', icon: 'hand-left-outline', description: 'ギターテクニックの共有と質問', members: 720, threads: 95, color: '#FF3D77' },
    { id: 'gear', name: '機材', icon: 'hardware-chip-outline', description: 'ギターやアンプなどの機材について', members: 680, threads: 85, color: '#3D7FFF' },
    { id: 'songs', name: '曲', icon: 'musical-notes-outline', description: 'ギターで弾ける曲の紹介と練習方法', members: 750, threads: 110, color: '#FF9F3D' },
  ],
  bass: [
    { id: 'general', name: '一般', icon: 'chatbubbles-outline', description: 'ベースに関する一般的な話題', members: 650, threads: 80, color: '#7F3DFF' },
    { id: 'techniques', name: 'テクニック', icon: 'hand-left-outline', description: 'ベーステクニックの共有と質問', members: 520, threads: 65, color: '#FF3D77' },
    { id: 'gear', name: '機材', icon: 'hardware-chip-outline', description: 'ベースやアンプなどの機材について', members: 480, threads: 55, color: '#3D7FFF' },
  ],
  drums: [
    { id: 'general', name: '一般', icon: 'chatbubbles-outline', description: 'ドラムに関する一般的な話題', members: 750, threads: 90, color: '#7F3DFF' },
    { id: 'techniques', name: 'テクニック', icon: 'hand-left-outline', description: 'ドラムテクニックの共有と質問', members: 620, threads: 75, color: '#FF3D77' },
    { id: 'gear', name: '機材', icon: 'hardware-chip-outline', description: 'ドラムセットや電子ドラムについて', members: 580, threads: 70, color: '#3D7FFF' },
  ],
  piano: [
    { id: 'general', name: '一般', icon: 'chatbubbles-outline', description: 'ピアノに関する一般的な話題', members: 800, threads: 110, color: '#7F3DFF' },
    { id: 'techniques', name: 'テクニック', icon: 'hand-left-outline', description: 'ピアノテクニックの共有と質問', members: 680, threads: 95, color: '#FF3D77' },
    { id: 'gear', name: '機材', icon: 'hardware-chip-outline', description: 'ピアノや電子キーボードについて', members: 620, threads: 85, color: '#3D7FFF' },
    { id: 'classical', name: 'クラシック', icon: 'musical-notes-outline', description: 'クラシック曲の演奏と解釈', members: 580, threads: 70, color: '#FF9F3D' },
  ],
  violin: [
    { id: 'general', name: '一般', icon: 'chatbubbles-outline', description: 'バイオリンに関する一般的な話題', members: 550, threads: 70, color: '#7F3DFF' },
    { id: 'techniques', name: 'テクニック', icon: 'hand-left-outline', description: 'バイオリンテクニックの共有と質問', members: 480, threads: 60, color: '#FF3D77' },
    { id: 'gear', name: '機材', icon: 'hardware-chip-outline', description: 'バイオリンや弓などについて', members: 420, threads: 50, color: '#3D7FFF' },
  ],
  wind: [
    { id: 'general', name: '一般', icon: 'chatbubbles-outline', description: '管楽器に関する一般的な話題', members: 600, threads: 75, color: '#7F3DFF' },
    { id: 'techniques', name: 'テクニック', icon: 'hand-left-outline', description: '管楽器テクニックの共有と質問', members: 520, threads: 65, color: '#FF3D77' },
    { id: 'gear', name: '機材', icon: 'hardware-chip-outline', description: '管楽器の種類や選び方について', members: 480, threads: 60, color: '#3D7FFF' },
  ],
};

// 楽器の背景画像
const INSTRUMENT_BACKGROUNDS = {
  guitar: require('../../../assets/images/guitar-bg.jpg'),
  bass: require('../../../assets/images/bass-bg.jpg'),
  drums: require('../../../assets/images/drums-bg.jpg'),
  piano: require('../../../assets/images/piano-bg.jpg'),
  violin: require('../../../assets/images/violin-bg.jpg'),
  wind: require('../../../assets/images/wind-bg.jpg'),
};

// 楽器の説明
const INSTRUMENT_DESCRIPTIONS = {
  guitar: 'ギターに関するディスカッションや情報を共有しましょう。初心者から上級者まで、あらゆるレベルのギタリストが集まるコミュニティです。',
  bass: 'ベースに関するディスカッションや情報を共有しましょう。グルーヴィーなベースラインから技術的なテクニックまで、様々な話題で盛り上がりましょう。',
  drums: 'ドラムに関するディスカッションや情報を共有しましょう。リズムの要として、バンドを支えるドラマーのためのコミュニティです。',
  piano: 'ピアノに関するディスカッションや情報を共有しましょう。クラシックからジャズ、ポップスまで、幅広いジャンルのピアニストが集まっています。',
  violin: 'バイオリンに関するディスカッションや情報を共有しましょう。クラシカルな演奏技術からモダンなアプローチまで、弦楽器奏者のための場所です。',
  wind: '管楽器に関するディスカッションや情報を共有しましょう。サックス、トランペット、フルートなど、あらゆる管楽器奏者のためのコミュニティです。',
};

export default function InstrumentScreen() {
  const { instrument } = useLocalSearchParams();
  const router = useRouter();
  
  // 型安全のために文字列に変換
  const instrumentStr = typeof instrument === 'string' ? instrument : '';
  
  // 該当する楽器のチャンネル一覧を取得
  const channels = CHANNELS[instrumentStr as keyof typeof CHANNELS] || [];
  
  // 該当する楽器の説明を取得
  const description = INSTRUMENT_DESCRIPTIONS[instrumentStr as keyof typeof INSTRUMENT_DESCRIPTIONS] || '';
  
  // 該当する楽器の背景画像を取得
  const backgroundImage = INSTRUMENT_BACKGROUNDS[instrumentStr as keyof typeof INSTRUMENT_BACKGROUNDS];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ImageBackground 
          source={backgroundImage} 
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImage}
        >
          <View style={styles.headerOverlay}>
            <Text style={styles.title}>{instrumentStr} コミュニティ</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={20} color="#FFFFFF" />
                <Text style={styles.statText}>
                  {channels.reduce((sum, channel) => sum + channel.members, 0)}人
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
                <Text style={styles.statText}>
                  {channels.reduce((sum, channel) => sum + channel.threads, 0)}スレッド
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>チャンネル</Text>
        </View>

        <View style={styles.channelsContainer}>
          {channels.map((channel) => (
            <TouchableOpacity
              key={channel.id}
              style={styles.channelCard}
              onPress={() => router.push(`/category/${instrumentStr}/${channel.id}`)}
            >
              <View style={[styles.channelIconContainer, { backgroundColor: channel.color }]}>
                <Ionicons name={channel.icon as any} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.channelContent}>
                <Text style={styles.channelName}>{channel.name}</Text>
                <Text style={styles.channelDescription} numberOfLines={2}>
                  {channel.description}
                </Text>
                <View style={styles.channelStats}>
                  <Text style={styles.channelStatText}>
                    <Ionicons name="people-outline" size={14} /> {channel.members}
                  </Text>
                  <Text style={styles.channelStatText}>
                    <Ionicons name="chatbubbles-outline" size={14} /> {channel.threads}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#AAAAAA" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  headerBackground: {
    height: 200,
  },
  headerBackgroundImage: {
    opacity: 0.5,
  },
  headerOverlay: {
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  descriptionContainer: {
    padding: 16,
    backgroundColor: '#1E1E2E',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  channelsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  channelCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  channelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  channelContent: {
    flex: 1,
  },
  channelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  channelStats: {
    flexDirection: 'row',
  },
  channelStatText: {
    fontSize: 12,
    color: '#AAAAAA',
    marginRight: 12,
  },
});