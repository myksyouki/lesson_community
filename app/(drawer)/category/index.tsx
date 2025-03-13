/**
 * 【注意: 不採用ファイル】
 * このファイルは現在の階層構造で使用されていません。
 * 現在のナビゲーション階層は以下の通りです:
 * HOME画面 → チャンネル一覧(/channels) → スレッド一覧(/channels/[channelId]) → スレッド内チャット
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// 楽器カテゴリーのデータ
const INSTRUMENT_CATEGORIES = [
  { 
    id: 'guitar', 
    name: 'ギター', 
    icon: 'guitar', 
    description: 'アコースティックギター、エレキギター、クラシックギターなど',
    members: 1250,
    channels: 15,
    color: '#7F3DFF'
  },
  { 
    id: 'bass', 
    name: 'ベース', 
    icon: 'guitar', 
    description: 'エレキベース、ウッドベース、シンセベースなど',
    members: 850,
    channels: 10,
    color: '#FF3D77'
  },
  { 
    id: 'drums', 
    name: 'ドラム', 
    icon: 'drum', 
    description: 'ドラムセット、電子ドラム、パーカッションなど',
    members: 950,
    channels: 12,
    color: '#3D7FFF'
  },
  { 
    id: 'piano', 
    name: 'ピアノ', 
    icon: 'musical-notes', 
    description: 'グランドピアノ、電子ピアノ、キーボードなど',
    members: 1100,
    channels: 14,
    color: '#FF9F3D'
  },
  { 
    id: 'violin', 
    name: 'バイオリン', 
    icon: 'musical-notes', 
    description: 'バイオリン、ビオラ、チェロなど弦楽器',
    members: 750,
    channels: 8,
    color: '#3DFFCF'
  },
  { 
    id: 'wind', 
    name: '管楽器', 
    icon: 'musical-notes', 
    description: 'サックス、トランペット、フルートなど',
    members: 800,
    channels: 9,
    color: '#FF3D3D'
  },
];

export default function CategoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    // 検索機能の実装（後で追加）
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>楽器カテゴリー</Text>
          <Text style={styles.subtitle}>あなたの楽器を選んでコミュニティに参加しよう</Text>
        </View>

        <Searchbar
          placeholder="カテゴリーを検索"
          style={styles.searchBar}
          iconColor="#7F3DFF"
          value={searchQuery}
          onChangeText={onChangeSearch}
        />

        <View style={styles.categoriesContainer}>
          {INSTRUMENT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => router.push(`/category/${category.id}`)}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any} size={32} color="#FFFFFF" />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription} numberOfLines={2}>
                  {category.description}
                </Text>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryStatText}>
                    <Ionicons name="people-outline" size={14} /> {category.members}
                  </Text>
                  <Text style={styles.categoryStatText}>
                    <Ionicons name="chatbubbles-outline" size={14} /> {category.channels}
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
  header: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    elevation: 0,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  categoryStats: {
    flexDirection: 'row',
  },
  categoryStatText: {
    fontSize: 12,
    color: '#AAAAAA',
    marginRight: 12,
  },
});