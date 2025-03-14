// 楽器カテゴリー別カラーテーマの定義

// カテゴリー別カラーテーマのマッピング
export const CATEGORY_THEMES: { [key: string]: string } = {
  'flute': 'classical',
  'clarinet': 'classical',
  'oboe': 'classical',
  'fagotto': 'classical',
  'trumpet': 'jazz',
  'saxophone': 'jazz',
  'horn': 'jazz',
  'euphonium': 'jazz',
  'percussion': 'rock',
  'trombone': 'rock',
  'tuba': 'rock',
  'piano': 'classical',
  'guitar': 'rock',
  'bass': 'jazz',
  'violin': 'classical',
  'vocals': 'jazz',
  'general': 'default',
  'default': 'default',
};

// 音楽テーマ定義
export const MUSIC_THEMES = {
  'jazz': {
    primary: ['#2D3047', '#1B1F30'],
    secondary: ['#FFB703', '#FD9E02'],
    accent: '#FFB703',
    patternOpacity: 0.05,
  },
  'classical': {
    primary: ['#2D3047', '#151928'],
    secondary: ['#8A4FFF', '#7F3DFF'],
    accent: '#8A4FFF',
    patternOpacity: 0.04,
  },
  'rock': {
    primary: ['#2A2B2A', '#1A1B1A'],
    secondary: ['#F45866', '#F44E5E'],
    accent: '#F45866',
    patternOpacity: 0.06,
  },
  'electronic': {
    primary: ['#292F36', '#1D2228'],
    secondary: ['#4ECDC4', '#45C1B8'],
    accent: '#4ECDC4',
    patternOpacity: 0.05,
  },
  'default': {
    primary: ['#2D3047', '#1A1B2B'],
    secondary: ['#6C72CB', '#5B60C2'],
    accent: '#6C72CB',
    patternOpacity: 0.04,
  },
} as const;

// テーマを取得する関数
export function getCategoryTheme(category: string): keyof typeof MUSIC_THEMES {
  const theme = CATEGORY_THEMES[category];
  // 型を厳密に定義し、undefinedの場合は'default'を返す
  return (theme as keyof typeof MUSIC_THEMES) || 'default';
}

// カテゴリーテーマの型定義
export type MusicTheme = 'classical' | 'jazz' | 'rock' | 'electronic' | 'default';

// デフォルトのテーマを取得する関数
export const getThemeForCategory = (category?: string): MusicTheme => {
  if (!category) return 'default';
  return getCategoryTheme(category);
};

// 楽器カテゴリーのデータ定義
export const INSTRUMENT_CATEGORIES = [
  { id: 'flute', name: 'フルート', icon: 'musical-notes', color: '#7F3DFF' },
  { id: 'clarinet', name: 'クラリネット', icon: 'musical-notes', color: '#FF3D77' },
  { id: 'oboe', name: 'オーボエ', icon: 'musical-notes', color: '#3D7FFF' },
  { id: 'fagotto', name: 'ファゴット', icon: 'musical-notes', color: '#FF9F3D' },
  { id: 'saxophone', name: 'サクソフォン', icon: 'musical-notes', color: '#3DFFCF' },
  { id: 'horn', name: 'ホルン', icon: 'musical-notes', color: '#FF3D3D' },
  { id: 'euphonium', name: 'ユーフォニアム', icon: 'musical-notes', color: '#B03DFF' },
  { id: 'trumpet', name: 'トランペット', icon: 'musical-notes', color: '#FFD93D' },
  { id: 'trombone', name: 'トロンボーン', icon: 'musical-notes', color: '#3DFFB0' },
  { id: 'tuba', name: 'チューバ', icon: 'musical-notes', color: '#FF6B3D' },
  { id: 'percussion', name: 'パーカッション', icon: 'musical-notes', color: '#3DB0FF' },
  { id: 'piano', name: 'ピアノ', icon: 'musical-notes', color: '#7F3DFF' },
  { id: 'guitar', name: 'ギター', icon: 'musical-notes', color: '#FF3D77' },
  { id: 'bass', name: 'ベース', icon: 'musical-notes', color: '#3D7FFF' },
  { id: 'violin', name: 'バイオリン', icon: 'musical-notes', color: '#FF9F3D' },
  { id: 'vocals', name: 'ボーカル', icon: 'musical-notes', color: '#3DFFCF' },
  { id: 'general', name: '一般', icon: 'musical-notes', color: '#7F7F7F' },
]; 