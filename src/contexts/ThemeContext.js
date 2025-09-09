import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Modern shadcn-inspired light colors with soft pastels
const lightColors = {
  primary: '#3b82f6',        // blue-500
  secondary: '#60a5fa',      // blue-400
  accent: '#06b6d4',         // cyan-500
  background: '#f9fafb',     // gray-50
  surface: '#ffffff',        // white
  card: '#ffffff',           // white
  text: '#1e293b',           // slate-800
  textSecondary: '#64748b',  // slate-500
  textMuted: '#94a3b8',      // slate-400
  border: '#e2e8f0',         // slate-200
  success: '#22c55e',        // green-500
  warning: '#f59e0b',        // amber-500
  error: '#ef4444',          // red-500
  destructive: '#dc2626',    // red-600
  muted: '#f1f5f9',          // slate-100
  ring: '#3b82f6',           // blue-500
  foreground: '#0f172a',     // slate-900
  popover: '#ffffff',        // white
  input: '#f8fafc',          // slate-50
};

const darkColors = {
  primary: '#60a5fa',        // blue-400
  secondary: '#3b82f6',      // blue-500
  accent: '#67e8f9',         // cyan-300
  background: '#0f172a',     // slate-900
  surface: '#1e293b',        // slate-800
  card: '#1e293b',           // slate-800
  text: '#f8fafc',           // slate-50
  textSecondary: '#cbd5e1',  // slate-300
  textMuted: '#94a3b8',      // slate-400
  border: '#334155',         // slate-700
  success: '#4ade80',        // green-400
  warning: '#fbbf24',        // amber-400
  error: '#f87171',          // red-400
  destructive: '#ef4444',    // red-500
  muted: '#334155',          // slate-700
  ring: '#60a5fa',           // blue-400
  foreground: '#f8fafc',     // slate-50
  popover: '#1e293b',        // slate-800
  input: '#334155',          // slate-700
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
