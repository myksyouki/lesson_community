import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// デフォルトのテーマカラー
const defaultColors = {
  light: {
    primary: '#7F3DFF',
    secondary: '#B03DFF',
    background: '#FFFFFF',
    card: '#F8F9FA',
    text: '#212121',
    border: '#E0E0E0',
    notification: '#FF3D77',
    success: '#00C853',
    warning: '#FFAB00',
    error: '#FF5252',
  },
  dark: {
    primary: '#7F3DFF',
    secondary: '#B03DFF',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
    notification: '#FF3D77',
    success: '#00C853',
    warning: '#FFAB00',
    error: '#FF5252',
  },
};

// テーマの型定義
export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  success: string;
  warning: string;
  error: string;
}

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

// コンテキストの作成
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// コンテキストプロバイダーコンポーネント
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // システムのカラースキームを取得
  const systemColorScheme = useColorScheme() as ThemeType;
  const [theme, setTheme] = useState<ThemeType>(systemColorScheme || 'light');

  // システムのカラースキームが変更されたら自動的に適用
  useEffect(() => {
    if (systemColorScheme) {
      setTheme(systemColorScheme);
    }
  }, [systemColorScheme]);

  // テーマの切り替え
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const colors = defaultColors[theme];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// カスタムフック
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 