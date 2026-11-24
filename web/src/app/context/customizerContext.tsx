'use client';
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import config from './config';

export interface CustomizerContextState {
  activeDir: string;
  setActiveDir: (dir: string) => void;
  activeMode: 'light' | 'dark';
  setActiveMode: (mode: 'light' | 'dark') => void;
  toggleMode: () => void;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  activeLayout: string;
  setActiveLayout: (layout: string) => void;
  isCardShadow: boolean;
  setIsCardShadow: (shadow: boolean) => void;
  isLayout: string;
  setIsLayout: (layout: string) => void;
  isBorderRadius: number;
  setIsBorderRadius: (radius: number) => void;
  isCollapse: string;
  setIsCollapse: (collapse: string) => void;
  isSidebarHover: boolean;
  setIsSidebarHover: (isHover: boolean) => void;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (isMobileSidebar: boolean) => void;
}

const defaultState: CustomizerContextState = {
  activeDir: config.activeDir,
  setActiveDir: () => {},
  activeMode: 'light',
  setActiveMode: () => {},
  toggleMode: () => {},
  activeTheme: config.activeTheme,
  setActiveTheme: () => {},
  activeLayout: config.activeLayout,
  setActiveLayout: () => {},
  isCardShadow: config.isCardShadow,
  setIsCardShadow: () => {},
  isLayout: config.isLayout,
  setIsLayout: () => {},
  isBorderRadius: config.isBorderRadius,
  setIsBorderRadius: () => {},
  isCollapse: config.isCollapse,
  setIsCollapse: () => {},
  isSidebarHover: false,
  setIsSidebarHover: () => {},
  isMobileSidebar: false,
  setIsMobileSidebar: () => {},
};

export const CustomizerContext = createContext<CustomizerContextState>(defaultState);

interface CustomizerContextProps {
  children: ReactNode;
}

export const CustomizerContextProvider: React.FC<CustomizerContextProps> = ({ children }) => {
  const [activeDir, setActiveDir] = useState<string>(config.activeDir);
  const [activeMode, setActiveModeState] = useState<'light' | 'dark'>('light');
  const [activeTheme, setActiveThemeState] = useState<string>(config.activeTheme);
  const [activeLayout, setActiveLayout] = useState<string>(config.activeLayout);
  const [isCardShadow, setIsCardShadow] = useState<boolean>(config.isCardShadow);
  const [isLayout, setIsLayout] = useState<string>(config.isLayout);
  const [isBorderRadius, setIsBorderRadius] = useState<number>(config.isBorderRadius);
  const [isCollapse, setIsCollapse] = useState<string>(config.isCollapse);
  const [isSidebarHover, setIsSidebarHover] = useState<boolean>(false);
  const [isMobileSidebar, setIsMobileSidebar] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem('notifyfin-theme-mode');
      if (savedMode === 'dark' || savedMode === 'light') {
        setActiveModeState(savedMode);
      }
      const savedTheme = window.localStorage.getItem('notifyfin-color-theme');
      if (savedTheme) {
        setActiveThemeState(savedTheme);
      }
    } catch {
      // Ignore storage errors in private browsing
    }
  }, []);

  const setActiveMode = (mode: 'light' | 'dark') => {
    setActiveModeState(mode);
    try {
      window.localStorage.setItem('notifyfin-theme-mode', mode);
    } catch {}
  };

  const toggleMode = () => {
    setActiveMode(activeMode === 'light' ? 'dark' : 'light');
  };

  const setActiveTheme = (theme: string) => {
    setActiveThemeState(theme);
    try {
      window.localStorage.setItem('notifyfin-color-theme', theme);
    } catch {}
  };

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(activeMode);
    document.documentElement.setAttribute('dir', activeDir);
    document.documentElement.setAttribute('data-color-theme', activeTheme);
    document.documentElement.setAttribute('data-layout', activeLayout);
    document.documentElement.setAttribute('data-boxed-layout', isLayout);
    document.documentElement.setAttribute('data-sidebar-type', isCollapse);
  }, [activeMode, activeDir, activeTheme, activeLayout, isLayout, isCollapse]);

  return (
    <CustomizerContext.Provider
      value={{
        activeDir,
        setActiveDir,
        activeMode,
        setActiveMode,
        toggleMode,
        activeTheme,
        setActiveTheme,
        activeLayout,
        setActiveLayout,
        isCardShadow,
        setIsCardShadow,
        isLayout,
        setIsLayout,
        isBorderRadius,
        setIsBorderRadius,
        isCollapse,
        setIsCollapse,
        isSidebarHover,
        setIsSidebarHover,
        isMobileSidebar,
        setIsMobileSidebar,
      }}
    >
      {children}
    </CustomizerContext.Provider>
  );
};
