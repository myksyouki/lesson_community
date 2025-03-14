import React, { createContext, useContext, useState } from 'react';

// サイドメニューのコンテキスト型定義
type SideMenuContextType = {
  isMenuOpen: boolean;
  isMenuExpanded: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  setMenuExpanded: (expanded: boolean) => void;
};

// デフォルト値を持つコンテキスト作成
const SideMenuContext = createContext<SideMenuContextType>({
  isMenuOpen: false,
  isMenuExpanded: false,
  openMenu: () => {},
  closeMenu: () => {},
  toggleMenu: () => {},
  setMenuExpanded: () => {},
});

// サイドメニューコンテキストのプロバイダーコンポーネント
export const SideMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  // メニューを開く
  const openMenu = () => {
    setIsMenuOpen(true);
  };

  // メニューを閉じる
  const closeMenu = () => {
    setIsMenuExpanded(false);
    setIsMenuOpen(false);
  };

  // メニューの開閉を切り替える
  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // メニュー展開状態を設定
  const setMenuExpanded = (expanded: boolean) => {
    setIsMenuExpanded(expanded);
  };

  // コンテキスト値
  const contextValue = {
    isMenuOpen,
    isMenuExpanded,
    openMenu,
    closeMenu,
    toggleMenu,
    setMenuExpanded,
  };

  return (
    <SideMenuContext.Provider value={contextValue}>
      {children}
    </SideMenuContext.Provider>
  );
};

// サイドメニューコンテキストを使用するためのカスタムフック
export const useSideMenu = () => useContext(SideMenuContext); 