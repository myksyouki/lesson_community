/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// 楽器カテゴリーの色定義
export const INSTRUMENT_COLORS = {
  flute: '#7F3DFF',
  clarinet: '#FF3D77',
  oboe: '#3D7FFF',
  fagotto: '#FF9F3D',
  saxophone: '#3DFFCF',
  horn: '#FF3D3D',
  euphonium: '#B03DFF',
  trumpet: '#FFD93D',
  trombone: '#3DFFB0',
  tuba: '#FF6B3D',
  percussion: '#3DB0FF',
};

// 音楽的なカラーパレット
export const MUSIC_COLORS = {
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
