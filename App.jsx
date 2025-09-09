import React, { useEffect, useState, useCallback } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as Updates from 'expo-updates';
import { useCameraPermissions } from 'expo-camera';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingSpinner from './src/components/LoadingSpinner';

enableScreens();
SplashScreen.preventAutoHideAsync();

const getToastConfig = (colors) => ({
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: colors.success,
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderRadius: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: colors.error,
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderRadius: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
      }}
    />
  ),
});

function AppContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const prepare = useCallback(async () => {
    try {
      await Font.loadAsync({});
      
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
          }
        } catch (updateError) {
          console.warn('Update check failed:', updateError);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.warn('App preparation failed:', e);
      Alert.alert(
        'Initialization Error',
        'The app encountered an issue during startup. Some features may not work properly.',
        [{ text: 'Continue', style: 'default' }]
      );
    } finally {
      setAppIsReady(true);
    }
  }, [cameraPermission, requestCameraPermission]);

  useEffect(() => {
    prepare();
  }, [prepare]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        console.log('App is active');
      }
    });
    return () => subscription.remove();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <LoadingSpinner message="Loading Event Management..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background
      }}
      onLayout={onLayoutRootView}
    >
      <ExpoStatusBar style="dark" backgroundColor={colors.background} />
      <AppNavigator cameraPermission={cameraPermission} />
      <Toast 
        config={getToastConfig(colors)}
        position="top"
        topOffset={insets.top + 10}
        visibilityTime={4000}
        autoHide={true}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
