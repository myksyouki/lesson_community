import { InstrumentCategory } from '../types';

// 楽器カテゴリーごとのテーマカラー
export const INSTRUMENT_COLORS: Record<InstrumentCategory, string> = {
  'flute': '#7F3DFF',
  'clarinet': '#FF3D77',
  'oboe': '#3D7FFF',
  'fagotto': '#FF9F3D',
  'saxophone': '#3DFFCF',
  'horn': '#FF3D3D',
  'euphonium': '#B03DFF',
  'trumpet': '#FFD93D',
  'trombone': '#3DFFB0',
  'tuba': '#FF6B3D',
  'percussion': '#3DB0FF',
  'default': '#7F3DFF',
};

// 色の透明度を調整するヘルパー関数
export const colorWithOpacity = (color: string, opacity: number): string => {
  return color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
};

// レイアウト関連の定数
export const LAYOUT = {
  MINI_MENU_WIDTH: 70,  // 最小表示時の幅
  FULL_MENU_WIDTH: 280, // 展開表示時の幅
};

// アニメーション関連の定数
export const ANIMATION = {
  DURATION: {
    SHORT: 150,
    MEDIUM: 300,
    LONG: 500,
  },
}; 