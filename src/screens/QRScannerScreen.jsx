import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/Card';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

export default function QRScannerScreen({ route, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { title, mode = 'distribution' } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animations for attendance success
  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);

  // Reset state when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      setScanned(false);
      setIsProcessing(false);
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(({ data }) => {
    if (scanned || !isFocused || isProcessing) return;

    // Validate QR code
    if (!data || data.length !== 8) {
      setScanned(true);
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    setScanned(true);
    setIsProcessing(true);

    if (mode === 'attendance') {
      // For attendance mode: navigate to AttendanceResult screen
      navigation.navigate('AttendanceResult', { participantId: data });
    } else {
      // For distribution mode: navigate to distribution screen  
      setTimeout(() => {
        navigation.replace('Distribution', { participantId: data });
      }, 500);
    }
  }, [scanned, isFocused, isProcessing, navigation, mode]);

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Card style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>Camera Access Required</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Please allow camera access to scan QR codes
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestPermission}
            style={styles.button}
          />
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </Card>
      </View>
    );
  }

  const scanFrameSize = Math.min(width * 0.7, 280);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {isFocused && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <Card style={styles.headerCard}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {title || 'Scan QR Code'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {isProcessing 
                  ? 'Processing...' 
                  : mode === 'attendance' 
                    ? 'Point camera at QR code to check attendance'
                    : 'Position the QR code within the frame'
                }
              </Text>
            </Card>
          </View>

          {/* Scan Frame - Centered */}
          <View style={styles.scanAreaContainer}>
            <View style={styles.overlay}>
              {/* Top overlay */}
              <View style={[styles.overlaySection, styles.topOverlay]} />
              
              {/* Middle section with sides and scan area */}
              <View style={[styles.middleSection, { height: scanFrameSize }]}>
                <View style={[styles.overlaySection, styles.sideOverlay]} />
                
                {/* Scan Frame */}
                <View style={[
                  styles.scanFrame, 
                  { 
                    width: scanFrameSize, 
                    height: scanFrameSize,
                    borderColor: isProcessing ? colors.success : colors.primary 
                  }
                ]}>
                  {/* Corner indicators */}
                  <View style={[
                    styles.corner, 
                    styles.topLeft, 
                    { borderColor: isProcessing ? colors.success : colors.primary }
                  ]} />
                  <View style={[
                    styles.corner, 
                    styles.topRight, 
                    { borderColor: isProcessing ? colors.success : colors.primary }
                  ]} />
                  <View style={[
                    styles.corner, 
                    styles.bottomLeft, 
                    { borderColor: isProcessing ? colors.success : colors.primary }
                  ]} />
                  <View style={[
                    styles.corner, 
                    styles.bottomRight, 
                    { borderColor: isProcessing ? colors.success : colors.primary }
                  ]} />
                  
                  {/* Scanning line animation */}
                  {!isProcessing && (
                    <View style={styles.scanLine} />
                  )}
                  
                  {/* Processing indicator */}
                  {isProcessing && (
                    <View style={styles.processingOverlay}>
                      <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                    </View>
                  )}
                </View>
                
                <View style={[styles.overlaySection, styles.sideOverlay]} />
              </View>
              
              {/* Bottom overlay */}
              <View style={[styles.overlaySection, styles.bottomOverlay]} />
            </View>
          </View>

          {/* Footer with tips */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 100 }]}>
            <Card style={styles.tipsCard}>
              <View style={styles.tipRow}>
                <Ionicons name="flash-outline" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  {mode === 'attendance' 
                    ? 'Hold steady for attendance checking'
                    : 'Hold steady and ensure good lighting'
                  }
                </Text>
              </View>
            </Card>
          </View>

          {/* Cancel Button - Fixed position */}
          <View style={[styles.cancelContainer, { bottom: insets.bottom + 20 }]}>
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.cancelButton}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  permissionCard: { padding: 32, alignItems: 'center', gap: 16, maxWidth: 300 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  button: { width: '100%', marginTop: 8 },
  
  // Header
  header: { position: 'absolute', top: 0, left: 16, right: 16, zIndex: 10 },
  headerCard: { padding: 16, alignItems: 'center', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, textAlign: 'center' },
  
  // Scan Area - Centered and responsive
  scanAreaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlaySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  topOverlay: {
    flex: 1,
  },
  middleSection: {
    flexDirection: 'row',
  },
  sideOverlay: {
    flex: 1,
  },
  bottomOverlay: {
    flex: 1,
  },
  scanFrame: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 20,
  },
  
  // Corner indicators
  corner: { 
    position: 'absolute', 
    width: 25, 
    height: 25, 
    borderWidth: 4 
  },
  topLeft: { 
    top: -2, 
    left: -2, 
    borderRightWidth: 0, 
    borderBottomWidth: 0, 
    borderTopLeftRadius: 20 
  },
  topRight: { 
    top: -2, 
    right: -2, 
    borderLeftWidth: 0, 
    borderBottomWidth: 0, 
    borderTopRightRadius: 20 
  },
  bottomLeft: { 
    bottom: -2, 
    left: -2, 
    borderRightWidth: 0, 
    borderTopWidth: 0, 
    borderBottomLeftRadius: 20 
  },
  bottomRight: { 
    bottom: -2, 
    right: -2, 
    borderLeftWidth: 0, 
    borderTopWidth: 0, 
    borderBottomRightRadius: 20 
  },
  
  // Scan line animation
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: '#00E5A8',
    opacity: 0.8,
  },
  
  // Processing overlay
  processingOverlay: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'absolute' 
  },
  
  // Footer
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 16, 
    right: 16 
  },
  tipsCard: { padding: 12, borderRadius: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { fontSize: 12, flex: 1 },
  
  // Cancel button
  cancelContainer: { 
    position: 'absolute', 
    left: 16, 
    right: 16 
  },
  cancelButton: { 
    borderRadius: 12,
    paddingVertical: 16,
  },
});
