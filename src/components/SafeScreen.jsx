import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

export default function SafeScreen({ 
  children, 
  style, 
  edges = ['bottom'],
  backgroundColor,
  ...props 
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? Math.max(insets.bottom, 8) : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View 
      style={[
        { 
          flex: 1, 
          backgroundColor: backgroundColor || colors.background 
        },
        paddingStyle,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}
